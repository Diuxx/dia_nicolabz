import test from 'node:test';
import assert from 'node:assert/strict';
import { clampGroupDelta } from '../src/scripts/core/multi-select.js';

test('la sélection groupée conserve les décalages et borne tout le groupe au canevas', () => {
  const group = [{ id: 'a', x: 20, y: 30 }, { id: 'b', x: 180, y: 130 }];
  const delta = clampGroupDelta(group, -50, 200, 500, 400, 100, 80);

  assert.deepEqual(delta, { x: -20, y: 190 });
  assert.equal(group[1].x + delta.x - (group[0].x + delta.x), 160);
  assert.equal(group[1].y + delta.y - (group[0].y + delta.y), 100);
});

test('un groupe plus grand que le canevas est déplacé sans disloquer ses nœuds', () => {
  const group = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 600, y: 450 }];
  assert.deepEqual(clampGroupDelta(group, -20, 20, 500, 400, 100, 80), { x: 0, y: 0 });
});
