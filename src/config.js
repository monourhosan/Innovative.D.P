const path = require('path');
require('dotenv').config();

function resolveDbPath() {
  const p = process.env.DATABASE_PATH || process.env.DB_PATH;
  if (!p) return path.resolve(process.cwd(), 'data', 'platform.db');
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8080,
  jwtSecret: process.env.JWT_SECRET || 'innovative_data_platform_secret_key_by_saif_2026_secure',
  databasePath: resolveDbPath(),
  defaultAdminUser: process.env.DEFAULT_ADMIN_USER || 'admin',
  defaultAdminPass: process.env.DEFAULT_ADMIN_PASS || 'admin123',
  appName: 'Innovative Data Platform',
  appAuthor: 'Made by Saif for Innovative Research & Consultancy Ltd.',
  version: '1.0.0'
};
