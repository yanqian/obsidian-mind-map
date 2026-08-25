import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { INode } from 'markmap-common';
import {
  rewriteInternalLinks,
  stripFrontMatter,
  transformMindMapMarkdown,
} from '../src/markdown-transform';

function values(node: INode): string[] {
  return [node.v, ...(node.c ?? []).flatMap(values)];
}

test('strips complete front matter without removing the first body character', () => {
  const markdown = '---\ntitle: Private metadata\ntags: [mind-map]\n---\n# Project';
  assert.equal(stripFrontMatter(markdown), '# Project');
});

test('transforms representative headings, lists, and an internal wiki link', () => {
  const markdown = [
    '---',
    'title: Project',
    '---',
    '# Project',
    '## Planning',
    '- [[Roadmap]]',
    '  - First milestone',
  ].join('\n');

  const { root } = transformMindMapMarkdown(markdown);
  const renderedValues = values(root).join('\n');
  assert.doesNotMatch(renderedValues, /title: Project/);
  assert.match(renderedValues, /Project/);
  assert.match(renderedValues, /Planning/);
  assert.match(renderedValues, /Roadmap/);

  rewriteInternalLinks(root, 'Test Vault', (link) => link);
  assert.match(values(root).join('\n'), /obsidian:\/\/open\?vault=Test%20Vault&file=Roadmap/);
});

test('rewrites multiple local links repeatedly without changing external links', () => {
  const node = {
    v: '[[Folder/One|First]] <a href="Second%20Note.md">Second</a> <a href="https://example.com/x">Web</a>',
    c: [],
  } as INode;

  rewriteInternalLinks(node, 'Test Vault', (link) => link);
  const once = node.v;
  rewriteInternalLinks(node, 'Test Vault', (link) => link);

  assert.equal(node.v, once);
  assert.match(node.v, /file=Folder%2FOne/);
  assert.match(node.v, /file=Second%20Note\.md/);
  assert.match(node.v, /href="https:\/\/example\.com\/x"/);
  assert.match(node.v, />First<\/a>.*>Second<\/a>.*>Web<\/a>/);
});

test('opens the registered view through current view state APIs', () => {
  const source = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  assert.match(source, /checkCallback:/);
  assert.match(source, /leaf\.setViewState\(\{/);
  assert.match(source, /state: \{ file: file\.path \}/);
  assert.doesNotMatch(source, /new MindmapView\(this\.settings, preview/);
  assert.doesNotMatch(source, /preview\.open\(/);
});

test('uses event-driven following and serializable view state', () => {
  const source = readFileSync(new URL('../src/mindmap-view.ts', import.meta.url), 'utf8');
  assert.match(source, /workspace\.on\('file-open'/);
  assert.match(source, /vault\.on\('modify'/);
  assert.match(source, /getState\(\): Record<string, unknown>/);
  assert.match(source, /pinned: this\.isLeafPinned/);
  assert.match(source, /for \(const cleanup of this\.eventCleanups\)/);
  assert.doesNotMatch(source, /setInterval\(/);
  assert.doesNotMatch(source, /registerInterval\(/);
});

test('screenshot export handles capability and conversion failures', () => {
  const source = readFileSync(new URL('../src/copy-image.ts', import.meta.url), 'utf8');
  assert.match(source, /if \(!svg\)/);
  assert.match(source, /typeof ClipboardItem === 'undefined'/);
  assert.match(source, /image\.onerror/);
  assert.match(source, /await navigator\.clipboard\.write/);
  assert.match(source, /catch \(error\)/);
  assert.match(source, /new Notice\(`Unable to copy screenshot:/);
  assert.doesNotMatch(source, /btoa\(/);
});
