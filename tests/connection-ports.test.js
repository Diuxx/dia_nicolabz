import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionPortNormal, connectionPortPoint, inferConnectionPorts } from '../src/scripts/core/connection-ports.js';

const size = { width: 158, height: 141 };

test('les ports les plus proches sont choisis selon l’axe dominant', () => {
  assert.deepEqual(inferConnectionPorts({ x: 0, y: 0 }, { x: 300, y: 20 }, size.width, size.height), { fromPort: 'right', toPort: 'left' });
  assert.deepEqual(inferConnectionPorts({ x: 0, y: 0 }, { x: 20, y: 300 }, size.width, size.height), { fromPort: 'bottom', toPort: 'top' });
  assert.deepEqual(inferConnectionPorts({ x: 300, y: 0 }, { x: 0, y: 20 }, size.width, size.height), { fromPort: 'left', toPort: 'right' });
  assert.deepEqual(inferConnectionPorts({ x: 0, y: 300 }, { x: 20, y: 0 }, size.width, size.height), { fromPort: 'top', toPort: 'bottom' });
});

test('les points et normales des ports correspondent aux quatre côtés', () => {
  const node = { x: 10, y: 20 };
  assert.deepEqual(connectionPortPoint(node, 'top', size.width, size.height), { x: 89, y: 20 });
  assert.deepEqual(connectionPortPoint(node, 'right', size.width, size.height), { x: 168, y: 90.5 });
  assert.deepEqual(connectionPortPoint(node, 'bottom', size.width, size.height), { x: 89, y: 161 });
  assert.deepEqual(connectionPortPoint(node, 'left', size.width, size.height), { x: 10, y: 90.5 });
  assert.deepEqual(connectionPortNormal('top'), { x: 0, y: -1 });
  assert.deepEqual(connectionPortNormal('bottom'), { x: 0, y: 1 });
});
