import test from 'node:test';
import assert from 'node:assert/strict';
import { CLUSTER_MIN_SIZE, NODE_MIN_SIZE, resizeFromBottomRight } from '../src/scripts/core/resize.js';
import { connectionEndpointSize, connectionPortPoint } from '../src/scripts/core/connection-ports.js';
import { clampGroupDelta } from '../src/scripts/core/multi-select.js';
import { createPastedItems } from '../src/scripts/core/clipboard.js';

const limits = { minX: -3200, minY: -2400, maxX: 3200, maxY: 2400 };

test('redimensionnement borné avec dimensions minimales et positions négatives', () => {
  const item = { x: -100, y: -200 };
  assert.deepEqual(resizeFromBottomRight(item, 10, 10, NODE_MIN_SIZE, limits), { width: 120, height: 141 });
  assert.deepEqual(resizeFromBottomRight(item, 4000, 4000, CLUSTER_MIN_SIZE, limits), { width: 3300, height: 2600 });
  assert.equal(resizeFromBottomRight({ x: 3199, y: 0 }, 200, 200, NODE_MIN_SIZE, limits), null);
  assert.deepEqual(resizeFromBottomRight({ x: -5000, y: -4000 }, 8000, 7000, CLUSTER_MIN_SIZE, limits), { width: 6400, height: 4800 });
});

test('ports et déplacement groupé utilisent la taille réelle', () => {
  const node = { x: 100, y: 200, width: 300, height: 250 };
  const size = connectionEndpointSize(node, 'node', 158, 141);
  assert.deepEqual(connectionPortPoint(node, 'right', size.width, size.height), { x: 400, y: 325 });
  assert.deepEqual(connectionEndpointSize({ x: 0, y: 0 }, 'node', 158, 141), { width: 158, height: 141 });
  const group = [node, { x: 3000, y: 2100, width: 200, height: 300 }];
  assert.deepEqual(clampGroupDelta(group, 100, 100, 3200, 2400, 158, 141, -3200, -2400), { x: 0, y: 0 });
  const pasted = createPastedItems({ nodes: group, clusters: [], pasteCount: 0 }, limits, { width: 158, height: 141 }, () => 'copy');
  assert.deepEqual(pasted.nodes.map((item) => [item.x, item.y]), [[100, 200], [3000, 2100]]);
});
