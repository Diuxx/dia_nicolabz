/** Client minimal de l'API centrale Nicolabz Identity. */
export class IdentityApiError extends Error {
  constructor(message, code, status, options = {}) {
    super(message, options);
    this.name = 'IdentityApiError';
    this.code = code;
    this.status = status;
  }
}

export class IdentityApi {
  constructor({ baseUrl, appId, fetchFunction = globalThis.fetch }) {
    const url = new URL(baseUrl);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) ||
        !/^[a-z0-9_-]{1,48}$/i.test(appId)) {
      throw new Error('Configuration invalide du service de connexion.');
    }
    this.baseUrl = url.origin;
    this.appId = appId;
    this.fetchFunction = (...args) => fetchFunction(...args);
  }

  redirectUrl(route, returnTo) {
    const url = new URL(route, this.baseUrl);
    url.searchParams.set('app', this.appId);
    url.searchParams.set('return_to', returnTo);
    return url.href;
  }

  loginUrl(returnTo) { return this.redirectUrl('/auth/google/start', returnTo); }
  driveConsentUrl(returnTo) { return this.redirectUrl('/auth/drive/start', returnTo); }

  async request(path, options = {}) {
    let response;
    try {
      response = await this.fetchFunction(new URL(path, this.baseUrl), {
        credentials: 'include', cache: 'no-store', ...options,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
      });
    } catch (error) {
      throw new IdentityApiError('API d’identité inaccessible (adresse, CORS ou HTTPS).', 'NETWORK_ERROR', 0, { cause: error });
    }
    let body;
    try { body = await response.json(); }
    catch { throw new IdentityApiError('Réponse du serveur invalide.', 'INVALID_RESPONSE', response.status); }
    if (!response.ok) throw new IdentityApiError(body?.error?.message || `Erreur HTTP ${response.status}`,
      body?.error?.code || 'API_ERROR', response.status);
    return body;
  }

  getSession() { return this.request('/api/session'); }
  logout() { return this.request('/api/logout', { method: 'POST' }); }
  readProject() { return this.request(`/api/sync/${this.appId}`); }
  saveProject(version, data) {
    return this.request(`/api/sync/${this.appId}`, {
      method: 'PUT', body: JSON.stringify({ version, data })
    });
  }
}
