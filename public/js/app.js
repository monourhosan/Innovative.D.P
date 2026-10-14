/**
 * Innovative Data Platform - Main Application Controller
 * Author: Made by Saif
 */

// Global State
const AppState = {
  token: localStorage.getItem('auth_token') || null,
  user: null,
  currentView: 'dashboard',
  soundEnabled: true
};

/**
 * Central authenticated API client
 */
async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};

  if (AppState.token) {
    headers['Authorization'] = `Bearer ${AppState.token}`;
  }

  // If not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      // Session expired
      logout();
      return null;
    }

    // Handle binary responses (e.g. Excel downloads)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('spreadsheetml') || contentType.includes('octet-stream')) {
      if (!res.ok) throw new Error('File download failed');
      return await res.blob();
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${endpoint}]:`, err);
    throw err;
  }
}

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

/**
 * Switch Views in SPA
 */
function switchView(viewName) {
  AppState.currentView = viewName;

  // Update navigation items
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update view panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Trigger view-specific reloads
  if (viewName === 'dashboard' && window.DashboardView) {
    window.DashboardView.refresh();
  } else if (viewName === 'projects' && window.ProjectsView) {
    window.ProjectsView.refresh();
  } else if (viewName === 'supervisors' && window.SupervisorsView) {
    window.SupervisorsView.refresh();
  } else if (viewName === 'submissions' && window.SubmissionsView) {
    window.SubmissionsView.refresh();
  } else if (viewName === 'simulator' && window.SimulatorView) {
    window.SimulatorView.refresh();
  }
}

/**
 * Logout
 */
function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_profile');
  document.cookie = 'token=; Max-Age=0; path=/;';
  window.location.href = '/login.html';
}

/**
 * Copy Text to Clipboard with feedback
 */
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    showToast(successMessage, 'success');
  } catch (err) {
    showToast('Failed to copy to clipboard', 'error');
  }
}

/**
 * Modal Utilities
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

/**
 * Initialize Application
 */
async function initApp() {
  if (!AppState.token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await apiRequest('/api/v1/auth/me');
    if (res && res.success) {
      AppState.user = res.user;

      // Update UI Header
      const userNameEl = document.getElementById('topbarUserName');
      const userRoleEl = document.getElementById('topbarUserRole');
      if (userNameEl) userNameEl.textContent = res.user.full_name;
      if (userRoleEl) userRoleEl.textContent = res.user.role;

      // Initialize Sub-Views
      if (window.DashboardView) window.DashboardView.init();
      if (window.ProjectsView) window.ProjectsView.init();
      if (window.SupervisorsView) window.SupervisorsView.init();
      if (window.SubmissionsView) window.SubmissionsView.init();
      if (window.SimulatorView) window.SimulatorView.init();
      if (window.ApiDocsView) window.ApiDocsView.init();

      // Show default view
      switchView('dashboard');
    } else {
      logout();
    }
  } catch (err) {
    console.error('Initialization error:', err);
    logout();
  }
}

// Global click delegation for modal closes
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Boot app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
