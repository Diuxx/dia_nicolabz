import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardMoveDelta } from '../src/scripts/core/keyboard-move.js';

const limits = { minX: -3200, minY: -2400, maxX: 3200, maxY: 2400 };
const size = { width: 158, height: 141 };

test('les flèches déplacent dans les quatre directions avec un pas rapide optionnel', () => {
  const nodes = [{ x: 0, y: 0 }];
  assert.deepEqual(keyboardMoveDelta(nodes, 'ArrowLeft', false, limits, size), { x: -1, y: 0 });
  assert.deepEqual(keyboardMoveDelta(nodes, 'ArrowRight', true, limits, size), { x: 10, y: 0 });
  assert.deepEqual(keyboardMoveDelta(nodes, 'ArrowUp', true, limits, size), { x: 0, y: -10 });
  assert.deepEqual(keyboardMoveDelta(nodes, 'ArrowDown', false, limits, size), { x: 0, y: 1 });
  assert.equal(keyboardMoveDelta(nodes, 'a', false, limits, size), null);
  assert.equal(keyboardMoveDelta([], 'ArrowUp', false, limits, size), null);
});

test('les limites tiennent compte de la taille de chaque élément et du groupe', () => {
  const group = [{ x: -3200, y: 0, width: 200, height: 300 }, { x: 2995, y: 2100, width: 200, height: 300 }];
  assert.deepEqual(keyboardMoveDelta(group, 'ArrowLeft', false, limits, size), { x: 0, y: 0 });
  assert.deepEqual(keyboardMoveDelta(group, 'ArrowRight', true, limits, size), { x: 5, y: 0 });
  assert.deepEqual(keyboardMoveDelta(group, 'ArrowDown', true, limits, size), { x: 0, y: 0 });
});

test('une position importée hors limites ne provoque pas de saut inattendu', () => {
  const item = [{ x: 4000, y: 0, width: 200, height: 200 }];
  assert.deepEqual(keyboardMoveDelta(item, 'ArrowRight', false, limits, size), { x: 0, y: 0 });
  assert.deepEqual(keyboardMoveDelta(item, 'ArrowLeft', true, limits, size), { x: -10, y: 0 });
  assert.deepEqual(keyboardMoveDelta(item, 'ArrowUp', false, limits, size), { x: 0, y: -1 });
});
