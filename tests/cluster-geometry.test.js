import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterBounds } from '../src/scripts/core/cluster-geometry.js';

test('calcul des limites du rectangle quelle que soit la direction du glisser', () => {
  assert.deepEqual(clusterBounds({ x: 180, y: 220 }, { x: 20, y: 40 }), { x: 20, y: 40, width: 160, height: 180 });
  assert.deepEqual(clusterBounds({ x: 0, y: 0 }, { x: 10, y: 10 }), { x: 0, y: 0, width: 80, height: 80 });
});
