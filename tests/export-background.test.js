import test from 'node:test';
import assert from 'node:assert/strict';
import { exportBackgroundSvg } from '../src/scripts/core/export-background.js';

const bounds = { x: -64, y: -75, width: 300, height: 250 };

test('le fond blanc couvre exactement la zone exportée', () => {
  assert.equal(exportBackgroundSvg('white', bounds),
    '<rect x="-64" y="-75" width="300" height="250" fill="#ffffff"/>');
});

test('le fond pointillé couvre la zone et utilise une grille alignée au canevas', () => {
  const svg = exportBackgroundSvg('dotted', bounds);
  assert.match(svg, /patternUnits="userSpaceOnUse" width="25" height="25"/);
  assert.match(svg, /cx="12.5" cy="12.5" r="1.1" fill="#dce2ee"/);
  assert.match(svg, /<rect x="-64" y="-75" width="300" height="250" fill="#fcfdff"\/>/);
  assert.match(svg, /<rect x="-64" y="-75" width="300" height="250" fill="url\(#export-dots\)"\/>/);
});

test('un choix de fond inconnu est refusé', () => {
  assert.throws(() => exportBackgroundSvg('transparent', bounds), /Fond d’export PNG inconnu/);
});
