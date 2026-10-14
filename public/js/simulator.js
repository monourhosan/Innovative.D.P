/**
 * Android Companion App Mobile Simulator
 * Author: Made by Saif
 * Allows immediate end-to-end field data collection testing in the browser
 */

window.SimulatorView = {
  projects: [],
  selectedProject: null,
  currentMember: {
    id: 3,
    user_id: 'TM-2001',
    full_name: 'Rahim Ahmed (Enumerator)'
  },

  init() {
    this.refresh();
  },

  async refresh() {
    try {
      const res = await apiRequest('/api/v1/projects');
      if (res && res.projects) {
        this.projects = res.projects;
        this.populateProjectSelect();
      }
    } catch (e) {
      console.warn('Simulator init error:', e);
    }
  },

  populateProjectSelect() {
    const select = document.getElementById('simulatorProjectSelect');
    if (!select) return;

    if (this.projects.length === 0) {
      select.innerHTML = '<option value="">No Active Projects</option>';
      document.getElementById('simulatorFormContainer').innerHTML = `
        <div style="text-align: center; padding: 30px 16px; color: var(--text-muted); font-size: 13px;">
          Upload an Excel project to start collecting data.
        </div>
      `;
      return;
    }

    select.innerHTML = this.projects.map(p => 
      `<option value="${p.id}">${escapeHtml(p.title)}</option>`
    ).join('');

    this.loadProjectForm(this.projects[0].id);

    select.onchange = (e) => {
      this.loadProjectForm(e.target.value);
    };
  },

  async loadProjectForm(projectId) {
    const container = document.getElementById('simulatorFormContainer');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading form questions...</div>';

    try {
      const res = await apiRequest(`/api/v1/projects/${projectId}`);
      if (!res || !res.project) return;

      this.selectedProject = res.project;
      const schema = res.project.form_schema || {};
      const fields = schema.fields || [];

      if (fields.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: var(--text-muted); text-align: center;">This project has no questions.</div>';
        return;
      }

      const formHtml = fields.map((f, idx) => {
        let inputHtml = '';
        const inputId = `sim_field_${f.name || f.id}`;

        if (f.type === 'select_one') {
          const options = (f.choices || []).map(c => 
            `<option value="${escapeHtml(c.name)}">${escapeHtml(c.label || c.name)}</option>`
          ).join('');
          inputHtml = `
            <select id="${inputId}" class="form-control" ${f.required ? 'required' : ''}>
              <option value="">-- Select an option --</option>
              ${options}
            </select>
          `;
        } else if (f.type === 'select_multiple') {
          inputHtml = (f.choices || []).map(c => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; margin-top: 4px; cursor: pointer;">
              <input type="checkbox" name="${inputId}" value="${escapeHtml(c.name)}">
              <span>${escapeHtml(c.label || c.name)}</span>
            </label>
          `).join('');
        } else if (f.type === 'number') {
          inputHtml = `<input type="number" id="${inputId}" class="form-control" placeholder="Enter number" ${f.required ? 'required' : ''}>`;
        } else if (f.type === 'date') {
          inputHtml = `<input type="date" id="${inputId}" class="form-control" ${f.required ? 'required' : ''}>`;
        } else if (f.type === 'textarea') {
          inputHtml = `<textarea id="${inputId}" class="form-control" rows="2" placeholder="Enter notes / remarks" ${f.required ? 'required' : ''}></textarea>`;
        } else if (f.type === 'gps') {
          inputHtml = `
            <div style="display: flex; gap: 6px;">
              <input type="text" id="${inputId}" class="form-control" placeholder="Lat, Long (e.g. 23.8103, 90.4125)" ${f.required ? 'required' : ''}>
              <button type="button" class="btn btn-outline btn-sm" onclick="SimulatorView.captureGps('${inputId}')" title="Simulate GPS capture">
                📍 GPS
              </button>
            </div>
          `;
        } else {
          // Standard text / phone / email
          const placeholder = f.type === 'phone' ? 'e.g. +8801712345678' : f.type === 'email' ? 'name@example.com' : 'Enter answer';
          inputHtml = `<input type="text" id="${inputId}" class="form-control" placeholder="${placeholder}" ${f.required ? 'required' : ''}>`;
        }

        return `
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 13px; margin-bottom: 4px;">
              <span style="color: var(--primary); font-weight: 700;">${idx + 1}.</span> ${escapeHtml(f.label || f.name)}
              ${f.required ? '<span style="color: var(--accent-red);">*</span>' : ''}
            </label>
            ${f.hint ? `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">💡 ${escapeHtml(f.hint)}</div>` : ''}
            ${inputHtml}
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <form id="simulatorDataForm" onsubmit="SimulatorView.submitForm(event)">
          ${formHtml}
          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="SimulatorView.fillSampleData()" style="flex: 1;">
              🪄 Auto-Fill Sample
            </button>
            <button type="submit" id="simSubmitBtn" class="btn btn-primary" style="flex: 2;">
              📤 Submit Record Now
            </button>
          </div>
        </form>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color: var(--accent-red); padding: 16px;">Error loading form: ${err.message}</div>`;
    }
  },

  captureGps(inputId) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          document.getElementById(inputId).value = coords;
          showToast('GPS coordinates acquired!', 'success');
        },
        () => {
          // Simulated fallback coordinate
          document.getElementById(inputId).value = '23.8103, 90.4125';
          showToast('Simulated GPS coordinates filled!', 'info');
        }
      );
    } else {
      document.getElementById(inputId).value = '23.8103, 90.4125';
      showToast('Simulated GPS coordinates filled!', 'info');
    }
  },

  fillSampleData() {
    if (!this.selectedProject) return;
    const fields = (this.selectedProject.form_schema || {}).fields || [];

    const sampleNames = ['Sultana Razia', 'Mohammad Tariq', 'Jannatul Ferdous', 'Abul Kashem', 'Nusrat Jahan'];
    const chosenName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

    for (const f of fields) {
      const el = document.getElementById(`sim_field_${f.name || f.id}`);
      if (!el) continue;

      if (f.type === 'select_one') {
        if (f.choices && f.choices.length > 0) {
          const randomChoice = f.choices[Math.floor(Math.random() * f.choices.length)];
          el.value = randomChoice.name;
        }
      } else if (f.type === 'number') {
        el.value = Math.floor(20 + Math.random() * 50);
      } else if (f.type === 'date') {
        el.value = new Date().toISOString().substring(0, 10);
      } else if (f.type === 'phone') {
        el.value = `+880171${Math.floor(1000000 + Math.random() * 9000000)}`;
      } else if (f.type === 'gps') {
        el.value = `23.${Math.floor(8000 + Math.random() * 200)}, 90.${Math.floor(4000 + Math.random() * 200)}`;
      } else if (f.type === 'textarea') {
        el.value = 'Enumerator confirmed household details. Good overall water accessibility.';
      } else {
        if (/name/i.test(f.name || f.label)) {
          el.value = chosenName;
        } else {
          el.value = 'Field observation verified';
        }
      }
    }

    showToast('Auto-filled form with sample field data', 'info');
  },

  async submitForm(event) {
    event.preventDefault();
    if (!this.selectedProject) return;

    const fields = (this.selectedProject.form_schema || {}).fields || [];
    const answers = {};

    for (const f of fields) {
      const el = document.getElementById(`sim_field_${f.name || f.id}`);
      if (!el) continue;

      if (f.type === 'select_multiple') {
        const checked = document.querySelectorAll(`input[name="sim_field_${f.name || f.id}"]:checked`);
        answers[f.name || f.id] = Array.from(checked).map(c => c.value);
      } else {
        answers[f.name || f.id] = el.value;
      }
    }

    const submitBtn = document.getElementById('simSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await apiRequest('/api/v1/member/submissions', {
        method: 'POST',
        body: JSON.stringify({
          project_id: this.selectedProject.id,
          answers_json: answers,
          client_timestamp: new Date().toISOString()
        })
      });

      if (res && res.success) {
        showToast('🚀 Submission recorded! Check Live Dashboard to watch real-time stream.', 'success');
        
        // Reset form
        document.getElementById('simulatorDataForm').reset();

        // Switch to Live Dashboard tab after 1.2s to show off real-time update
        setTimeout(() => {
          switchView('dashboard');
        }, 1200);
      }
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Submit Record Now';
    }
  }
};
