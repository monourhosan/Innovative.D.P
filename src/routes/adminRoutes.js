const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

/**
 * GET /api/v1/admin/dashboard-stats
 * Returns top-level summary cards, supervisor breakdown, and recent live feed
 */
router.get('/dashboard-stats', requireAdmin, (req, res) => {
  try {
    // 1. Top-Level Summary
    const totalProjects = db.queryOne("SELECT COUNT(*) AS count FROM projects WHERE status = 'ACTIVE'")?.count || 0;
    const totalSupervisors = db.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'SUPERVISOR'")?.count || 0;
    const totalTeamMembers = db.queryOne("SELECT COUNT(*) AS count FROM users WHERE role = 'TEAM_MEMBER'")?.count || 0;
    const totalSubmissions = db.queryOne('SELECT COUNT(*) AS count FROM submissions')?.count || 0;

    // Submissions today (server_timestamp starts with today's date YYYY-MM-DD)
    const todayStr = new Date().toISOString().substring(0, 10);
    const submissionsToday = db.queryOne(
      'SELECT COUNT(*) AS count FROM submissions WHERE date(server_timestamp) = date(?)',
      todayStr
    )?.count || 0;

    // 2. Supervisor Breakdown
    const supervisors = db.queryAll(`
      SELECT 
        u.id,
        u.user_id,
        u.full_name,
        u.plain_password,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM users tm WHERE tm.role = 'TEAM_MEMBER' AND tm.created_by = u.id) AS team_members_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.supervisor_id = u.id) AS total_submissions,
        (SELECT COUNT(*) FROM submissions s WHERE s.supervisor_id = u.id AND date(s.server_timestamp) = date(?)) AS submissions_today,
        (SELECT MAX(s.server_timestamp) FROM submissions s WHERE s.supervisor_id = u.id) AS last_submission_at
      FROM users u
      WHERE u.role = 'SUPERVISOR'
      ORDER BY total_submissions DESC, u.id ASC
    `, todayStr);

    // Attach assigned project titles to each supervisor
    for (const sup of supervisors) {
      const assigned = db.queryAll(`
        SELECT p.id, p.title
        FROM project_assignments pa
        JOIN projects p ON pa.project_id = p.id
        WHERE pa.user_id = ?
      `, sup.id);
      sup.assigned_projects = assigned;
    }

    // 3. Real-Time Live Feed (last 20 submissions)
    const recentSubmissions = db.queryAll(`
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
      ORDER BY s.id DESC
      LIMIT 20
    `);

    // Parse answers_json for quick display in feed
    for (const sub of recentSubmissions) {
      try {
        sub.answers = JSON.parse(sub.answers_json);
      } catch (e) {
        sub.answers = {};
      }
    }

    return res.json({
      success: true,
      summary: {
        total_projects: totalProjects,
        total_supervisors: totalSupervisors,
        total_team_members: totalTeamMembers,
        total_submissions: totalSubmissions,
        submissions_today: submissionsToday
      },
      supervisors,
      recent_submissions: recentSubmissions
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/admin/supervisors
 * List all supervisor accounts
 */
router.get('/supervisors', requireAdmin, (req, res) => {
  try {
    const supervisors = db.queryAll(`
      SELECT 
        u.id,
        u.user_id,
        u.full_name,
        u.plain_password,
        u.is_active,
        u.created_at,
        (SELECT COUNT(*) FROM users tm WHERE tm.role = 'TEAM_MEMBER' AND tm.created_by = u.id) AS team_members_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.supervisor_id = u.id) AS total_submissions
      FROM users u
      WHERE u.role = 'SUPERVISOR'
      ORDER BY u.id DESC
    `);

    for (const sup of supervisors) {
      const assigned = db.queryAll(`
        SELECT p.id, p.title
        FROM project_assignments pa
        JOIN projects p ON pa.project_id = p.id
        WHERE pa.user_id = ?
      `, sup.id);
      sup.assigned_projects = assigned;
    }

    return res.json({ success: true, count: supervisors.length, supervisors });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/admin/supervisors
 * Create a new supervisor account
 */
router.post('/supervisors', requireAdmin, (req, res) => {
  try {
    const { full_name, user_id, password, assigned_project_ids } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Supervisor name is required.' });
    }

    // Auto-generate User ID if not supplied (e.g., SUP-1042)
    let finalUserId = user_id ? String(user_id).trim() : null;
    if (!finalUserId) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      finalUserId = `SUP-${randomNum}`;
    }

    // Check uniqueness
    const existing = db.queryOne('SELECT id FROM users WHERE LOWER(user_id) = LOWER(?)', finalUserId);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `User ID "${finalUserId}" is already in use. Please enter a different User ID.`
      });
    }

    // Default password if not provided
    const finalPassword = password && String(password).trim()
      ? String(password).trim()
      : `sup${Math.floor(1000 + Math.random() * 9000)}`;

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(finalPassword, salt);

    const result = db.execute(`
      INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
      VALUES (?, ?, ?, ?, 'SUPERVISOR', ?, 1)
    `, finalUserId, passwordHash, finalPassword, full_name.trim(), req.user.id);

    const supervisorId = result.lastInsertRowid;

    // Assign projects
    if (Array.isArray(assigned_project_ids)) {
      for (const pId of assigned_project_ids) {
        db.execute(`
          INSERT OR IGNORE INTO project_assignments (project_id, user_id)
          VALUES (?, ?)
        `, pId, supervisorId);
      }
    }

    const createdSup = db.queryOne(`
      SELECT id, user_id, full_name, plain_password, role, is_active, created_at
      FROM users WHERE id = ?
    `, supervisorId);

    const assigned = db.queryAll(`
      SELECT p.id, p.title
      FROM project_assignments pa
      JOIN projects p ON pa.project_id = p.id
      WHERE pa.user_id = ?
    `, supervisorId);
    createdSup.assigned_projects = assigned;

    return res.status(201).json({
      success: true,
      message: 'Supervisor created successfully!',
      supervisor: createdSup
    });
  } catch (err) {
    console.error('Error creating supervisor:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/admin/supervisors/:id
 * Update supervisor details, password, and project assignments
 */
router.put('/supervisors/:id', requireAdmin, (req, res) => {
  try {
    const { full_name, password, is_active, assigned_project_ids } = req.body;
    const supId = req.params.id;

    const supervisor = db.queryOne("SELECT * FROM users WHERE id = ? AND role = 'SUPERVISOR'", supId);
    if (!supervisor) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    let passwordHash = supervisor.password_hash;
    let plainPassword = supervisor.plain_password;
    if (password && String(password).trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      plainPassword = String(password).trim();
      passwordHash = bcrypt.hashSync(plainPassword, salt);
    }

    const updatedFullName = full_name ? String(full_name).trim() : supervisor.full_name;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : supervisor.is_active;

    db.execute(`
      UPDATE users
      SET full_name = ?,
          password_hash = ?,
          plain_password = ?,
          is_active = ?
      WHERE id = ?
    `, updatedFullName, passwordHash, plainPassword, updatedActive, supId);

    // Update project assignments if provided
    if (Array.isArray(assigned_project_ids)) {
      db.execute('DELETE FROM project_assignments WHERE user_id = ?', supId);
      for (const pId of assigned_project_ids) {
        db.execute('INSERT INTO project_assignments (project_id, user_id) VALUES (?, ?)', pId, supId);
      }
    }

    return res.json({ success: true, message: 'Supervisor updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/v1/admin/supervisors/:id
 * Toggle status or remove supervisor
 */
router.delete('/supervisors/:id', requireAdmin, (req, res) => {
  try {
    const supId = req.params.id;
    const supervisor = db.queryOne("SELECT * FROM users WHERE id = ? AND role = 'SUPERVISOR'", supId);
    if (!supervisor) {
      return res.status(404).json({ success: false, error: 'Supervisor not found.' });
    }

    // Toggle active state or permanently delete based on query param
    if (req.query.permanent === 'true') {
      db.execute('DELETE FROM users WHERE id = ?', supId);
      return res.json({ success: true, message: 'Supervisor deleted permanently.' });
    } else {
      const newActive = supervisor.is_active === 1 ? 0 : 1;
      db.execute('UPDATE users SET is_active = ? WHERE id = ?', newActive, supId);
      return res.json({
        success: true,
        message: `Supervisor ${newActive ? 'activated' : 'deactivated'} successfully.`,
        is_active: newActive
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/admin/team-members
 * List all team members across the platform with supervisor info
 */
router.get('/team-members', requireAdmin, (req, res) => {
  try {
    const members = db.queryAll(`
      SELECT 
        tm.id,
        tm.user_id,
        tm.full_name,
        tm.plain_password,
        tm.is_active,
        tm.created_at,
        sup.id AS supervisor_id,
        sup.full_name AS supervisor_name,
        sup.user_id AS supervisor_user_id,
        (SELECT COUNT(*) FROM submissions s WHERE s.team_member_id = tm.id) AS total_submissions
      FROM users tm
      LEFT JOIN users sup ON tm.created_by = sup.id
      WHERE tm.role = 'TEAM_MEMBER'
      ORDER BY tm.id DESC
    `);

    return res.json({ success: true, count: members.length, team_members: members });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
