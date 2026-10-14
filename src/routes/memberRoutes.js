const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const sseManager = require('../services/sseManager');

/**
 * GET /api/v1/member/projects
 * Returns active projects and their form_schema_json assigned to the Team Member's Supervisor
 */
router.get('/projects', requireAuth, (req, res) => {
  try {
    let supervisorId = null;

    if (req.user.role === 'TEAM_MEMBER') {
      supervisorId = req.user.supervisor_id || req.user.created_by;
      if (!supervisorId) {
        // Fetch from DB if not in token
        const userRec = db.queryOne('SELECT created_by FROM users WHERE id = ?', req.user.id);
        supervisorId = userRec ? userRec.created_by : null;
      }
    } else if (req.user.role === 'SUPERVISOR') {
      supervisorId = req.user.id;
    }

    let projects = [];
    if (req.user.role === 'ADMIN' || !supervisorId) {
      // Admin sees all active projects
      projects = db.queryAll("SELECT * FROM projects WHERE status = 'ACTIVE' ORDER BY id DESC");
    } else {
      // Find projects assigned to this supervisor
      projects = db.queryAll(`
        SELECT p.*
        FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.user_id = ? AND p.status = 'ACTIVE'
        ORDER BY p.id DESC
      `, supervisorId);
    }

    // Parse form_schema_json
    const formatted = projects.map(p => {
      let schemaObj = {};
      try {
        schemaObj = JSON.parse(p.form_schema_json);
      } catch (e) {
        schemaObj = { fields: [] };
      }
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        form_schema: schemaObj,
        created_at: p.created_at
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      projects: formatted
    });
  } catch (err) {
    console.error('Error fetching member projects:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/member/submissions
 * Submits collected form data. Supports single or batch offline sync.
 */
router.post('/submissions', requireAuth, (req, res) => {
  try {
    const body = req.body;
    let itemsToProcess = [];

    if (Array.isArray(body)) {
      itemsToProcess = body;
    } else if (Array.isArray(body.submissions)) {
      itemsToProcess = body.submissions;
    } else if (body.project_id) {
      itemsToProcess = [body];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid submission payload. Provide project_id and answers_json.'
      });
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ success: false, error: 'No submission items provided.' });
    }

    // Determine team member and supervisor IDs
    const teamMemberId = req.user.id;
    let supervisorId = null;

    if (req.user.role === 'TEAM_MEMBER') {
      const u = db.queryOne('SELECT created_by FROM users WHERE id = ?', teamMemberId);
      supervisorId = u ? u.created_by : null;
    } else if (req.user.role === 'SUPERVISOR') {
      supervisorId = req.user.id;
    }

    const insertedIds = [];

    for (const item of itemsToProcess) {
      const { project_id, answers_json, answers, client_timestamp } = item;

      if (!project_id) continue;

      const rawAnswers = answers_json || answers || {};
      const answersStr = typeof rawAnswers === 'string'
        ? rawAnswers
        : JSON.stringify(rawAnswers);

      const clientTime = client_timestamp || new Date().toISOString();

      const result = db.execute(`
        INSERT INTO submissions (project_id, team_member_id, supervisor_id, answers_json, client_timestamp)
        VALUES (?, ?, ?, ?, ?)
      `, project_id, teamMemberId, supervisorId, answersStr, clientTime);

      const subId = result.lastInsertRowid;
      insertedIds.push(subId);

      // Fetch enriched record for real-time live feed broadcast
      const enriched = db.queryOne(`
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
        WHERE s.id = ?
      `, subId);

      if (enriched) {
        try {
          enriched.answers = JSON.parse(enriched.answers_json);
        } catch (e) {
          enriched.answers = {};
        }
        // Broadcast to all live monitoring dashboards via SSE!
        sseManager.broadcast('new_submission', enriched);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Successfully recorded ${insertedIds.length} submission(s).`,
      count: insertedIds.length,
      submission_ids: insertedIds
    });
  } catch (err) {
    console.error('Submission recording error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/member/dashboard
 * Returns the Team Member's personal live stats (today's count, total count, recent submissions list)
 */
router.get('/dashboard', requireAuth, (req, res) => {
  try {
    const memberId = req.user.id;
    const todayStr = new Date().toISOString().substring(0, 10);

    const totalCount = db.queryOne(`
      SELECT COUNT(*) AS count 
      FROM submissions 
      WHERE team_member_id = ?
    `, memberId)?.count || 0;

    const todayCount = db.queryOne(`
      SELECT COUNT(*) AS count 
      FROM submissions 
      WHERE team_member_id = ? AND date(server_timestamp) = date(?)
    `, memberId, todayStr)?.count || 0;

    const recentSubmissions = db.queryAll(`
      SELECT 
        s.id,
        s.project_id,
        p.title AS project_title,
        s.answers_json,
        s.client_timestamp,
        s.server_timestamp
      FROM submissions s
      JOIN projects p ON s.project_id = p.id
      WHERE s.team_member_id = ?
      ORDER BY s.id DESC
      LIMIT 15
    `, memberId);

    for (const sub of recentSubmissions) {
      try {
        sub.answers = JSON.parse(sub.answers_json);
      } catch (e) {
        sub.answers = {};
      }
    }

    return res.json({
      success: true,
      stats: {
        today_count: todayCount,
        total_count: totalCount
      },
      recent_submissions: recentSubmissions
    });
  } catch (err) {
    console.error('Member dashboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
