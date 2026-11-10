import test from 'node:test';
import assert from 'node:assert/strict';
import { edgeLineSvgAttributes, normalizeEdgeLineType } from '../src/scripts/core/edge-style.js';

test('les styles de liaison configurent flèches et pointillés', () => {
  assert.deepEqual(edgeLineSvgAttributes('arrow-right', 'arrow'), { 'marker-end': 'url(#arrow)' });
  assert.deepEqual(edgeLineSvgAttributes('arrow-left', 'arrow'), { 'marker-start': 'url(#arrow-start)' });
  assert.deepEqual(edgeLineSvgAttributes('arrow-both', 'arrow'), { 'marker-start': 'url(#arrow-start)', 'marker-end': 'url(#arrow)' });
  assert.deepEqual(edgeLineSvgAttributes('dotted', 'arrow'), { 'stroke-dasharray': '3 6' });
});

test('les types inconnus utilisent le style avec flèche vers la droite', () => {
  assert.equal(normalizeEdgeLineType('unknown'), 'arrow-right');
  assert.deepEqual(edgeLineSvgAttributes(undefined, 'arrow'), { 'marker-end': 'url(#arrow)' });
});
