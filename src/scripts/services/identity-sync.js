import { decideSync, digestProject } from '../core/sync-plan.js';

const PREFIX = 'archcanvas:identity:anchor:v1:';
const keyFor = (appId, userId) => `${PREFIX}${appId}:${userId}`;

function readAnchor(storage, appId, userId) {
  try { return JSON.parse(storage.getItem(keyFor(appId, userId)) || 'null'); }
  catch { return null; }
}

function saveAnchor(storage, appId, userId, version, digest) {
  storage.setItem(keyFor(appId, userId), JSON.stringify({ version, digest, updatedAt: new Date().toISOString() }));
}

/**
 * Synchronise un unique schéma avec le JSON versionné de l'API Identity.
 * Les choix explicites et le CAS versionné protègent des pertes de données.
 */
export async function synchronizeProject({ api, userId, storage, getProject, applyProject, choose }) {
  if (userId === null || userId === undefined) throw new Error('Compte Google requis.');
  const local = getProject();
  const localDigest = await digestProject(local);
  const remote = await api.readProject();
  if (!Number.isSafeInteger(remote.version) || remote.version < 0) throw new Error('Version Drive invalide.');

  if (remote.data === null) {
    if (remote.version !== 0) throw new Error('Réponse Drive incohérente.');
    const choice = await choose('empty');
    if (choice !== 'local') return 'cancel';
    const saved = await api.saveProject(0, local);
    saveAnchor(storage, api.appId, userId, saved.version, localDigest);
    return 'created';
  }

  // Valider le JSON distant avant de demander à l'utilisateur de le charger.
  const remoteData = remote.data;
  const remoteDigest = await digestProject(remoteData);
  let decision = decideSync({
    anchor: readAnchor(storage, api.appId, userId), localDigest,
    remoteDigest, remoteVersion: remote.version
  });
  if (decision === 'conflict') decision = await choose('conflict');
  if (decision === 'cancel') return 'cancel';
  if (decision === 'identical') {
    saveAnchor(storage, api.appId, userId, remote.version, remoteDigest);
    return 'identical';
  }
  if (decision === 'remote') {
    await applyProject(remoteData);
    saveAnchor(storage, api.appId, userId, remote.version, remoteDigest);
    return 'downloaded';
  }
  if (decision === 'local') {
    const saved = await api.saveProject(remote.version, local);
    saveAnchor(storage, api.appId, userId, saved.version, localDigest);
    return 'uploaded';
  }
  throw new Error('Décision de synchronisation inconnue.');
}
