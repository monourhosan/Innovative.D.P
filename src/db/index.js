let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.error('\n========================================================================');
  console.error(' [CRITICAL ERROR] Failed to load native SQLite module (node:sqlite)');
  console.error(' Innovative Data Platform requires Node.js v22.5.0 or newer.');
  console.error(' Current Node.js version:', process.version);
  console.error(' If deploying on Wasmer.io, please change Node.js Engine to "Node.js"');
  console.error(' or switch the Project Preset to "Dockerfile".');
  console.error('========================================================================\n');
  throw err;
}

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Ensure database directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(config.databasePath);

// Enable WAL mode for concurrency and foreign key constraints
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('SQLite PRAGMA warning:', err.message);
}

// Initialize tables
function initSchema() {
  db.exec(`
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
  `);

  // Seed default admin if missing
  const adminCheck = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('ADMIN');
  if (!adminCheck) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(config.defaultAdminPass, salt);
    db.prepare(`
      INSERT INTO users (user_id, password_hash, plain_password, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 'ADMIN', 1)
    `).run(config.defaultAdminUser, hash, config.defaultAdminPass, 'Platform Administrator');
    console.log(`[Database] Seeded default Admin user: ${config.defaultAdminUser} / ${config.defaultAdminPass}`);
  }
}

// Convert SQLite result object to a clean plain JS object
function cleanRow(row) {
  if (!row) return null;
  return Object.assign({}, row);
}

// Query Helpers
const dbHelper = {
  raw: db,

  queryAll(sql, ...params) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.map(r => cleanRow(r));
  },

  queryOne(sql, ...params) {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return cleanRow(row);
  },

  execute(sql, ...params) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  },

  transaction(callback) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = callback(dbHelper);
      db.exec('COMMIT;');
      return result;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};

// Initialize schema on load
initSchema();

module.exports = dbHelper;
