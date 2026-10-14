const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireSupervisorOrAdmin } = require('../middleware/auth');
const { exportSubmissionsToXlsx } = require('../services/xlsxExporter');

/**
 * GET /api/v1/submissions
 * Search and filter submissions for table view
 */
router.get('/submissions', requireSupervisorOrAdmin, (req, res) => {
  try {
    const { project_id, supervisor_id, date_from, date_to, search } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.project_id,
        p.title AS project_title,
        p.form_schema_json,
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
      JOIN projects p ON s.project_id = p.id
      JOIN users tm ON s.team_member_id = tm.id
      LEFT JOIN users sup ON s.supervisor_id = sup.id
      WHERE 1=1
    `;

    const params = [];

    // Role scoping: If supervisor, restrict to their own team submissions
    if (req.user.role === 'SUPERVISOR') {
      sql += ' AND s.supervisor_id = ?';
      params.push(req.user.id);
    } else if (supervisor_id) {
      sql += ' AND s.supervisor_id = ?';
      params.push(parseInt(supervisor_id, 10));
    }

    if (project_id) {
      sql += ' AND s.project_id = ?';
      params.push(parseInt(project_id, 10));
    }

    if (date_from) {
      sql += ' AND date(s.server_timestamp) >= date(?)';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND date(s.server_timestamp) <= date(?)';
      params.push(date_to);
    }

    if (search && search.trim()) {
      sql += ' AND (tm.full_name LIKE ? OR tm.user_id LIKE ? OR s.answers_json LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY s.id DESC LIMIT 500';

    const submissions = db.queryAll(sql, ...params);

    for (const sub of submissions) {
      try {
        sub.answers = JSON.parse(sub.answers_json);
      } catch (e) {
        sub.answers = {};
      }
    }

    return res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (err) {
    console.error('Error fetching submissions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/export/submissions.xlsx
 * Export project submissions to a styled .xlsx file
 */
router.get('/export/submissions.xlsx', requireSupervisorOrAdmin, (req, res) => {
  try {
    const { project_id, supervisor_id, date_from, date_to } = req.query;

    if (!project_id) {
      return res.status(400).json({ success: false, error: 'project_id is required to export data.' });
    }

    const project = db.queryOne('SELECT * FROM projects WHERE id = ?', parseInt(project_id, 10));
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    let sql = `
      SELECT 
        s.id,
        s.project_id,
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
      JOIN users tm ON s.team_member_id = tm.id
      LEFT JOIN users sup ON s.supervisor_id = sup.id
      WHERE s.project_id = ?
    `;

    const params = [project.id];

    if (req.user.role === 'SUPERVISOR') {
      sql += ' AND s.supervisor_id = ?';
      params.push(req.user.id);
    } else if (supervisor_id) {
      sql += ' AND s.supervisor_id = ?';
      params.push(parseInt(supervisor_id, 10));
    }

    if (date_from) {
      sql += ' AND date(s.server_timestamp) >= date(?)';
      params.push(date_from);
    }

    if (date_to) {
      sql += ' AND date(s.server_timestamp) <= date(?)';
      params.push(date_to);
    }

    sql += ' ORDER BY s.id ASC';

    const submissions = db.queryAll(sql, ...params);

    const buffer = exportSubmissionsToXlsx(project, submissions);

    // Format clean filename: Project_Title_Export_YYYY-MM-DD.xlsx
    const safeTitle = (project.title || 'Data_Export')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .substring(0, 30);
    const dateStamp = new Date().toISOString().substring(0, 10);
    const filename = `${safeTitle}_Export_${dateStamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating Excel export:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Excel export.' });
  }
});

module.exports = router;
