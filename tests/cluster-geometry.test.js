import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterBounds } from '../src/scripts/core/cluster-geometry.js';

test('calcul des limites du rectangle quelle que soit la direction du glisser', () => {
  assert.deepEqual(clusterBounds({ x: 180, y: 220 }, { x: 20, y: 40 }), { x: 20, y: 40, width: 160, height: 180 });
  assert.deepEqual(clusterBounds({ x: 0, y: 0 }, { x: 10, y: 10 }), { x: 0, y: 0, width: 80, height: 80 });
});

test('les clusters restent dans les limites autour de l’origine', () => {
  const limits = { minX: -3200, minY: -2400, maxX: 3200, maxY: 2400 };
  assert.deepEqual(clusterBounds({ x: -100, y: -200 }, { x: 100, y: 0 }, 80, limits),
    { x: -100, y: -200, width: 200, height: 200 });
  assert.deepEqual(clusterBounds({ x: 3199, y: 2399 }, { x: 4000, y: 3000 }, 80, limits),
    { x: 3120, y: 2320, width: 80, height: 80 });
  assert.deepEqual(clusterBounds({ x: 0, y: 0 }, { x: -4000, y: -3000 }, 80, limits),
    { x: -3200, y: -2400, width: 3200, height: 2400 });
});
