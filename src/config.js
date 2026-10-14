const path = require('path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'innovative_data_platform_secret_key_by_saif_2026_secure',
  databasePath: process.env.DATABASE_PATH 
    ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
    : path.resolve(process.cwd(), 'data', 'platform.db'),
  defaultAdminUser: process.env.DEFAULT_ADMIN_USER || 'admin',
  defaultAdminPass: process.env.DEFAULT_ADMIN_PASS || 'admin123',
  appName: 'Innovative Data Platform',
  appAuthor: 'Made by Saif',
  version: '1.0.0'
};
