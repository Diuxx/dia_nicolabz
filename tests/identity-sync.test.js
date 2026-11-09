import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronizeProject } from '../src/scripts/services/identity-sync.js';

const makeStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value)
  };
};
const local = { version: 1, name: 'local', customIcons: [], nodes: [], edges: [] };
const drive = { ...local, name: 'Drive' };

test('sans ancre, annuler ne modifie rien', async () => {
  let writes = 0, replacements = 0;
  const result = await synchronizeProject({
    api: { appId: 'archcanvas', readProject: async () => ({ version: 2, data: drive }), saveProject: async () => { writes++; } },
    userId: 8, storage: makeStorage(), getProject: () => local, applyProject: async () => { replacements++; }, choose: async () => 'cancel'
  });
  assert.equal(result, 'cancel');
  assert.equal(writes, 0);
  assert.equal(replacements, 0);
});

test('première sauvegarde vers Drive demande un choix', async () => {
  let sent = null;
  const storage = makeStorage();
  const api = { appId: 'archcanvas', readProject: async () => ({ version: 0, data: null }),
    saveProject: async (version, data) => { sent = { version, data }; return { version: 1 }; } };
  const result = await synchronizeProject({ api, userId: 8, storage, getProject: () => local,
    applyProject: async () => assert.fail('ne doit pas écraser'), choose: async () => 'local' });
  assert.equal(result, 'created');
  assert.deepEqual(sent, { version: 0, data: local });
  assert.equal(JSON.parse(storage.getItem('archcanvas:identity:anchor:v1:archcanvas:8')).version, 1);
});

test('en cas de PUT 409, ne met pas à jour l’ancre', async () => {
  let saved;
  const storage = makeStorage();
  const api = { appId: 'archcanvas', readProject: async () => ({ version: 3, data: drive }),
    saveProject: async () => { throw new Error('409'); } };
  await assert.rejects(synchronizeProject({ api, userId: 8, storage, getProject: () => local,
    applyProject: async (data) => { saved = data; }, choose: async () => 'local' }), /409/);
  assert.equal(saved, undefined);
  assert.equal(storage.getItem('archcanvas:identity:anchor:v1:archcanvas:8'), null);
});
