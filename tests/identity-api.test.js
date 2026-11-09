import test from 'node:test';
import assert from 'node:assert/strict';
import { IdentityApi, IdentityApiError } from '../src/scripts/services/identity-api.js';

test('login encode app et return_to', () => {
  const api = new IdentityApi({ baseUrl: 'http://localhost:3000', appId: 'archcanvas' });
  const url = new URL(api.loginUrl('http://localhost:8081/?foo=a&bar=b'));
  assert.equal(url.pathname, '/auth/google/start');
  assert.equal(url.searchParams.get('app'), 'archcanvas');
  assert.equal(url.searchParams.get('return_to'), 'http://localhost:8081/?foo=a&bar=b');
});
test('refuse HTTP non sécurisé en production', () => {
  assert.throws(() => new IdentityApi({ baseUrl: 'http://auth.example.com', appId: 'archcanvas' }), /invalide/);
});
test('PUT versionné utilise le cookie et le bon namespace', async () => {
  const calls = [];
  const api = new IdentityApi({ baseUrl: 'http://localhost:3000', appId: 'archcanvas',
    fetchFunction: async (url, options) => {
      calls.push({ url: String(url), options });
      return { ok: true, status: 200, json: async () => ({ version: 4 }) };
    } });
  assert.deepEqual(await api.saveProject(3, { nodes: [], edges: [] }), { version: 4 });
  assert.equal(calls[0].url, 'http://localhost:3000/api/sync/archcanvas');
  assert.equal(calls[0].options.credentials, 'include');
  assert.deepEqual(JSON.parse(calls[0].options.body), { version: 3, data: { nodes: [], edges: [] } });
});
test('409 est une erreur explicite sans nouvelle écriture', async () => {
  const api = new IdentityApi({ baseUrl: 'http://localhost:3000', appId: 'archcanvas',
    fetchFunction: async () => ({ ok: false, status: 409, json: async () => ({ error: { code: 'VERSION_CONFLICT', message: 'Version obsolète' } }) }) });
  await assert.rejects(api.saveProject(0, {}), (error) => error instanceof IdentityApiError && error.status === 409);
});
