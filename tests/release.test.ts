import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('release metadata is version-aligned and declares current Obsidian compatibility', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  const versions = JSON.parse(readFileSync(new URL('../versions.json', import.meta.url), 'utf8'));

  assert.equal(pkg.version, manifest.version);
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.match(manifest.minAppVersion, /^1\./);
  assert.equal(pkg.scripts['release:local'], 'npm run verify && node scripts/package-release.mjs');
});

test('release packager requires both runtime files and includes checksums', () => {
  const source = readFileSync(new URL('../scripts/package-release.mjs', import.meta.url), 'utf8');
  assert.match(source, /\['manifest\.json', 'main\.js'\]/);
  assert.match(source, /SHA256SUMS/);
  assert.match(source, /Version mismatch/);
});
