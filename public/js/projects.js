/**
 * Projects & Excel Form Builder View
 * Author: Made by Saif
 */

window.ProjectsView = {
  currentParsedSchema: null,
  currentUploadedFilename: '',

  init() {
    this.setupDropzone();
    this.refresh();
  },

  async refresh() {
    try {
      const res = await apiRequest('/api/v1/projects');
      if (res && res.success) {
        this.renderProjectsList(res.projects);
      }
    } catch (err) {
      console.warn('Could not load projects:', err);
    }
  },

  renderProjectsList(projects = []) {
    const container = document.getElementById('projectsListContainer');
    if (!container) return;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No Data Projects Created Yet</div>
          <div class="empty-state-desc">Upload an Excel (.xlsx) file above to automatically generate your first survey project.</div>
          <div class="empty-guide-arrow">⬆️ Drag & Drop an .xlsx file or download a sample template above to begin</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Form Questions</th>
              <th>Parsing Mode</th>
              <th>Total Submissions</th>
              <th>Supervisors</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr>
                <td>
                  <div style="font-weight: 700; color: var(--text-main); font-size: 15px;">${escapeHtml(p.title)}</div>
                  <div style="font-size: 12px; color: var(--text-muted); max-width: 320px;">
                    ${escapeHtml(p.description || p.original_xlsx_filename || 'No description')}
                  </div>
                </td>
                <td>
                  <span class="badge badge-primary">${p.total_fields || 0} questions</span>
                </td>
                <td>
                  <span class="badge ${p.mode === 'xlsform' ? 'badge-success' : 'badge-neutral'}">
                    ${p.mode === 'xlsform' ? 'Kobo XLSForm' : 'Simple Table'}
                  </span>
                </td>
                <td>
                  <strong style="color: var(--accent-green); font-size: 15px;">${p.total_submissions || 0}</strong>
                </td>
                <td>
                  <span class="badge badge-neutral">${p.assigned_supervisors_count || 0} assigned</span>
                </td>
                <td>
                  <span class="badge badge-success">● Active</span>
                </td>
                <td>
                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button class="btn btn-success btn-sm" onclick="SubmissionsView.downloadExcelForProject(${p.id}, '${escapeHtml(p.title)}')">
                      📥 Download .xlsx
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="ProjectsView.viewProjectDetails(${p.id})">
                      Preview Form
                    </button>
                    <button class="btn btn-outline btn-sm" style="color: var(--accent-red);" onclick="ProjectsView.deleteProject(${p.id}, '${escapeHtml(p.title)}')">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  setupDropzone() {
    const dropzone = document.getElementById('projectDropzone');
    const fileInput = document.getElementById('projectFileInput');
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.uploadAndPreviewFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.uploadAndPreviewFile(fileInput.files[0]);
      }
    });
  },

  /**
   * Upload .xlsx and open visual preview modal
   */
  async uploadAndPreviewFile(file) {
    if (!file) return;

    const validExtensions = /\.(xlsx|xls)$/i;
    if (!validExtensions.test(file.name)) {
      showToast('Please select a valid Excel file (.xlsx or .xls)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showToast('Parsing Excel spreadsheet structure...', 'info');

    try {
      const res = await apiRequest('/api/v1/projects/parse-xlsx', {
        method: 'POST',
        body: formData
      });

      if (res && res.success) {
        this.currentParsedSchema = res.schema;
        this.currentUploadedFilename = res.filename;
        this.openPublishPreviewModal(res);
      }
    } catch (err) {
      showToast(err.message || 'Failed to parse Excel file', 'error');
    }
  },

  /**
   * Render Visual Form Preview before publishing
   */
  async openPublishPreviewModal(parseResult) {
    const { schema, suggested_title, filename } = parseResult;

    document.getElementById('newProjectTitle').value = suggested_title || 'Community Assessment 2026';
    document.getElementById('newProjectDesc').value = `Data collection project generated from ${filename}`;
    document.getElementById('newProjectFilename').textContent = filename;

    // Set Mode Badge
    const modeBadge = document.getElementById('detectedModeBadge');
    if (schema.mode === 'xlsform') {
      modeBadge.className = 'badge badge-success';
      modeBadge.textContent = 'Standard KoboToolbox / XLSForm Mode';
    } else {
      modeBadge.className = 'badge badge-primary';
      modeBadge.textContent = 'Simple Table Header Mode';
    }

    // Populate Supervisor assignment checkboxes
    await this.populateSupervisorCheckboxes();

    // Render Question Cards
    const container = document.getElementById('previewQuestionsList');
    container.innerHTML = (schema.fields || []).map((f, idx) => {
      const choicesPills = (f.choices || []).map(c => 
        `<span style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 4px; padding: 2px 6px; font-size: 11px;">${escapeHtml(c.label || c.name)}</span>`
      ).join(' ');

      return `
        <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="font-weight: 700; color: var(--text-main);">
              <span style="color: var(--primary); font-size: 12px; margin-right: 6px;">Q${idx + 1}.</span>
              ${escapeHtml(f.label || f.name)}
            </div>
            <div style="display: flex; gap: 6px;">
              <span class="badge badge-neutral" style="font-size: 10px; font-family: var(--font-mono);">${f.type}</span>
              ${f.required ? '<span class="badge badge-danger" style="font-size: 10px;">Required</span>' : ''}
            </div>
          </div>
          ${f.hint ? `<div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">💡 ${escapeHtml(f.hint)}</div>` : ''}
          ${choicesPills ? `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">${choicesPills}</div>` : ''}
        </div>
      `;
    }).join('');

    openModal('publishProjectModal');
  },

  async populateSupervisorCheckboxes() {
    const container = document.getElementById('projectSupervisorCheckboxes');
    if (!container) return;

    try {
      const res = await apiRequest('/api/v1/admin/supervisors');
      if (res && res.supervisors && res.supervisors.length > 0) {
        container.innerHTML = res.supervisors.map(sup => `
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" name="assign_supervisor" value="${sup.id}" checked>
            <span>${escapeHtml(sup.full_name)} (${escapeHtml(sup.user_id)})</span>
          </label>
        `).join('');
      } else {
        container.innerHTML = '<span style="font-size: 12px; color: var(--text-muted);">No supervisors created yet. You can assign them later.</span>';
      }
    } catch (e) {
      container.innerHTML = '';
    }
  },

  /**
   * Finalize and Publish Project
   */
  async confirmPublishProject() {
    const title = document.getElementById('newProjectTitle').value.trim();
    const description = document.getElementById('newProjectDesc').value.trim();

    if (!title) {
      showToast('Please enter a project title', 'error');
      return;
    }

    // Collect assigned supervisor IDs
    const checked = document.querySelectorAll('input[name="assign_supervisor"]:checked');
    const assigned_supervisor_ids = Array.from(checked).map(cb => parseInt(cb.value, 10));

    const publishBtn = document.getElementById('publishConfirmBtn');
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing Project...';

    try {
      const res = await apiRequest('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          form_schema_json: this.currentParsedSchema,
          original_xlsx_filename: this.currentUploadedFilename,
          assigned_supervisor_ids
        })
      });

      if (res && res.success) {
        showToast('🎉 Project published successfully!', 'success');
        closeModal('publishProjectModal');
        this.refresh();
        DashboardView.refresh();
      }
    } catch (err) {
      showToast(err.message || 'Failed to publish project', 'error');
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'Publish Project Now';
    }
  },

  /**
   * View single project questions preview
   */
  async viewProjectDetails(projectId) {
    try {
      const res = await apiRequest(`/api/v1/projects/${projectId}`);
      if (!res || !res.project) return;

      const p = res.project;
      const schema = p.form_schema || {};
      const fields = schema.fields || [];

      document.getElementById('viewModalProjectTitle').textContent = p.title;
      document.getElementById('viewModalProjectDesc').textContent = p.description || 'No description provided.';

      const container = document.getElementById('viewModalQuestionsList');
      container.innerHTML = fields.map((f, i) => `
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>Q${i + 1}. ${escapeHtml(f.label || f.name)}</strong>
            <span class="badge badge-neutral">${f.type}</span>
          </div>
          ${f.choices && f.choices.length > 0 ? `
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Choices: ${f.choices.map(c => escapeHtml(c.label || c.name)).join(' • ')}
            </div>
          ` : ''}
        </div>
      `).join('');

      openModal('projectDetailsModal');
    } catch (err) {
      showToast('Could not load project preview', 'error');
    }
  },

  async deleteProject(projectId, title) {
    if (!confirm(`Are you sure you want to delete project "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await apiRequest(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
      if (res && res.success) {
        showToast('Project deleted successfully', 'success');
        this.refresh();
        DashboardView.refresh();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  },

  downloadXlsFormSample() {
    window.location.href = '/api/v1/projects/sample/xlsform';
  },

  downloadSimpleTableSample() {
    window.location.href = '/api/v1/projects/sample/simple-table';
  }
};
