/**
 * Submissions Data Viewer & One-Click Excel Exporter
 * Author: Made by Saif
 */

window.SubmissionsView = {
  currentSubmissions: [],

  init() {
    this.populateFilterDropdowns();
    this.refresh();
  },

  async populateFilterDropdowns() {
    try {
      const [projRes, supRes] = await Promise.all([
        apiRequest('/api/v1/projects'),
        apiRequest('/api/v1/admin/supervisors')
      ]);

      const projSelect = document.getElementById('filterProject');
      if (projSelect && projRes && projRes.projects) {
        projSelect.innerHTML = '<option value="">All Projects</option>' + 
          projRes.projects.map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('');
      }

      const supSelect = document.getElementById('filterSupervisor');
      if (supSelect && supRes && supRes.supervisors) {
        supSelect.innerHTML = '<option value="">All Supervisors</option>' + 
          supRes.supervisors.map(s => `<option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(s.user_id)})</option>`).join('');
      }
    } catch (e) {
      console.warn('Could not populate filter dropdowns:', e);
    }
  },

  async refresh() {
    const projectId = document.getElementById('filterProject')?.value || '';
    const supervisorId = document.getElementById('filterSupervisor')?.value || '';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    const search = document.getElementById('filterSearch')?.value || '';

    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (supervisorId) params.append('supervisor_id', supervisorId);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (search) params.append('search', search);

    try {
      const res = await apiRequest(`/api/v1/submissions?${params.toString()}`);
      if (res && res.success) {
        this.currentSubmissions = res.submissions;
        this.renderTable(res.submissions);
      }
    } catch (err) {
      console.warn('Could not load submissions:', err);
    }
  },

  renderTable(submissions = []) {
    const tbody = document.getElementById('submissionsTableBody');
    const countBadge = document.getElementById('submissionsCountBadge');
    if (countBadge) countBadge.textContent = `${submissions.length} Records Found`;

    if (!tbody) return;

    if (submissions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">No Submissions Matched</div>
            <div style="color: var(--text-muted); font-size: 13px; margin: 4px 0 16px 0;">Try adjusting your filters or submit a new test entry from the Mobile Simulator tab.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = submissions.map(sub => {
      const answers = sub.answers || {};
      const answerKeys = Object.keys(answers);
      const summaryText = answerKeys.slice(0, 2).map(k => `${k}: ${answers[k]}`).join(' | ');

      return `
        <tr>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">#${sub.id}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(sub.project_title || 'Project')}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${sub.server_timestamp}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${escapeHtml(sub.team_member_name || 'Enumerator')}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(sub.team_member_user_id || '')}</div>
          </td>
          <td>
            <div>${escapeHtml(sub.supervisor_name || 'Saif')}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(sub.supervisor_user_id || '')}</div>
          </td>
          <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #475569;">
            ${escapeHtml(summaryText || 'Click View Details')}
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="SubmissionsView.showDetailModal(${sub.id})">
              <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>View Details</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  showDetailModal(submissionId) {
    const sub = this.currentSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    document.getElementById('subDetailId').textContent = `#${sub.id}`;
    document.getElementById('subDetailProject').textContent = sub.project_title;
    document.getElementById('subDetailMember').textContent = `${sub.team_member_name} (${sub.team_member_user_id})`;
    document.getElementById('subDetailSupervisor').textContent = `${sub.supervisor_name} (${sub.supervisor_user_id})`;
    document.getElementById('subDetailTimestamp').textContent = sub.server_timestamp;

    const answers = sub.answers || {};
    const container = document.getElementById('subDetailAnswersList');

    if (Object.keys(answers).length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted);">No recorded answers.</div>';
    } else {
      container.innerHTML = Object.entries(answers).map(([key, val]) => {
        let displayVal = val;
        if (typeof val === 'object') {
          displayVal = JSON.stringify(val, null, 2);
        }
        return `
          <div style="padding: 10px 14px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--primary); letter-spacing: 0.5px;">
              ${escapeHtml(key)}
            </div>
            <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-top: 2px;">
              ${escapeHtml(String(displayVal))}
            </div>
          </div>
        `;
      }).join('');
    }

    openModal('submissionDetailModal');
  },

  /**
   * One-Click .xlsx Data Export (Section 4.5)
   */
  downloadExcelExport() {
    const projectId = document.getElementById('filterProject')?.value;
    const supervisorId = document.getElementById('filterSupervisor')?.value;
    const dateFrom = document.getElementById('filterDateFrom')?.value;
    const dateTo = document.getElementById('filterDateTo')?.value;

    if (!projectId) {
      showToast('Please select a Project from the dropdown first to export its data.', 'error');
      document.getElementById('filterProject')?.focus();
      return;
    }

    const params = new URLSearchParams({ project_id: projectId });
    if (supervisorId) params.append('supervisor_id', supervisorId);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    showToast('Generating formatted .xlsx data file...', 'info');

    // Trigger browser download via window.location
    window.location.href = `/api/v1/export/submissions.xlsx?${params.toString()}`;
  },

  downloadExcelForProject(projectId, projectTitle) {
    showToast(`Downloading .xlsx for "${projectTitle}"...`, 'info');
    window.location.href = `/api/v1/export/submissions.xlsx?project_id=${projectId}`;
  },

  resetFilters() {
    if (document.getElementById('filterProject')) document.getElementById('filterProject').value = '';
    if (document.getElementById('filterSupervisor')) document.getElementById('filterSupervisor').value = '';
    if (document.getElementById('filterDateFrom')) document.getElementById('filterDateFrom').value = '';
    if (document.getElementById('filterDateTo')) document.getElementById('filterDateTo').value = '';
    if (document.getElementById('filterSearch')) document.getElementById('filterSearch').value = '';
    this.refresh();
  }
};
