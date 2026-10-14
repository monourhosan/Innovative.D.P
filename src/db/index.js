// ==============================================================================
// Innovative Data Platform - Resilient Database Layer
// Author: Made by Saif
// Dual Engine: Native Node.js 22 SQLite (node:sqlite) + WebAssembly Fallback (sql.js)
// ==============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');
const config = require('../config');

let DatabaseSync = null;
let useSqlJs = false;
let db = null;
let sqlDb = null;
let isInitialized = false;

// Attempt to load native node:sqlite (Node 22.5+)
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.warn('[Database] Native node:sqlite not present in runtime. Activating WebAssembly sql.js fallback.');
  useSqlJs = true;
}

// Resilient multi-tier database opener for native SQLite
function openNativeDatabase() {
  const candidates = [
    config.databasePath,
    path.resolve(process.cwd(), 'data', 'platform.db'),
    path.resolve(process.cwd(), 'platform.db'),
    path.join(os.tmpdir(), 'platform.db'),
    ':memory:'
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      if (candidate !== ':memory:') {
        const dir = path.dirname(candidate);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }
      const instance = new DatabaseSync(candidate);
      console.log(`[Database] Native SQLite active at: ${candidate}`);
      return instance;
    } catch (err) {
      console.warn(`[Database] Candidate '${candidate}' failed (${err.message}). Trying next fallback...`);
    }
  }
  throw new Error('All native SQLite database candidates failed to initialize.');
}

const SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plain_password TEXT,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'SUPERVISOR', 'TEAM_MEMBER')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    form_schema_json TEXT NOT NULL,
    original_xlsx_filename TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'ARCHIVED')),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS project_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    answers_json TEXT NOT NULL,
    client_timestamp TEXT,
    server_timestamp TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
  CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON project_assignments(user_id);
  CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON project_assignments(project_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_team_member ON submissions(team_member_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_supervisor ON submissions(supervisor_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_timestamp ON submissions(server_timestamp);
`;

function cleanRow(row) {
  if (!row) return null;
  return Object.assign({}, row);
}

// Unified Query Helpers
const dbHelper = {
  ensureReady,

  queryAll(sql, ...params) {
    if (useSqlJs && sqlDb) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(cleanRow(stmt.getAsObject()));
      }
      stmt.free();
      return rows;
    }
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(r => cleanRow(r));
  },

  queryOne(sql, ...params) {
    if (useSqlJs && sqlDb) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params);
      let row = null;
      if (stmt.step()) {
        row = cleanRow(stmt.getAsObject());
      }
      stmt.free();
      return row;
    }
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return cleanRow(row);
  },

  execute(sql, ...params) {
    if (useSqlJs && sqlDb) {
      sqlDb.run(sql, params);
      const idRes = sqlDb.exec('SELECT last_insert_rowid() AS id;');
      const lastInsertRowid = idRes.length > 0 && idRes[0].values.length > 0 ? idRes[0].values[0][0] : null;
      return { lastInsertRowid };
    }
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    if (useSqlJs && sqlDb) {
      return sqlDb.exec(sql);
    }
    return db.exec(sql);
  },

  transaction(callback) {
    dbHelper.exec('BEGIN TRANSACTION;');
    try {
      const result = callback(dbHelper);
      dbHelper.exec('COMMIT;');
      return result;
    } catch (err) {
      dbHelper.exec('ROLLBACK;');
      throw err;
    }
  }
};

function initSchema() {
  if (isInitialized) return;
  dbHelper.exec(SCHEMA_DDL);

  // Seed default admin if missing
  const adminCheck = dbHelper.queryOne('SELECT id FROM users WHERE role = ? LIMIT 1', 'ADMIN');
  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(config.defaultAdminPass, salt);
    dbHelper.execute(`
      INSERT INTO users (user_id, password_hash, plain_password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 'ADMIN', 1)
    `, config.defaultAdminUser, hash, config.defaultAdminPass, 'Platform Administrator');
    console.log(`[Database] Seeded default Admin user: ${config.defaultAdminUser} / ${config.defaultAdminPass}`);
  }
  isInitialized = true;
}

let readyPromise = null;

function ensureReady() {
  if (readyPromise) return readyPromise;

  if (!useSqlJs && DatabaseSync) {
    try {
      db = openNativeDatabase();
      try {
        db.exec('PRAGMA foreign_keys = ON;');
        db.exec('PRAGMA journal_mode = WAL;');
      } catch (e) {
        console.warn('[Database] PRAGMA WAL warning:', e.message);
      }
      initSchema();
      readyPromise = Promise.resolve();
      return readyPromise;
    } catch (err) {
      console.warn('[Database] Native SQLite open failed. Falling back to sql.js...', err.message);
      useSqlJs = true;
    }
  }

  // sql.js WebAssembly Engine fallback
  const initSqlJs = require('sql.js');
  readyPromise = initSqlJs().then(SQL => {
    sqlDb = new SQL.Database();
    initSchema();
    console.log('[Database] WebAssembly sql.js SQLite database initialized successfully.');
  });
  return readyPromise;
}

// Kick off initialization immediately on module load
ensureReady();

module.exports = dbHelper;
