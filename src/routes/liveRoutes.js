const express = require('express');
const router = express.Router();
const sseManager = require('../services/sseManager');
const db = require('../db');

/**
 * GET /api/v1/live/stream
 * Server-Sent Events stream for real-time live dashboard updates
 */
router.get('/stream', (req, res) => {
  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.flushHeaders?.();

  // Register client
  sseManager.addClient(res);
});

/**
 * GET /api/v1/live/poll
 * Short-polling fallback for environments where SSE connections are closed prematurely
 */
router.get('/poll', (req, res) => {
  try {
    const afterId = parseInt(req.query.after_id, 10) || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const newSubmissions = db.queryAll(`
      SELECT 
        s.id,
        s.project_id,
        p.title AS project_title,
        s.team_member_id,
        tm.full_name AS team_member_name,
        tm.user_id AS team_member_user_id,
        s.supervisor_id,
        sup.full_name AS supervisor_name,
        sup.user_id AS supervisor_user_id,
        s.answers_json,
        s.client_timestamp,
        s.server_timestamp
      FROM submissions s
      LEFT JOIN projects p ON s.project_id = p.id
      LEFT JOIN users tm ON s.team_member_id = tm.id
      LEFT JOIN users sup ON s.supervisor_id = sup.id
      WHERE s.id > ?
      ORDER BY s.id DESC
      LIMIT ?
    `, afterId, limit);

    res.json({
      success: true,
      count: newSubmissions.length,
      submissions: newSubmissions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
