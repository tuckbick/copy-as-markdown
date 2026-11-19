// Builds the bookmarklet URL from bookmarklet.js and writes index.html (the install page,
// served by GitHub Pages) and llms.txt (a Markdown summary of the page for AI agents).
// The page's sources are in site/: content.mjs (text and settings), index.html and
// llms.md (templates), style.css and page.js (inlined into the page).
// Usage: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fill } from './scripts/fill.mjs';
import { minifyBookmarklet, minifyScript } from './scripts/minify.mjs';
import * as site from './site/content.mjs';

const dir = new URL('.', import.meta.url);
const read = (path) => readFileSync(new URL(path, dir), 'utf8');

// The version lives in package.json; it's stamped into the bookmarklet's notice
// comment (so an installed bookmark shows its version in its URL) and the install page.
const { version } = JSON.parse(read('package.json'));
const upstream = JSON.parse(read('upstream.json'));
const turndownVersion = upstream.turndown.version;

// ---------- bookmarklet ----------
const code = await minifyBookmarklet(read('bookmarklet.js'), { version });

// Only escape what would break the URL: % (escapes), # (fragment) and line breaks.
// Full encodeURIComponent roughly doubles the length for no benefit.
const url = 'javascript:' + code.replace(/[%#\r\n\t]/g, encodeURIComponent);
const MAX = 32000;
if (url.length > MAX) {
  console.error(`bookmarklet is ${url.length} chars; keep it under ${MAX} so it works in every browser`);
  process.exit(1);
}
writeFileSync(new URL('bookmarklet.url.txt', dir), url + '\n');

// ---------- index.html ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// JSON inside a <script> element: escape < so the data can't close the element.
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const indent = (text, pad) => text.trimEnd().split('\n').map((l) => (l ? pad + l : l)).join('\n');
const label = `${site.EMOJI} ${site.NAME}`;

const html = fill(read('site/index.html'), {
  title: esc(site.TITLE),
  description: esc(site.DESCRIPTION),
  siteUrl: site.SITE_URL,
  shareImage: site.SHARE_IMAGE,
  repo: site.REPO,
  structuredData: scriptJson(site.structuredData(version)),
  style: indent(read('site/style.css'), '  '),
  version,
  turndownVersion,
  bookmarkletUrl: esc(url),
  label,
  convertsList: site.CONVERTS.map((c) => `      <li>${c}</li>`).join('\n'),
  config: scriptJson({ emojis: site.EMOJIS, names: site.NAMES }),
  script: await minifyScript(read('site/page.js')),
  // How an installed bookmark's URL starts, shown so people can find its version.
  urlStart: esc(url.slice(0, url.indexOf('Copy as Markdown v') + 'Copy as Markdown v'.length))
});
writeFileSync(new URL('index.html', dir), html);

// ---------- llms.txt ----------
// A plain Markdown summary for AI agents (llmstxt.org), served at the site root.
const llms = fill(read('site/llms.md'), {
  description: site.DESCRIPTION,
  version,
  turndownVersion,
  siteUrl: site.SITE_URL,
  label,
  convertsList: site.CONVERTS.map((c) => `- ${c}`).join('\n'),
  repo: site.REPO,
  raw: site.RAW
});
writeFileSync(new URL('llms.txt', dir), llms);
console.log(`v${version}: bookmarklet ${url.length} chars, index.html ${Buffer.byteLength(html)} bytes -> bookmarklet.url.txt, index.html, llms.txt`);
