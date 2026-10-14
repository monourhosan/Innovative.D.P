/**
 * REST API Explorer & Android App Developer Documentation
 * Author: Made by Saif
 */

window.ApiDocsView = {
  init() {
    this.renderTokenInfo();
  },

  renderTokenInfo() {
    const tokenDisplay = document.getElementById('currentJwtTokenDisplay');
    if (tokenDisplay && AppState.token) {
      tokenDisplay.textContent = AppState.token;
    }
  },

  async runEndpointTest(endpoint, method = 'GET', body = null, outputElementId) {
    const outputEl = document.getElementById(outputElementId);
    if (!outputEl) return;

    outputEl.textContent = 'Executing API call...';
    outputEl.style.color = 'var(--text-muted)';

    try {
      const options = { method };
      if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const res = await apiRequest(endpoint, options);
      outputEl.textContent = JSON.stringify(res, null, 2);
      outputEl.style.color = '#10B981';
    } catch (err) {
      outputEl.textContent = `Error: ${err.message}`;
      outputEl.style.color = '#EF4444';
    }
  }
};
