import { INode } from 'markmap-common';
import { transform } from 'markmap-lib';
import { FRONT_MATTER_REGEX } from './constants';

const WIKI_LINK_REGEX = /\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g;
const HTML_LINK_REGEX = /<a\s+[^>]*?href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
const URI_SCHEME_REGEX = /^[a-z][a-z\d+.-]*:/i;

export function stripFrontMatter(markdown: string): string {
  return markdown.replace(FRONT_MATTER_REGEX, '');
}

export function transformMindMapMarkdown(markdown: string) {
  return transform(stripFrontMatter(markdown));
}

export function rewriteInternalLinks(
  node: INode,
  vaultName: string,
  resolveLinkPath: (link: string) => string,
): void {
  node.v = node.v.replace(WIKI_LINK_REGEX, (_match, target: string, alias?: string) => {
    const file = resolveLinkPath(target.trim());
    const label = alias?.trim() || target.trim();
    return `<a href="${buildObsidianOpenUrl(vaultName, file)}">${escapeHtml(label)}</a>`;
  });

  node.v = node.v.replace(
    HTML_LINK_REGEX,
    (match, _quote: string, href: string, label: string) => {
      if (!isLocalMarkdownTarget(href)) return match;
      return `<a href="${buildObsidianOpenUrl(vaultName, decodeLocalHref(href))}">${label}</a>`;
    },
  );

  node.c?.forEach((child) => rewriteInternalLinks(child, vaultName, resolveLinkPath));
}

function decodeLocalHref(href: string): string {
  try {
    return decodeURI(href);
  } catch {
    return href;
  }
}

export function buildObsidianOpenUrl(vaultName: string, file: string): string {
  return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file)}`;
}

function isLocalMarkdownTarget(href: string): boolean {
  const value = href.trim();
  return value.length > 0
    && !value.startsWith('#')
    && !value.startsWith('//')
    && !URI_SCHEME_REGEX.test(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
