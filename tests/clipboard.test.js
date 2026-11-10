import test from 'node:test';
import assert from 'node:assert/strict';
import { createPastedItems } from '../src/scripts/core/clipboard.js';

const limits = { minX: -3200, minY: -2400, maxX: 3200, maxY: 2400 };
const size = { width: 158, height: 141 };

test('coller plusieurs cartes conserve leurs écarts, leurs données et ne copie pas leurs liaisons', () => {
  const clipboard = { nodes: [
    { id: 'a', x: -100, y: 20, title: 'Carte', iconId: 'browser' },
    { id: 'b', x: 200, y: 120, title: 'Autre', iconId: 'api' }
  ], clusters: [], pasteCount: 1 };
  let nextId = 0;
  const result = createPastedItems(clipboard, limits, size, () => `copy-${++nextId}`);
  assert.deepEqual(result.nodes.map(({ id, x, y }) => ({ id, x, y })), [
    { id: 'copy-1', x: -30, y: 90 }, { id: 'copy-2', x: 270, y: 190 }
  ]);
  assert.equal(result.nodes[0].title, 'Carte');
  assert.equal(clipboard.nodes[0].x, -100);
  assert.deepEqual(Object.keys(result), ['nodes', 'clusters']);
});

test('les copies restent dans les limites pour les cartes et les clusters', () => {
  const clipboard = { nodes: [{ id: 'a', x: 3000, y: 2200 }, { id: 'b', x: 3042, y: 2259 }],
    clusters: [{ id: 'c', x: 3000, y: 2200, width: 200, height: 200 }], pasteCount: 0 };
  const result = createPastedItems(clipboard, limits, size, () => 'new-id');
  assert.deepEqual(result.nodes.map(({ x, y }) => ({ x, y })), [{ x: 3000, y: 2200 }, { x: 3042, y: 2259 }]);
  assert.deepEqual(result.clusters[0], { id: 'new-id', x: 3000, y: 2200, width: 200, height: 200 });
});
