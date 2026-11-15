import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));

test('design system Git dependency is pinned in both manifests', () => {
  const spec = pkg.dependencies['@nicolabz/design-system'];
  assert.match(spec, /^git\+https:\/\/github\.com\/Diuxx\/nicolabz-design-system\.git#[a-f0-9]{40}$/);
  assert.equal(lock.packages[''].dependencies['@nicolabz/design-system'], spec);
  assert.equal(lock.packages['node_modules/@nicolabz/design-system'].resolved, spec);
});

test('Eleventy copies the public design system assets', () => {
  const config = read('eleventy.config.js');
  for (const name of ['theme.css','typography.css','components.css','icons.css','theme.js','components.js','icons.svg']) {
    assert.ok(config.includes(name), name);
  }
  assert.match(config, /node_modules\/\@nicolabz\/design-system/);
});

test('shared components are wired into the app without changing interaction ids', () => {
  const html = read('index.html');
  const layout = read('_includes/layout.njk');
  assert.match(html, /class="nz-button nz-button-primary/);
  assert.match(html, /nz-form-panel/);
  assert.match(html, /class="nz-dialog sync-dialog"/);
  assert.match(html, /nz-toast-region-bottom/);
  assert.match(html, /id="theme-toggle"/);
  assert.doesNotMatch(html, /class="button\b/);
  assert.match(layout, /design-system\/theme\.js/);
  assert.match(layout, /design-system\/components\.js/);
  assert.match(layout, /class="nz-base"/);
  assert.match(read('src/scripts/app.js'), /nicolabzComponents\.showToast/);
  assert.match(read('src/scripts/ui/theme-toggle.js'), /nicolabzTheme/);
});
