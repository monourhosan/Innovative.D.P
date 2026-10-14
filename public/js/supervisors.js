/**
 * Supervisors Account Management View
 * Author: Made by Saif
 */

window.SupervisorsView = {
  supervisors: [],
  allProjects: [],

  init() {
    this.refresh();
  },

  async refresh() {
    try {
      const [supRes, projRes] = await Promise.all([
        apiRequest('/api/v1/admin/supervisors'),
        apiRequest('/api/v1/projects')
      ]);

      if (supRes && supRes.success) {
        this.supervisors = supRes.supervisors;
        this.renderSupervisorsTable(supRes.supervisors);
      }

      if (projRes && projRes.success) {
        this.allProjects = projRes.projects;
      }
    } catch (err) {
      console.warn('Could not load supervisors:', err);
    }
  },

  renderSupervisorsTable(supervisors = []) {
    const tbody = document.getElementById('supervisorsTableBody');
    if (!tbody) return;

    if (supervisors.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">No Supervisors Found</div>
            <div style="color: var(--text-muted); font-size: 13px; margin: 4px 0 16px 0;">Create a supervisor account to manage field enumerators and data collection.</div>
            <button class="btn btn-primary" onclick="SupervisorsView.openCreateModal()">
              + 2. Add Supervisor & Get Login ID
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = supervisors.map(sup => {
      const projectsCount = (sup.assigned_projects || []).length;
      const statusBadge = sup.is_active === 1
        ? '<span class="badge badge-success">● Active</span>'
        : '<span class="badge badge-neutral">Deactivated</span>';

      const toggleActionLabel = sup.is_active === 1 ? 'Deactivate' : 'Activate';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">${escapeHtml(sup.full_name)}</div>
            <div style="font-size: 12px; color: var(--text-muted);">Joined: ${escapeHtml((sup.created_at || '').substring(0, 10))}</div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 3px 8px; border-radius: var(--radius-sm);">
              ${escapeHtml(sup.user_id)}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-family: var(--font-mono); font-size: 13px; background: var(--bg-main); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 4px;">
                ${escapeHtml(sup.plain_password || '••••••••')}
              </span>
              <button class="btn btn-outline btn-sm" title="Copy Credentials" onclick="SupervisorsView.copyCredentials('${escapeHtml(sup.full_name)}', '${escapeHtml(sup.user_id)}', '${escapeHtml(sup.plain_password || '')}')">
                <svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="SupervisorsView.viewTeamMembers(${sup.id}, '${escapeHtml(sup.full_name)}')">
              <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span>${sup.team_members_count || 0} Members</span>
            </button>
          </td>
          <td>
            <span class="badge badge-neutral">${projectsCount} Assigned</span>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm" onclick="SupervisorsView.openEditModal(${sup.id})">
                Edit
              </button>
              <button class="btn btn-outline btn-sm" onclick="SupervisorsView.toggleSupervisorStatus(${sup.id})">
                ${toggleActionLabel}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openCreateModal() {
    document.getElementById('supervisorModalTitle').textContent = 'Create New Supervisor';
    document.getElementById('supervisorFormId').value = '';
    document.getElementById('supervisorFullName').value = '';
    
    // Auto-generate fresh User ID (e.g. SUP-1042)
    this.generateRandomUserId();
    this.generateRandomPassword();

    this.renderProjectCheckboxes([]);
    openModal('supervisorModal');
  },

  openEditModal(supervisorId) {
    const sup = this.supervisors.find(s => s.id === supervisorId);
    if (!sup) return;

    document.getElementById('supervisorModalTitle').textContent = `Edit Supervisor: ${sup.full_name}`;
    document.getElementById('supervisorFormId').value = sup.id;
    document.getElementById('supervisorFullName').value = sup.full_name;
    document.getElementById('supervisorUserId').value = sup.user_id;
    document.getElementById('supervisorPassword').value = sup.plain_password || '';

    const assignedIds = (sup.assigned_projects || []).map(p => p.id);
    this.renderProjectCheckboxes(assignedIds);

    openModal('supervisorModal');
  },

  renderProjectCheckboxes(selectedProjectIds = []) {
    const container = document.getElementById('supervisorProjectsList');
    if (!container) return;

    if (this.allProjects.length === 0) {
      container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted);">No projects available. Upload an Excel file first.</div>';
      return;
    }

    container.innerHTML = this.allProjects.map(p => {
      const isChecked = selectedProjectIds.includes(p.id) ? 'checked' : '';
      return `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 4px 0;">
          <input type="checkbox" name="sup_assigned_project" value="${p.id}" ${isChecked}>
          <span><strong>${escapeHtml(p.title)}</strong> (${p.total_fields || 0} questions)</span>
        </label>
      `;
    }).join('');
  },

  generateRandomUserId() {
    const random = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('supervisorUserId').value = `SUP-${random}`;
  },

  generateRandomPassword() {
    const pass = `pass${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById('supervisorPassword').value = pass;
  },

  async saveSupervisor() {
    const formId = document.getElementById('supervisorFormId').value;
    const full_name = document.getElementById('supervisorFullName').value.trim();
    const user_id = document.getElementById('supervisorUserId').value.trim();
    const password = document.getElementById('supervisorPassword').value.trim();

    if (!full_name) {
      showToast('Please enter the supervisor\'s full name', 'error');
      return;
    }

    const checkedBoxes = document.querySelectorAll('input[name="sup_assigned_project"]:checked');
    const assigned_project_ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value, 10));

    try {
      if (formId) {
        // Update
        const res = await apiRequest(`/api/v1/admin/supervisors/${formId}`, {
          method: 'PUT',
          body: JSON.stringify({ full_name, password, assigned_project_ids })
        });
        if (res && res.success) {
          showToast('Supervisor updated successfully', 'success');
          closeModal('supervisorModal');
          this.refresh();
          DashboardView.refresh();
        }
      } else {
        // Create
        const res = await apiRequest('/api/v1/admin/supervisors', {
          method: 'POST',
          body: JSON.stringify({ full_name, user_id, password, assigned_project_ids })
        });

        if (res && res.success) {
          closeModal('supervisorModal');
          this.refresh();
          DashboardView.refresh();

          // Show Success Modal with 1-click Copy Credentials button
          this.showCreatedSuccessModal(res.supervisor);
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  },

  showCreatedSuccessModal(sup) {
    document.getElementById('createdSupName').textContent = sup.full_name;
    document.getElementById('createdSupUserId').textContent = sup.user_id;
    document.getElementById('createdSupPassword').textContent = sup.plain_password;

    document.getElementById('copyCredentialsBtn').onclick = () => {
      this.copyCredentials(sup.full_name, sup.user_id, sup.plain_password);
    };

    openModal('supervisorSuccessModal');
  },

  copyCredentials(name, userId, password) {
    const portalUrl = window.location.origin;
    const message = 
`Innovative Data Platform
Innovative Research & Consultancy Ltd.
──────────────────────────────
Name: ${name}
User ID: ${userId}
Password: ${password}
Portal URL: ${portalUrl}
──────────────────────────────
Use these credentials to log in or configure the field mobile application.`;

    copyToClipboard(message, 'Supervisor credentials copied to clipboard!');
  },

  async toggleSupervisorStatus(supId) {
    try {
      const res = await apiRequest(`/api/v1/admin/supervisors/${supId}`, { method: 'DELETE' });
      if (res && res.success) {
        showToast(res.message, 'success');
        this.refresh();
        DashboardView.refresh();
      }
    } catch (err) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  },

  async viewTeamMembers(supervisorId, supervisorName) {
    try {
      const res = await apiRequest(`/api/v1/supervisor/team-members?supervisor_id=${supervisorId}`);
      if (!res || !res.success) return;

      document.getElementById('teamMembersModalTitle').textContent = `Team Members for ${supervisorName}`;
      const tbody = document.getElementById('teamMembersTableBody');

      if (res.team_members.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
              No team members created yet under this supervisor.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = res.team_members.map(tm => `
          <tr>
            <td style="font-weight: 700;">${escapeHtml(tm.full_name)}</td>
            <td style="font-family: var(--font-mono);">${escapeHtml(tm.user_id)}</td>
            <td style="font-family: var(--font-mono);">${escapeHtml(tm.plain_password || '••••')}</td>
            <td><strong>${tm.total_submissions || 0}</strong></td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="SupervisorsView.copyCredentials('${escapeHtml(tm.full_name)}', '${escapeHtml(tm.user_id)}', '${escapeHtml(tm.plain_password || '')}')">
                <svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              </button>
            </td>
          </tr>
        `).join('');
      }

      openModal('teamMembersModal');
    } catch (err) {
      showToast('Could not load team members', 'error');
    }
  }
};
