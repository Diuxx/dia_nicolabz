import test from 'node:test';
import assert from 'node:assert/strict';
import { alignMovingNodes } from '../src/scripts/core/alignment-guides.js';

const limits = { minX: -3200, minY: -2400, maxX: 3200, maxY: 2400 };
const size = { width: 100, height: 100 };
const align = (moving, others, delta, threshold = 6) => alignMovingNodes(moving, others, delta, threshold, limits, size);

test('accroche les bords et les centres sur les deux axes', () => {
  const result = align([{ x: 0, y: 0, width: 100, height: 100 }],
    [{ x: 200, y: 300, width: 200, height: 200 }], { x: 103, y: 195 });
  assert.deepEqual(result.delta, { x: 100, y: 200 });
  assert.deepEqual(result.guides, [
    { axis: 'x', coordinate: 200, start: 200, end: 500 },
    { axis: 'y', coordinate: 300, start: 100, end: 400 }
  ]);
  const center = align([{ x: 0, y: 0, width: 100, height: 100 }],
    [{ x: 100, y: 500, width: 200, height: 100 }], { x: 147, y: 0 });
  assert.equal(center.delta.x, 150);
});

test('choisit la correspondance la plus proche et ne crée aucun guide hors seuil', () => {
  const moving = [{ x: 0, y: 0 }];
  const others = [{ x: 203, y: 500 }, { x: 201, y: 800 }];
  assert.equal(align(moving, others, { x: 100, y: 0 }).delta.x, 101);
  assert.deepEqual(align(moving, others, { x: 50, y: 0 }).guides, []);
});

test('préserve les écarts de groupe et respecte les limites du canevas', () => {
  const moving = [{ x: 100, y: 0, width: 100, height: 100 }, { x: 300, y: 0, width: 200, height: 100 }];
  const result = align(moving, [{ x: 604, y: 400, width: 100, height: 100 }], { x: 100, y: 0 });
  assert.equal(result.delta.x, 104);
  assert.equal(moving[1].x + result.delta.x - (moving[0].x + result.delta.x), 200);
  const edge = align([{ x: 3100, y: 0 }], [{ x: 3204, y: 500 }], { x: 0, y: 0 });
  assert.equal(edge.delta.x, 0);
  assert.deepEqual(edge.guides, []);
});

test('une sélection sans autre carte ne s’accroche pas', () => {
  assert.deepEqual(align([{ x: 0, y: 0 }], [], { x: -30, y: 40 }), { delta: { x: -30, y: 40 }, guides: [] });
});

test('accepte le seuil exact et les coordonnées négatives', () => {
  const moving = [{ x: -300, y: -300, width: 100, height: 100 }];
  const target = [{ x: -100, y: 100, width: 100, height: 100 }];
  assert.equal(align(moving, target, { x: 94, y: 0 }, 6).delta.x, 100);
  assert.equal(align(moving, target, { x: 94, y: 0 }, 5.99).delta.x, 94);
});

test('aligne simultanément les deux axes pour une sélection proche des limites', () => {
  const moving = [{ x: 2900, y: 2100 }, { x: 3000, y: 2200 }];
  const target = [{ x: 3100, y: 2300 }];
  const result = align(moving, target, { x: 96, y: 96 });
  assert.deepEqual(result.delta, { x: 100, y: 100 });
  assert.deepEqual(result.guides.map((guide) => guide.axis), ['x', 'y']);
});
