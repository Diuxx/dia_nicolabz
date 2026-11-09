import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSync, canonicalJson } from '../src/scripts/core/sync-plan.js';

const anchor = { version: 3, digest: 'abc' };
test('des JSON équivalents produisent la même représentation', () => {
  assert.equal(canonicalJson({ b: 2, a: { y: 3, x: 1 } }), canonicalJson({ a: { x: 1, y: 3 }, b: 2 }));
});
test('conflit sans référence de synchronisation', () => {
  assert.equal(decideSync({ anchor: null, localDigest: 'local', remoteDigest: 'drive', remoteVersion: 2 }), 'conflict');
});
test('local inchangé et Drive modifié -> télécharger', () => {
  assert.equal(decideSync({ anchor, localDigest: 'abc', remoteDigest: 'xyz', remoteVersion: 4 }), 'remote');
});
test('Drive inchangé et local modifié -> envoyer', () => {
  assert.equal(decideSync({ anchor, localDigest: 'xyz', remoteDigest: 'abc', remoteVersion: 3 }), 'local');
});
test('deux modifications concurrentes -> conflit', () => {
  assert.equal(decideSync({ anchor, localDigest: 'xy', remoteDigest: 'zw', remoteVersion: 4 }), 'conflict');
});
test('identique -> aucune écriture', () => {
  assert.equal(decideSync({ anchor: null, localDigest: 'same', remoteDigest: 'same', remoteVersion: 1 }), 'identical');
});
