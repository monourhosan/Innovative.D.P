const XLSX = require('xlsx');

/**
 * Generate a standard KoboToolbox / XLSForm sample workbook buffer
 */
function createXlsFormSampleWorkbook() {
  const wb = XLSX.utils.book_new();

  // 1. Survey Sheet
  const surveyData = [
    {
      type: 'text',
      name: 'respondent_name',
      label: 'Full Name of Household Respondent',
      required: 'yes',
      hint: 'Enter first and last legal name'
    },
    {
      type: 'integer',
      name: 'respondent_age',
      label: 'Age in completed years',
      required: 'yes',
      hint: 'Age between 18 and 100'
    },
    {
      type: 'select_one gender_list',
      name: 'gender',
      label: 'Gender of Respondent',
      required: 'yes',
      hint: ''
    },
    {
      type: 'select_one marital_status',
      name: 'marital_status',
      label: 'Current Marital Status',
      required: 'no',
      hint: ''
    },
    {
      type: 'text',
      name: 'phone_number',
      label: 'Mobile Contact Number',
      required: 'no',
      hint: 'Include country or area code'
    },
    {
      type: 'select_one water_source',
      name: 'primary_water_source',
      label: 'Primary Drinking Water Source',
      required: 'yes',
      hint: 'Main source utilized in the last 30 days'
    },
    {
      type: 'geopoint',
      name: 'household_location',
      label: 'GPS Coordinates of Household',
      required: 'no',
      hint: 'Stand outdoors with clear sky view'
    },
    {
      type: 'note',
      name: 'enumerator_notes',
      label: 'Field Observations & Remarks',
      required: 'no',
      hint: 'Any noteworthy circumstances observed during visit'
    }
  ];

  const surveyWs = XLSX.utils.json_to_sheet(surveyData, {
    header: ['type', 'name', 'label', 'required', 'hint']
  });

  // Set column widths
  surveyWs['!cols'] = [
    { wch: 26 }, // type
    { wch: 24 }, // name
    { wch: 40 }, // label
    { wch: 12 }, // required
    { wch: 45 }  // hint
  ];

  XLSX.utils.book_append_sheet(wb, surveyWs, 'survey');

  // 2. Choices Sheet
  const choicesData = [
    { list_name: 'gender_list', name: 'male', label: 'Male' },
    { list_name: 'gender_list', name: 'female', label: 'Female' },
    { list_name: 'gender_list', name: 'other', label: 'Other / Prefer not to say' },

    { list_name: 'marital_status', name: 'single', label: 'Single / Never Married' },
    { list_name: 'marital_status', name: 'married', label: 'Currently Married' },
    { list_name: 'marital_status', name: 'widowed', label: 'Widowed' },
    { list_name: 'marital_status', name: 'divorced', label: 'Divorced / Separated' },

    { list_name: 'water_source', name: 'piped_dwelling', label: 'Piped Water directly into Dwelling' },
    { list_name: 'water_source', name: 'public_tap', label: 'Public Tap / Standpipe' },
    { list_name: 'water_source', name: 'tube_well', label: 'Tube Well / Borehole' },
    { list_name: 'water_source', name: 'protected_well', label: 'Protected Dug Well' },
    { list_name: 'water_source', name: 'rainwater', label: 'Rainwater Collection Tank' },
    { list_name: 'water_source', name: 'bottled', label: 'Bottled / Purified Water' },
    { list_name: 'water_source', name: 'surface_water', label: 'Surface Water (River / Lake / Pond)' }
  ];

  const choicesWs = XLSX.utils.json_to_sheet(choicesData, {
    header: ['list_name', 'name', 'label']
  });

  choicesWs['!cols'] = [
    { wch: 22 }, // list_name
    { wch: 22 }, // name
    { wch: 40 }  // label
  ];

  XLSX.utils.book_append_sheet(wb, choicesWs, 'choices');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generate a Simple Table Mode sample workbook buffer
 */
function createSimpleTableSampleWorkbook() {
  const wb = XLSX.utils.book_new();

  const data = [
    {
      'Full Name': 'Rahim Chowdhury',
      'Age': 34,
      'Gender': 'Male',
      'Phone Number': '+8801712345678',
      'Community Location': 'Zone 4, Sector B',
      'Family Members Count': 5,
      'Primary Water Source': 'Tube Well',
      'Field Notes': 'Family relocated recently from river basin'
    },
    {
      'Full Name': 'Fatima Begum',
      'Age': 28,
      'Gender': 'Female',
      'Phone Number': '+8801898765432',
      'Community Location': 'Zone 2, Sector A',
      'Family Members Count': 3,
      'Primary Water Source': 'Piped Water',
      'Field Notes': 'Requested additional water purification tablets'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 24 }, // Full Name
    { wch: 10 }, // Age
    { wch: 12 }, // Gender
    { wch: 20 }, // Phone Number
    { wch: 26 }, // Community Location
    { wch: 24 }, // Family Members Count
    { wch: 24 }, // Primary Water Source
    { wch: 48 }  // Field Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DataSheet');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  createXlsFormSampleWorkbook,
  createSimpleTableSampleWorkbook
};
