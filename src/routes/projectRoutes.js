const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const { parseXlsxFile } = require('../services/xlsxParser');
const {
  createXlsFormSampleWorkbook,
  createSimpleTableSampleWorkbook
} = require('../services/sampleTemplates');
const db = require('../db');

/**
 * GET /api/v1/projects/sample/xlsform
 * Download sample KoboToolbox / XLSForm Excel file
 */
router.get('/sample/xlsform', (req, res) => {
  try {
    const buffer = createXlsFormSampleWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Kobo_XLSForm_Sample_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating XLSForm sample:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate XLSForm template.' });
  }
});

/**
 * GET /api/v1/projects/sample/simple-table
 * Download sample Simple Table Excel file
 */
router.get('/sample/simple-table', (req, res) => {
  try {
    const buffer = createSimpleTableSampleWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Simple_Table_Sample_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating Simple Table sample:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate Simple Table template.' });
  }
});

/**
 * POST /api/v1/projects/parse-xlsx
 * Upload and parse Excel file for visual preview before publishing
 */
router.post('/parse-xlsx', requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please choose an .xlsx or .xls file to upload.' });
    }

    const schema = parseXlsxFile(req.file.buffer);

    // Derive a friendly suggested title from original filename
    const suggestedTitle = req.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    return res.json({
      success: true,
      filename: req.file.originalname,
      suggested_title: suggestedTitle,
      schema
    });
  } catch (err) {
    console.error('XLSX parsing error:', err);
    return res.status(400).json({
      success: false,
      error: `Could not parse Excel file: ${err.message}`
    });
  }
});

/**
 * POST /api/v1/projects
 * Publish project after Admin confirms preview
 */
router.post('/', requireAdmin, (req, res) => {
  try {
    const { title, description, form_schema_json, original_xlsx_filename, assigned_supervisor_ids } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Project title is required.' });
    }

    if (!form_schema_json) {
      return res.status(400).json({ success: false, error: 'Form schema is required.' });
    }

    const schemaStr = typeof form_schema_json === 'string'
      ? form_schema_json
      : JSON.stringify(form_schema_json);

    const result = db.execute(`
      INSERT INTO projects (title, description, form_schema_json, original_xlsx_filename, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `, title.trim(), (description || '').trim(), schemaStr, original_xlsx_filename || '');

    const projectId = result.lastInsertRowid;

    // Assign supervisors if provided
    if (Array.isArray(assigned_supervisor_ids)) {
      for (const supId of assigned_supervisor_ids) {
        db.execute(`
          INSERT OR IGNORE INTO project_assignments (project_id, user_id)
          VALUES (?, ?)
        `, projectId, supId);
      }
    }

    const createdProject = db.queryOne('SELECT * FROM projects WHERE id = ?', projectId);

    return res.status(201).json({
      success: true,
      message: 'Project published successfully!',
      project: createdProject
    });
  } catch (err) {
    console.error('Project creation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/projects
 * List all projects with submission counts and supervisor assignments
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const projects = db.queryAll(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.project_id = p.id) AS total_submissions,
        (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id) AS assigned_supervisors_count
      FROM projects p
      ORDER BY p.id DESC
    `);

    // Parse schema string to json summary for cleaner response
    const parsed = projects.map(p => {
      let schemaObj = null;
      try {
        schemaObj = JSON.parse(p.form_schema_json);
      } catch (e) {
        schemaObj = { fields: [] };
      }
      return {
        ...p,
        total_fields: schemaObj.fields ? schemaObj.fields.length : 0,
        mode: schemaObj.mode || 'unknown'
      };
    });

    return res.json({ success: true, count: parsed.length, projects: parsed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/projects/:id
 * Get single project details with full schema
 */
router.get('/:id', requireAuth, (req, res) => {
  try {
    const project = db.queryOne('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    let schemaObj = {};
    try {
      schemaObj = JSON.parse(project.form_schema_json);
    } catch (e) {
      schemaObj = {};
    }

    // Get assigned supervisors
    const assignedSupervisors = db.queryAll(`
      SELECT u.id, u.user_id, u.full_name
      FROM project_assignments pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.project_id = ?
    `, project.id);

    return res.json({
      success: true,
      project: {
        ...project,
        form_schema: schemaObj,
        assigned_supervisors: assignedSupervisors
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/v1/projects/:id
 * Update project title, description, status, and supervisor assignments
 */
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { title, description, status, assigned_supervisor_ids } = req.body;
    const project = db.queryOne('SELECT * FROM projects WHERE id = ?', req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    db.execute(`
      UPDATE projects
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status)
      WHERE id = ?
    `, title ? title.trim() : null, description !== undefined ? description : null, status || null, project.id);

    if (Array.isArray(assigned_supervisor_ids)) {
      db.execute('DELETE FROM project_assignments WHERE project_id = ?', project.id);
      for (const supId of assigned_supervisor_ids) {
        db.execute('INSERT INTO project_assignments (project_id, user_id) VALUES (?, ?)', project.id, supId);
      }
    }

    return res.json({ success: true, message: 'Project updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/v1/projects/:id
 * Delete project and related data
 */
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const project = db.queryOne('SELECT * FROM projects WHERE id = ?', req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    db.execute('DELETE FROM projects WHERE id = ?', project.id);

    return res.json({ success: true, message: `Project "${project.title}" deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
