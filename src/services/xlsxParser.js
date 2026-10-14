const XLSX = require('xlsx');

/**
 * Sanitize column name to alphanumeric identifier
 */
function sanitizeFieldName(name, index) {
  if (!name) return `field_${index + 1}`;
  let cleaned = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!cleaned || /^[0-9]/.test(cleaned)) {
    cleaned = `f_${cleaned || index + 1}`;
  }
  return cleaned;
}

/**
 * Smart type detector for simple spreadsheet headers
 */
function detectTypeFromHeader(headerName) {
  const h = String(headerName).toLowerCase();
  
  if (/\b(age|count|quantity|qty|number_of|amount|salary|cost|price|income|score|household_size)\b/.test(h)) {
    return { type: 'number', choices: [] };
  }
  if (/\b(dob|birth|date|day|deadline|registered_date)\b/.test(h)) {
    return { type: 'date', choices: [] };
  }
  if (/\b(phone|mobile|cell|contact_no|telephone)\b/.test(h)) {
    return { type: 'phone', choices: [] };
  }
  if (/\b(email|mail)\b/.test(h)) {
    return { type: 'email', choices: [] };
  }
  if (/\b(gps|coord|location|latitude|longitude|geopoint|geo)\b/.test(h)) {
    return { type: 'gps', choices: [] };
  }
  if (/\b(gender|sex)\b/.test(h)) {
    return {
      type: 'select_one',
      choices: [
        { name: 'male', label: 'Male' },
        { name: 'female', label: 'Female' },
        { name: 'other', label: 'Other' }
      ]
    };
  }
  if (/\b(marital|marriage)\b/.test(h)) {
    return {
      type: 'select_one',
      choices: [
        { name: 'single', label: 'Single' },
        { name: 'married', label: 'Married' },
        { name: 'divorced', label: 'Divorced' },
        { name: 'widowed', label: 'Widowed' }
      ]
    };
  }
  if (/\b(status|state)\b/.test(h)) {
    return {
      type: 'select_one',
      choices: [
        { name: 'active', label: 'Active' },
        { name: 'pending', label: 'Pending' },
        { name: 'completed', label: 'Completed' }
      ]
    };
  }
  if (/\b(is_|has_|can_|should_|yes_no|verified|approved)\b/.test(h) || /\byes\/no\b/.test(h)) {
    return {
      type: 'select_one',
      choices: [
        { name: 'yes', label: 'Yes' },
        { name: 'no', label: 'No' }
      ]
    };
  }
  if (/\b(comment|note|remark|description|address|feedback|details|observation)\b/.test(h)) {
    return { type: 'textarea', choices: [] };
  }
  
  return { type: 'text', choices: [] };
}

/**
 * Parse an Excel file into a standardized Form Schema JSON
 * Supports:
 * 1. Standard KoboToolbox / XLSForm ('survey' & 'choices' sheets)
 * 2. Simple Table Mode (headers on Row 1)
 */
function parseXlsxFile(filePathOrBuffer) {
  let workbook;
  if (typeof filePathOrBuffer === 'string') {
    workbook = XLSX.readFile(filePathOrBuffer, { cellDates: true });
  } else {
    workbook = XLSX.read(filePathOrBuffer, { type: 'buffer', cellDates: true });
  }

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  // Look for survey sheet (case-insensitive)
  const surveySheetName = sheetNames.find(s => s.trim().toLowerCase() === 'survey');
  const choicesSheetName = sheetNames.find(s => s.trim().toLowerCase() === 'choices');

  if (surveySheetName) {
    return parseKoboXlsForm(workbook, surveySheetName, choicesSheetName);
  } else {
    return parseSimpleTable(workbook, sheetNames[0]);
  }
}

/**
 * Mode 1: Parse KoboToolbox / XLSForm specification
 */
