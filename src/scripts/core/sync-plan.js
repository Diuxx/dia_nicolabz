/** Politique de synchronisation explicite : aucune écriture sans contrôle. */
export function decideSync({ anchor, localDigest, remoteDigest, remoteVersion }) {
  if (localDigest === remoteDigest) return 'identical';
  if (!anchor || !Number.isSafeInteger(anchor.version) || typeof anchor.digest !== 'string') return 'conflict';
  const localChanged = localDigest !== anchor.digest;
  const remoteChanged = remoteVersion !== anchor.version || remoteDigest !== anchor.digest;
  if (localChanged && remoteChanged) return 'conflict';
  if (remoteChanged) return 'remote';
  if (localChanged) return 'local';
  return 'conflict';
}

/** Empreinte stable, indépendante de l'ordre des propriétés de JSON. */
export function canonicalJson(value) {
  return JSON.stringify(value, (_key, item) => {
    if (!item || Array.isArray(item) || typeof item !== 'object') return item;
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)));
  });
}

export async function digestProject(data) {
  const bytes = new TextEncoder().encode(canonicalJson(data));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
