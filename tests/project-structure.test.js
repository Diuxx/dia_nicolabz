import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../src/scripts/app.js', import.meta.url), 'utf8');
test('les trois menus contextuels sont présents', () => {
  assert.match(source, /heading: node.title/);
  assert.match(source, /heading: 'Connexion'/);
  assert.match(source, /heading: 'Tableau blanc'/);
});
test('profil, dialog de conflit et palette présents dans le template', () => {
  for (const id of ['profile-trigger', 'context-menu', 'sync-dialog', 'palette', 'board']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
test('36 icônes SVG cloud intégrées', () => {
  const base = readdirSync(new URL('../src/assets/icons/', import.meta.url)).filter((name) => name.endsWith('.svg'));
  const cloudIcons = readdirSync(new URL('../src/assets/icons/cloud/', import.meta.url)).filter((name) => name.endsWith('.svg'));
  assert.equal(base.length, 18);
  assert.equal(cloudIcons.length, 36);
  const cloud = readFileSync(new URL('../src/scripts/cloud-icons.js', import.meta.url), 'utf8');
  assert.match(cloud, /cloud-serverless/);
  assert.match(cloud, /cloud-podman-engine/);
});
