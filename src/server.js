const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');

// Ensure database and schema are initialized
require('./db');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const memberRoutes = require('./routes/memberRoutes');
const liveRoutes = require('./routes/liveRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();

// Security and utility middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Static assets
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint (for Wasmer.io container health probes)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: config.appName,
    author: config.appAuthor,
    version: config.version,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/supervisor', supervisorRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/live', liveRoutes);
app.use('/api/v1', exportRoutes);

// Fallback to index.html for SPA client navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found.' });
  }
  next();
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  if (res.headersSent) return next(err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected error occurred on the server.'
  });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(` 🚀 ${config.appName}`);
  console.log(` 👨‍💻 ${config.appAuthor}`);
  console.log(` 🌐 Server active: http://localhost:${config.port}`);
  console.log(` 📊 Deployment Target: Wasmer.io`);
  console.log('====================================================');
});

module.exports = { app, server };
