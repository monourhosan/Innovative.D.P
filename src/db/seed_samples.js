const bcrypt = require('bcryptjs');
const db = require('./index');

function seedSampleData() {
  console.log('[Seed] Checking if sample project exists...');

  const existingProject = db.queryOne('SELECT id FROM projects LIMIT 1');
  if (existingProject) {
    console.log('[Seed] Projects already exist. Skipping seed to prevent overwrite.');
    return;
  }

  console.log('[Seed] Seeding sample project, supervisor, team members, and submissions...');

  // 1. Create Sample Project
  const sampleSchema = {
    mode: 'xlsform',
    mode_label: 'Standard KoboToolbox / XLSForm Mode',
    sheet_name: 'survey',
    total_fields: 7,
    fields: [
      {
        id: 'respondent_name',
        name: 'respondent_name',
        label: 'Full Name of Household Respondent',
        type: 'text',
        required: true,
        hint: 'First and last legal name',
        choices: []
      },
      {
        id: 'respondent_age',
        name: 'respondent_age',
        label: 'Age in completed years',
        type: 'number',
        required: true,
        hint: 'Age between 18 and 100',
        choices: []
      },
      {
        id: 'gender',
        name: 'gender',
        label: 'Gender of Respondent',
        type: 'select_one',
        required: true,
        hint: '',
        choices: [
          { name: 'female', label: 'Female' },
          { name: 'male', label: 'Male' },
          { name: 'other', label: 'Other / Prefer not to say' }
        ]
      },
      {
        id: 'phone_number',
        name: 'phone_number',
        label: 'Contact Mobile Number',
        type: 'phone',
        required: false,
        hint: 'Include mobile area code',
        choices: []
      },
      {
        id: 'primary_water_source',
        name: 'primary_water_source',
        label: 'Primary Drinking Water Source',
        type: 'select_one',
        required: true,
        hint: 'Main source utilized in the last 30 days',
        choices: [
          { name: 'tube_well', label: 'Tube Well / Borehole' },
          { name: 'piped_dwelling', label: 'Piped Water directly into Dwelling' },
          { name: 'protected_well', label: 'Protected Dug Well' },
          { name: 'bottled', label: 'Bottled / Purified Water' },
          { name: 'surface_water', label: 'Surface Water (River / Lake)' }
        ]
      },
      {
        id: 'household_location',
        name: 'household_location',
        label: 'GPS Coordinates of Household',
        type: 'gps',
        required: false,
        hint: 'Latitude, Longitude captured by device GPS',
        choices: []
      },
      {
        id: 'enumerator_notes',
        name: 'enumerator_notes',
        label: 'Field Observations & Remarks',
        type: 'textarea',
        required: false,
        hint: 'Notes on sanitation and living conditions',
        choices: []
      }
    ]
  };

  const projectRes = db.execute(`
    INSERT INTO projects (title, description, form_schema_json, original_xlsx_filename, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `, 
    'Household Socio-Economic & Water Survey 2026',
    'Rapid assessment of drinking water accessibility and household demographics in rural districts.',
    JSON.stringify(sampleSchema),
    'Household_Water_Survey_2026.xlsx'
  );
  const projectId = projectRes.lastInsertRowid;

  // 2. Create Sample Supervisor
  const salt = bcrypt.genSaltSync(10);
  const supHash = bcrypt.hashSync('supervisor123', salt);
  const adminUser = db.queryOne("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");

  const supRes = db.execute(`
    INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
    VALUES (?, ?, ?, ?, 'SUPERVISOR', ?, 1)
  `, 'SUP-1042', supHash, 'supervisor123', 'Saif Al-Islam (Lead Supervisor)', adminUser ? adminUser.id : 1);
  const supId = supRes.lastInsertRowid;

  // Assign project to supervisor
  db.execute('INSERT INTO project_assignments (project_id, user_id) VALUES (?, ?)', projectId, supId);

  // 3. Create Sample Team Members
  const memberHash = bcrypt.hashSync('member123', salt);

  const tm1Res = db.execute(`
    INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
    VALUES (?, ?, ?, ?, 'TEAM_MEMBER', ?, 1)
  `, 'TM-2001', memberHash, 'member123', 'Rahim Ahmed (Enumerator)', supId);
  const tm1Id = tm1Res.lastInsertRowid;

  const tm2Res = db.execute(`
    INSERT INTO users (user_id, password_hash, plain_password, full_name, role, created_by, is_active)
    VALUES (?, ?, ?, ?, 'TEAM_MEMBER', ?, 1)
  `, 'TM-2002', memberHash, 'member123', 'Fatima Begum (Enumerator)', supId);
  const tm2Id = tm2Res.lastInsertRowid;

  // 4. Create Sample Submissions
  const sampleAnswersList = [
    {
      memberId: tm1Id,
      answers: {
        respondent_name: 'Anisur Rahman',
        respondent_age: 42,
        gender: 'Male',
        phone_number: '+8801712001001',
        primary_water_source: 'Tube Well / Borehole',
        household_location: '23.8103, 90.4125',
        enumerator_notes: 'Water pump is shared between 4 neighboring families.'
      }
    },
    {
      memberId: tm1Id,
      answers: {
        respondent_name: 'Nasima Akter',
        respondent_age: 36,
        gender: 'Female',
        phone_number: '+8801712001002',
        primary_water_source: 'Piped Water directly into Dwelling',
        household_location: '23.8120, 90.4140',
        enumerator_notes: 'Stable 24-hour supply reported.'
      }
    },
    {
      memberId: tm2Id,
      answers: {
        respondent_name: 'Kamal Hossain',
        respondent_age: 51,
        gender: 'Male',
        phone_number: '+8801712001003',
        primary_water_source: 'Protected Dug Well',
        household_location: '23.8155, 90.4110',
        enumerator_notes: 'Well was chlorinated last month by local health council.'
      }
    },
    {
      memberId: tm2Id,
      answers: {
        respondent_name: 'Rowshan Ara',
        respondent_age: 29,
        gender: 'Female',
        phone_number: '+8801712001004',
        primary_water_source: 'Tube Well / Borehole',
        household_location: '23.8170, 90.4190',
        enumerator_notes: 'Clean drinking water access verified.'
      }
    }
  ];

  for (const s of sampleAnswersList) {
    db.execute(`
      INSERT INTO submissions (project_id, team_member_id, supervisor_id, answers_json, client_timestamp)
      VALUES (?, ?, ?, ?, datetime('now', '-1 hours', 'localtime'))
    `, projectId, s.memberId, supId, JSON.stringify(s.answers));
  }

  console.log('[Seed] Sample data seeded successfully!');
  console.log('       Supervisor login: SUP-1042 / supervisor123');
  console.log('       Team member login: TM-2001 / member123');
}

if (require.main === module) {
  seedSampleData();
}

module.exports = seedSampleData;
