const XLSX = require('xlsx');

/**
 * Generate an Excel file buffer from project submissions
 * @param {Object} project - The project record
 * @param {Array} submissions - List of submission records with joined member & supervisor info
 * @returns {Buffer} Excel workbook buffer
 */
function exportSubmissionsToXlsx(project, submissions = []) {
  const wb = XLSX.utils.book_new();

  // Parse project schema
  let schema = { fields: [] };
  try {
    schema = typeof project.form_schema_json === 'string'
      ? JSON.parse(project.form_schema_json)
      : (project.form_schema_json || { fields: [] });
  } catch (err) {
    console.error('Error parsing form schema for export:', err);
  }

  const fields = schema.fields || [];

  // Build rows
  const rows = submissions.map((sub, idx) => {
    let answers = {};
    try {
      answers = typeof sub.answers_json === 'string'
        ? JSON.parse(sub.answers_json)
        : (sub.answers_json || {});
    } catch (e) {
      answers = {};
    }

    const rowObj = {
      'Submission ID': sub.id || (idx + 1),
      'Submitted At': sub.server_timestamp || '',
      'Device Timestamp': sub.client_timestamp || '',
      'Supervisor Name': sub.supervisor_name || 'N/A',
      'Supervisor ID': sub.supervisor_user_id || 'N/A',
      'Team Member Name': sub.team_member_name || 'N/A',
      'Team Member ID': sub.team_member_user_id || 'N/A'
    };

    // Add dynamic form fields
    for (const f of fields) {
      const headerTitle = f.label || f.name || f.id;
      // Search in answers by f.name or f.id or f.original_name
      let val = answers[f.name];
      if (val === undefined && f.id) val = answers[f.id];
      if (val === undefined && f.original_name) val = answers[f.original_name];

      // Format arrays (e.g. multi-select) or objects (e.g. gps)
      if (Array.isArray(val)) {
        val = val.join(', ');
      } else if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      } else if (val === undefined || val === null) {
        val = '';
      }

      rowObj[headerTitle] = val;
    }

    return rowObj;
  });

  // If no submissions exist yet, create an empty template row with headers
  if (rows.length === 0) {
    const emptyRow = {
      'Submission ID': '',
      'Submitted At': '',
      'Device Timestamp': '',
      'Supervisor Name': '',
      'Supervisor ID': '',
      'Team Member Name': '',
      'Team Member ID': ''
    };
    for (const f of fields) {
      emptyRow[f.label || f.name || f.id] = '';
    }
    rows.push(emptyRow);
  }

  // Create primary worksheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto calculate column widths
  const colKeys = Object.keys(rows[0] || {});
  const colWidths = colKeys.map(key => {
    let maxLen = key.length;
    for (const row of rows.slice(0, 50)) {
      const valStr = String(row[key] || '');
      if (valStr.length > maxLen) maxLen = valStr.length;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 14), 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

  // Add Summary / Metadata sheet
  const summaryData = [
    { Property: 'Platform', Value: 'Innovative Data Platform' },
    { Property: 'Attribution', Value: 'Made by Saif for Innovative Research & Consultancy Ltd.' },
    { Property: 'Project Title', Value: project.title || 'Untitled Project' },
    { Property: 'Total Records Exported', Value: submissions.length },
    { Property: 'Total Dynamic Questions', Value: fields.length },
    { Property: 'Export Timestamp', Value: new Date().toISOString().replace('T', ' ').substring(0, 19) }
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 28 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Export Info');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  exportSubmissionsToXlsx
};
