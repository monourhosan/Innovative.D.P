const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireSupervisor, requireSupervisorOrAdmin } = require('../middleware/auth');

/**
 * GET /api/v1/supervisor/dashboard
 * Live stats for this supervisor: total team members, total submissions,
 * per-member submission counts + recent feed
 */
router.get('/dashboard', requireSupervisorOrAdmin, (req, res) => {
  try {
    const supervisorId = req.user.role === 'ADMIN' && req.query.supervisor_id
      ? parseInt(req.query.supervisor_id, 10)
      : req.user.id;

    const todayStr = new Date().toISOString().substring(0, 10);

    // Total Team Members under this supervisor
    const totalTeamMembers = db.queryOne(`
      SELECT COUNT(*) AS count 
      FROM users 
      WHERE role = 'TEAM_MEMBER' AND created_by = ?
    `, supervisorId)?.count || 0;

    // Total Submissions collected by this supervisor's team
    const totalSubmissions = db.queryOne(`
      SELECT COUNT(*) AS count 
      FROM submissions 
      WHERE supervisor_id = ?
    `, supervisorId)?.count || 0;

    // Submissions today
    const submissionsToday = db.queryOne(`
      SELECT COUNT(*) AS count 
      FROM submissions 
      WHERE supervisor_id = ? AND date(server_timestamp) = date(?)
    `, supervisorId, todayStr)?.count || 0;

    // Assigned projects
    const assignedProjects = db.queryAll(`
      SELECT p.id, p.title, p.status
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.user_id = ?
    `, supervisorId);

    // Per-member submission counts and status
    const teamMembers = db.queryAll(`
      SELECT 
        u.id,
        u.user_id,
        u.full_name,
        u.plain_password,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.team_member_id = u.id) AS total_submissions,
        (SELECT COUNT(*) FROM submissions s WHERE s.team_member_id = u.id AND date(s.server_timestamp) = date(?)) AS submissions_today,
        (SELECT MAX(s.server_timestamp) FROM submissions s WHERE s.team_member_id = u.id) AS last_submission
      FROM users u
      WHERE u.role = 'TEAM_MEMBER' AND u.created_by = ?
      ORDER BY total_submissions DESC, u.id ASC
    `, todayStr, supervisorId);

    // Recent feed for this supervisor's team
    const recentFeed = db.queryAll(`
      SELECT 
        s.id,
        s.project_id,
        p.title AS project_title,
        s.team_member_id,
        tm.full_name AS team_member_name,
        tm.user_id AS team_member_user_id,
        s.answers_json,
        s.client_timestamp,
        s.server_timestamp
      FROM submissions s
      JOIN projects p ON s.project_id = p.id
      JOIN users tm ON s.team_member_id = tm.id
      WHERE s.supervisor_id = ?
      ORDER BY s.id DESC
      LIMIT 15
    `, supervisorId);

    for (const item of recentFeed) {
      try {
        item.answers = JSON.parse(item.answers_json);
      } catch (e) {
        item.answers = {};
      }
    }

    return res.json({
      success: true,
      stats: {
        total_team_members: totalTeamMembers,
        total_submissions: totalSubmissions,
        submissions_today: submissionsToday,
        active_projects_count: assignedProjects.length
      },
      assigned_projects: assignedProjects,
      team_members: teamMembers,
      recent_feed: recentFeed
    });
  } catch (err) {
    console.error('Supervisor dashboard error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/supervisor/team-members
 * Lists all Team Members created by the logged-in Supervisor
 */
router.get('/team-members', requireSupervisorOrAdmin, (req, res) => {
  try {
    const supervisorId = req.user.role === 'ADMIN' && req.query.supervisor_id
      ? parseInt(req.query.supervisor_id, 10)
      : req.user.id;

    const members = db.queryAll(`
      SELECT 
        u.id,
        u.user_id,
        u.full_name,
        u.plain_password,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.team_member_id = u.id) AS total_submissions,
        (SELECT MAX(s.server_timestamp) FROM submissions s WHERE s.team_member_id = u.id) AS last_submission
      FROM users u
      WHERE u.role = 'TEAM_MEMBER' AND u.created_by = ?
      ORDER BY u.id DESC
    `, supervisorId);

    return res.json({
      success: true,
      count: members.length,
      team_members: members
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/supervisor/team-members
 * Creates a new Team Member with full_name, user_id, and password,
 * automatically linked to this Supervisor and their projects
 */
router.post('/team-members', requireSupervisorOrAdmin, (req, res) => {
  try {
    const supervisorId = req.user.role === 'ADMIN' && req.body.supervisor_id
      ? parseInt(req.body.supervisor_id, 10)
      : req.user.id;

    const { full_name, user_id, password } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Team member full name is required.' });
    }

    // Auto-generate User ID if not provided (e.g. TM-1042)
    let finalUserId = user_id ? String(user_id).trim() : null;
    if (!finalUserId) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      finalUserId = `TM-${randomNum}`;
    }

    // Check user_id uniqueness
    const existing = db.queryOne('SELECT id FROM users WHERE LOWER(user_id) = LOWER(?)', finalUserId);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `User ID "${finalUserId}" is already in use. Please enter a different User ID.`
      });
    }

    const finalPassword = password && String(password).trim()
      ? String(password).trim()
      : `tm${Math.floor(1000 + Math.random() * 9000)}`;

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(finalPassword, salt);

    const result = db.execute(`
      INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
      VALUES (?, ?, ?, ?, 'TEAM_MEMBER', ?, 1)
    `, finalUserId, passwordHash, finalPassword, full_name.trim(), supervisorId);

    const newMemberId = result.lastInsertRowid;

    const createdMember = db.queryOne(`
      SELECT id, user_id, full_name, plain_password, role, created_by, is_active, created_at
      FROM users WHERE id = ?
    `, newMemberId);

    return res.status(201).json({
      success: true,
      message: 'Team Member created successfully!',
      team_member: {
        ...createdMember,
        supervisor_id: supervisorId
      }
    });
  } catch (err) {
    console.error('Error creating team member:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
