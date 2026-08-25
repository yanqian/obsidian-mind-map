import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));

if (packageJson.version !== manifest.version) {
  throw new Error(`Version mismatch: package ${packageJson.version}, manifest ${manifest.version}`);
}
if (!manifest.minAppVersion) throw new Error('manifest.json must declare minAppVersion');

const releaseName = `${manifest.id}-${manifest.version}`;
const outputDir = join(root, 'dist', releaseName);
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const requiredFiles = ['manifest.json', 'main.js'];
const optionalFiles = ['styles.css'];
const copiedFiles = [];

for (const file of requiredFiles) {
  await access(join(root, file));
  await copyFile(join(root, file), join(outputDir, file));
  copiedFiles.push(file);
}
for (const file of optionalFiles) {
  try {
    await access(join(root, file));
    await copyFile(join(root, file), join(outputDir, file));
    copiedFiles.push(file);
  } catch {
    // This plugin currently has no standalone runtime stylesheet.
  }
}

const checksumLines = [];
for (const file of copiedFiles) {
  const bytes = await readFile(join(outputDir, file));
  checksumLines.push(`${createHash('sha256').update(bytes).digest('hex')}  ${file}`);
}
await writeFile(join(outputDir, 'SHA256SUMS'), `${checksumLines.join('\n')}\n`);

console.log(`Local release ready: ${outputDir}`);
console.log(`Runtime files: ${copiedFiles.join(', ')}`);