function parseKoboXlsForm(workbook, surveySheetName, choicesSheetName) {
  const surveySheet = workbook.Sheets[surveySheetName];
  const surveyData = XLSX.utils.sheet_to_json(surveySheet, { defval: '' });

  // Parse choices if available
  const choicesMap = {};
  if (choicesSheetName && workbook.Sheets[choicesSheetName]) {
    const choicesData = XLSX.utils.sheet_to_json(workbook.Sheets[choicesSheetName], { defval: '' });
    for (const row of choicesData) {
      // Find list name column (list_name, list name, list)
      const listKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z]/g, '') === 'listname') || 'list_name';
      const nameKey = Object.keys(row).find(k => k.toLowerCase() === 'name') || 'name';
      const labelKey = Object.keys(row).find(k => k.toLowerCase().startsWith('label')) || 'label';

      const listName = String(row[listKey] || '').trim();
      const choiceName = String(row[nameKey] || '').trim();
      const choiceLabel = String(row[labelKey] || choiceName).trim();

      if (listName && choiceName) {
        if (!choicesMap[listName]) choicesMap[listName] = [];
        choicesMap[listName].push({
          name: choiceName,
          label: choiceLabel || choiceName
        });
      }
    }
  }

  const fields = [];
  let index = 0;

  for (const row of surveyData) {
    // Keys may have varying casing or headers
    const typeKey = Object.keys(row).find(k => k.toLowerCase() === 'type') || 'type';
    const nameKey = Object.keys(row).find(k => k.toLowerCase() === 'name') || 'name';
    const labelKey = Object.keys(row).find(k => k.toLowerCase().startsWith('label')) || 'label';
    const requiredKey = Object.keys(row).find(k => k.toLowerCase() === 'required') || 'required';
    const hintKey = Object.keys(row).find(k => k.toLowerCase().startsWith('hint')) || 'hint';

    const rawType = String(row[typeKey] || '').trim();
    if (!rawType) continue;

    // Ignore structural grouping tags for flat field schema, but preserve question elements
    const lowerType = rawType.toLowerCase();
    if (lowerType.startsWith('begin_') || lowerType.startsWith('end_')) {
      continue;
    }

    const rawName = String(row[nameKey] || '').trim() || `q_${index + 1}`;
    const fieldName = sanitizeFieldName(rawName, index);
    const label = String(row[labelKey] || '').trim() || rawName;
    const hint = String(row[hintKey] || '').trim();

    const reqVal = String(row[requiredKey] || '').trim().toLowerCase();
    const required = reqVal === 'yes' || reqVal === 'true' || reqVal === '1';

    let fieldType = 'text';
    let choices = [];

    if (lowerType.startsWith('select_one')) {
      fieldType = 'select_one';
      const listName = rawType.replace(/^select_one\s+/i, '').trim();
      choices = choicesMap[listName] || [];
    } else if (lowerType.startsWith('select_multiple')) {
      fieldType = 'select_multiple';
      const listName = rawType.replace(/^select_multiple\s+/i, '').trim();
      choices = choicesMap[listName] || [];
    } else if (lowerType === 'integer' || lowerType === 'decimal') {
      fieldType = 'number';
    } else if (lowerType === 'geopoint' || lowerType === 'gps') {
      fieldType = 'gps';
    } else if (lowerType === 'date') {
      fieldType = 'date';
    } else if (lowerType === 'time') {
      fieldType = 'time';
    } else if (lowerType === 'datetime') {
      fieldType = 'datetime';
    } else if (lowerType === 'note') {
      fieldType = 'note';
    } else if (lowerType === 'image' || lowerType === 'photo') {
      fieldType = 'image';
    } else {
      fieldType = 'text';
    }

    fields.push({
      id: fieldName,
      name: fieldName,
      original_name: rawName,
      label,
      type: fieldType,
      raw_type: rawType,
      required,
      hint,
      choices
    });

    index++;
  }

  return {
    mode: 'xlsform',
    mode_label: 'Standard KoboToolbox / XLSForm Mode',
    sheet_name: surveySheetName,
    total_fields: fields.length,
    fields
  };
}

/**
 * Mode 2: Parse Simple Table Mode (Row 1 is headers)
 */
function parseSimpleTable(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  // Read as array of arrays to safely inspect header row
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0 || rows[0].length === 0) {
    throw new Error(`Sheet "${sheetName}" is empty or has no header row.`);
  }

  const headerRow = rows[0];
  const fields = [];
  const usedNames = new Set();

  headerRow.forEach((header, index) => {
    const rawHeader = String(header || '').trim();
    if (!rawHeader) return;

    let fieldName = sanitizeFieldName(rawHeader, index);
    if (usedNames.has(fieldName)) {
      fieldName = `${fieldName}_${index + 1}`;
    }
    usedNames.add(fieldName);

    const { type, choices } = detectTypeFromHeader(rawHeader);

    fields.push({
      id: fieldName,
      name: fieldName,
      original_name: rawHeader,
      label: rawHeader,
      type,
      raw_type: type,
      required: true,
      hint: '',
      choices
    });
  });

  return {
    mode: 'simple_table',
    mode_label: 'Simple Table Mode (Headers Auto-Detected)',
    sheet_name: sheetName,
    total_fields: fields.length,
    fields
  };
}

module.exports = {
  parseXlsxFile,
  sanitizeFieldName,
  detectTypeFromHeader
};
