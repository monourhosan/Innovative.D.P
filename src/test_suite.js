/**
 * Comprehensive Automated Verification Suite
 * Innovative Data Platform - Made by Saif
 */

const http = require('http');
const { app, server } = require('./server');
const XLSX = require('xlsx');

const PORT = 3000;
let adminToken = '';
let supervisorToken = '';
let memberToken = '';
let projectId = 0;

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Accept': 'application/json' };
    let postData = '';

    if (body) {
      postData = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers
    }, (res) => {
      const isBinary = (res.headers['content-type'] || '').includes('spreadsheetml');
      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (isBinary) {
          return resolve({ status: res.statusCode, headers: res.headers, buffer });
        }
        try {
          const json = JSON.parse(buffer.toString('utf8'));
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: buffer.toString('utf8') });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Innovative Data Platform Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Health check
    console.log('--- 1. Health Probe Endpoint ---');
    const health = await makeRequest('/health');
    assert(health.status === 200, 'Health endpoint returns 200');
    assert(health.data.platform === 'Innovative Data Platform', 'Platform title is Innovative Data Platform');
    assert(health.data.author === 'Made by Saif', 'Author attribution is Made by Saif');

    // Test 2: Admin Login
    console.log('\n--- 2. Admin Authentication ---');
    const adminLogin = await makeRequest('/api/v1/auth/login', 'POST', {
      user_id: 'admin',
      password: 'admin123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin logs in and receives JWT');
    adminToken = adminLogin.data.token;
    assert(adminLogin.data.user.role === 'ADMIN', 'Role is verified as ADMIN');

    // Test 3: Supervisor Login
    console.log('\n--- 3. Supervisor Authentication ---');
    const supLogin = await makeRequest('/api/v1/auth/login', 'POST', {
      user_id: 'SUP-1042',
      password: 'supervisor123'
    });
    assert(supLogin.status === 200 && supLogin.data.token, 'Supervisor logs in and receives JWT');
    supervisorToken = supLogin.data.token;
    assert(supLogin.data.user.role === 'SUPERVISOR', 'Role is verified as SUPERVISOR');

    // Test 4: Team Member Login
    console.log('\n--- 4. Team Member Authentication ---');
    const memLogin = await makeRequest('/api/v1/auth/login', 'POST', {
      user_id: 'TM-2001',
      password: 'member123'
    });
    assert(memLogin.status === 200 && memLogin.data.token, 'Team Member logs in and receives JWT');
    memberToken = memLogin.data.token;
    assert(memLogin.data.user.role === 'TEAM_MEMBER', 'Role is verified as TEAM_MEMBER');

    // Test 5: Admin Dashboard Stats
    console.log('\n--- 5. Admin Live Dashboard Stats ---');
    const dash = await makeRequest('/api/v1/admin/dashboard-stats', 'GET', null, adminToken);
    assert(dash.status === 200 && dash.data.summary, 'Dashboard stats returned successfully');
    assert(dash.data.summary.total_projects >= 1, 'Projects count >= 1');
    assert(dash.data.supervisors.length >= 1, 'Supervisors breakdown list is present');
    assert(dash.data.recent_submissions.length >= 1, 'Recent submissions stream is present');

    // Test 6: Supervisor Dashboard & Team Members
    console.log('\n--- 6. Supervisor Dashboard & Team Member Management ---');
    const supDash = await makeRequest('/api/v1/supervisor/dashboard', 'GET', null, supervisorToken);
    assert(supDash.status === 200, 'Supervisor dashboard accessible');
    assert(supDash.data.team_members.length >= 2, 'Supervisor sees assigned team members');

    const testTmId = 'TM-' + Math.floor(1000 + Math.random() * 9000);
    const newTmRes = await makeRequest('/api/v1/supervisor/team-members', 'POST', {
      full_name: 'Tareq Rahman',
      user_id: testTmId,
      password: 'password123'
    }, supervisorToken);
    assert(newTmRes.status === 201 && newTmRes.data.team_member, 'Supervisor created new Team Member successfully');

    // Test 7: Member Projects & Schema Delivery
    console.log('\n--- 7. Android Member Projects & Form Schema Delivery ---');
    const memProjects = await makeRequest('/api/v1/member/projects', 'GET', null, memberToken);
    assert(memProjects.status === 200 && memProjects.data.projects.length >= 1, 'Team member receives assigned projects');
    const project = memProjects.data.projects[0];
    projectId = project.id;
    assert(project.form_schema && project.form_schema.fields.length >= 5, 'Project schema contains dynamic form fields');

    // Test 8: Member Submissions
    console.log('\n--- 8. Android Member Form Submission ---');
    const subRes = await makeRequest('/api/v1/member/submissions', 'POST', {
      project_id: projectId,
      answers_json: {
        respondent_name: 'Amina Khatun',
        respondent_age: 38,
        gender: 'female',
        primary_water_source: 'tube_well',
        household_location: '23.8105, 90.4120',
        enumerator_notes: 'Automated test suite field entry'
      },
      client_timestamp: new Date().toISOString()
    }, memberToken);
    assert(subRes.status === 201 && subRes.data.count === 1, 'Member submission recorded and broadcasted');

    // Test 9: Member Dashboard Stats
    console.log('\n--- 9. Android Member Dashboard Stats ---');
    const memDash = await makeRequest('/api/v1/member/dashboard', 'GET', null, memberToken);
    assert(memDash.status === 200 && memDash.data.stats.total_count >= 1, 'Member dashboard reflects submission count');

    // Test 10: Excel Samples Generation
    console.log('\n--- 10. Sample Templates Download ---');
    const xlsFormSample = await makeRequest('/api/v1/projects/sample/xlsform');
    assert(xlsFormSample.buffer && xlsFormSample.buffer.length > 1000, 'Kobo XLSForm template generated valid Excel file');
    const parsedXlsFormWb = XLSX.read(xlsFormSample.buffer, { type: 'buffer' });
    assert(parsedXlsFormWb.SheetNames.includes('survey'), 'XLSForm template contains survey sheet');
    assert(parsedXlsFormWb.SheetNames.includes('choices'), 'XLSForm template contains choices sheet');

    const simpleTableSample = await makeRequest('/api/v1/projects/sample/simple-table');
    assert(simpleTableSample.buffer && simpleTableSample.buffer.length > 1000, 'Simple Table template generated valid Excel file');

    // Test 11: One-Click Excel Data Export
    console.log('\n--- 11. One-Click Excel Data Export ---');
    const exportRes = await makeRequest(`/api/v1/export/submissions.xlsx?project_id=${projectId}`, 'GET', null, adminToken);
    assert(exportRes.buffer && exportRes.buffer.length > 1000, 'Excel export buffer returned');
    const exportWb = XLSX.read(exportRes.buffer, { type: 'buffer' });
    assert(exportWb.SheetNames.includes('Submissions'), 'Exported workbook contains Submissions sheet');
    const exportRows = XLSX.utils.sheet_to_json(exportWb.Sheets['Submissions']);
    assert(exportRows.length >= 1, 'Exported Excel contains submission rows');
    assert(exportRows[0]['Submission ID'] !== undefined, 'Export contains Submission ID metadata column');
    assert(exportRows[0]['Supervisor Name'] !== undefined, 'Export contains Supervisor Name metadata column');
    assert(exportRows[0]['Team Member Name'] !== undefined, 'Export contains Team Member Name metadata column');

    console.log(`\n====================================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`====================================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    server.close(() => {
      console.log('Test server closed.');
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

// Run tests
runTests();
