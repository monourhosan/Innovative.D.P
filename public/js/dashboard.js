/**
 * Dashboard & Live Monitoring View
 * Author: Made by Saif
 */

window.DashboardView = {
  eventSource: null,
  pollTimer: null,
  stats: null,
  audioContext: null,

  init() {
    this.connectLiveStream();
    this.refresh();
  },

  /**
   * Fetch full dashboard stats and populate cards, tables, and recent feed
   */
  async refresh() {
    try {
      const res = await apiRequest('/api/v1/admin/dashboard-stats');
      if (!res || !res.success) return;

      this.stats = res;
      this.renderSummaryCards(res.summary);
      this.renderSupervisorsTable(res.supervisors);
      this.renderLiveFeed(res.recent_submissions);
    } catch (err) {
      console.warn('Could not refresh dashboard stats:', err);
    }
  },

  renderSummaryCards(summary) {
    if (!summary) return;
    document.getElementById('statTotalProjects').textContent = summary.total_projects || 0;
    document.getElementById('statTotalSupervisors').textContent = summary.total_supervisors || 0;
    document.getElementById('statTotalTeamMembers').textContent = summary.total_team_members || 0;
    document.getElementById('statTotalSubmissions').textContent = summary.total_submissions || 0;
    document.getElementById('statSubmissionsToday').textContent = `${summary.submissions_today || 0} today`;
  },

  renderSupervisorsTable(supervisors = []) {
    const tbody = document.getElementById('supervisorBreakdownBody');
    if (!tbody) return;

    if (supervisors.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px;">
            <div style="color: var(--text-muted); font-size: 14px;">No supervisors created yet.</div>
            <button class="btn btn-primary btn-sm" style="margin-top: 10px;" onclick="switchView('supervisors')">
              + Add Supervisor Now
            </button>
          </td>
        </tr>
      `;
      return;
    }

    // Calculate max submissions for relative progress bar
    const maxSubmissions = Math.max(...supervisors.map(s => s.total_submissions || 0), 10);

    tbody.innerHTML = supervisors.map(sup => {
      const pct = Math.min(Math.round(((sup.total_submissions || 0) / maxSubmissions) * 100), 100);
      const assignedCount = (sup.assigned_projects || []).length;
      const statusBadge = sup.is_active === 1
        ? '<span class="badge badge-success">● Active</span>'
        : '<span class="badge badge-neutral">Inactive</span>';

      const lastSeen = sup.last_submission_at
        ? `<span title="${sup.last_submission_at}">${this.formatRelativeTime(sup.last_submission_at)}</span>`
        : '<span style="color: var(--text-muted);">No submissions yet</span>';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(sup.full_name)}</div>
            <div style="font-size: 12px; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(sup.user_id)}</div>
          </td>
          <td>
            <span class="badge badge-primary">${sup.team_members_count || 0} members</span>
          </td>
          <td>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
              <span>${sup.total_submissions || 0} records</span>
              <span style="color: var(--accent-green); font-size: 11px;">+${sup.submissions_today || 0} today</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${pct}%;"></div>
            </div>
          </td>
          <td>
            <span class="badge badge-neutral">${assignedCount} project(s)</span>
          </td>
          <td style="font-size: 13px;">${lastSeen}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="SupervisorsView.openEditModal(${sup.id})">
              Edit
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderLiveFeed(submissions = []) {
    const feedContainer = document.getElementById('liveFeedContainer');
    if (!feedContainer) return;

    if (submissions.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
          </div>
          <div class="empty-state-title">Listening for Incoming Submissions...</div>
          <div class="empty-state-desc">Live submissions collected by Team Members will appear here in real-time.</div>
          <div class="empty-guide-arrow">You can test submitting form records in the Mobile Simulator tab.</div>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = submissions.map(sub => this.createFeedItemHtml(sub)).join('');
  },

  createFeedItemHtml(sub) {
    const answers = sub.answers || {};
    // Extract first 3 non-empty answer key-values for preview
    const previewPills = Object.entries(answers)
      .slice(0, 3)
      .map(([k, v]) => {
        const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `<span class="feed-pill"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(valStr)}</span>`;
      }).join(' ');

    const timeStr = this.formatRelativeTime(sub.server_timestamp);

    return `
      <div class="live-feed-item" id="feed-sub-${sub.id}">
        <div class="feed-icon">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="feed-content">
          <div class="feed-title">
            <span>${escapeHtml(sub.project_title || 'Data Project')}</span>
            <span class="badge badge-success" style="font-size: 10px;">New Record #${sub.id}</span>
          </div>
          <div class="feed-meta">
            Submitted by <strong>${escapeHtml(sub.team_member_name || sub.team_member_user_id || 'Team Member')}</strong>
            • Supervisor: <strong>${escapeHtml(sub.supervisor_name || 'Saif')}</strong>
            • <span title="${sub.server_timestamp}">${timeStr}</span>
          </div>
          ${previewPills ? `<div class="feed-answers-preview">${previewPills}</div>` : ''}
        </div>
        <button class="btn btn-outline btn-sm" onclick="SubmissionsView.showDetailModal(${sub.id})" style="align-self: center;">
          View Answers
        </button>
      </div>
    `;
  },

  /**
   * Real-time Server-Sent Events (SSE) Live Feed connection
   */
  connectLiveStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/v1/live/stream');

      this.eventSource.addEventListener('connected', (e) => {
        this.updateLiveIndicator(true);
      });

      this.eventSource.addEventListener('new_submission', (e) => {
        try {
          const sub = JSON.parse(e.data);
          this.handleIncomingSubmission(sub);
        } catch (err) {
          console.error('Error handling SSE new_submission:', err);
        }
      });

      this.eventSource.onerror = () => {
        this.updateLiveIndicator(false);
        // EventSource automatically retries connection
      };
    } catch (err) {
      console.warn('EventSource unsupported or blocked. Falling back to polling.', err);
      this.startPollingFallback();
    }
  },

  handleIncomingSubmission(sub) {
    this.playAudioNotification();
    showToast(`New submission received for "${sub.project_title || 'Project'}" from ${sub.team_member_name || 'Team Member'}!`, 'success');

    // Update Counter Badges
    const countEl = document.getElementById('statTotalSubmissions');
    if (countEl) {
      const cur = parseInt(countEl.textContent, 10) || 0;
      countEl.textContent = cur + 1;
    }

    const todayEl = document.getElementById('statSubmissionsToday');
    if (todayEl) {
      const match = todayEl.textContent.match(/(\d+)/);
      const curToday = match ? parseInt(match[1], 10) : 0;
      todayEl.textContent = `${curToday + 1} today`;
    }

    // Prepend to Live Feed
    const feedContainer = document.getElementById('liveFeedContainer');
    if (feedContainer) {
      // Remove empty state if present
      const emptyState = feedContainer.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      const itemHtml = this.createFeedItemHtml(sub);
      feedContainer.insertAdjacentHTML('afterbegin', itemHtml);

      // Keep maximum 20 items in live feed
      while (feedContainer.children.length > 20) {
        feedContainer.removeChild(feedContainer.lastChild);
      }
    }

    // Refresh supervisor breakdown
    this.refreshSupervisorsOnly();
  },

  async refreshSupervisorsOnly() {
    try {
      const res = await apiRequest('/api/v1/admin/dashboard-stats');
      if (res && res.success) {
        this.renderSupervisorsTable(res.supervisors);
      }
    } catch (e) {}
  },

  startPollingFallback() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.refresh();
    }, 8000);
  },

  updateLiveIndicator(isConnected) {
    const badge = document.getElementById('livePulseBadge');
    if (!badge) return;

    if (isConnected) {
      badge.innerHTML = '<span class="pulse-dot"></span> <span>LIVE FEED ACTIVE</span>';
      badge.style.display = 'inline-flex';
    } else {
      badge.innerHTML = '<span style="width: 8px; height: 8px; background: #94A3B8; border-radius: 50%;"></span> <span>RECONNECTING...</span>';
    }
  },

  playAudioNotification() {
    if (!AppState.soundEnabled) return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioContext = new AudioCtx();
      }
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioContext.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.25);
    } catch (e) {}
  },

  formatRelativeTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 10) return 'just now';
      if (diffSec < 60) return `${diffSec} seconds ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr} hr ago`;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  }
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
