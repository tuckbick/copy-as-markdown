// Tests for the build: the minified bookmarklet must behave like the source, and the
// templates must fail loudly on a typo.
//
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { minifyBookmarklet } from '../scripts/minify.mjs';
import { fill } from '../scripts/fill.mjs';

const SRC = readFileSync(new URL('../bookmarklet.js', import.meta.url), 'utf8');
const MINIFIED = await minifyBookmarklet(SRC, { version: '0.0.0', keepTestHooks: true });
const PRODUCTION = await minifyBookmarklet(SRC, { version: '0.0.0' });

// Select the whole fixture and run the converter from the given code.
function convert (code, html) {
  const dom = new JSDOM(`<!doctype html><body><div id="root">${html}</div></body>`, {
    url: 'https://example.com/docs/page.html',
    runScripts: 'outside-only'
  });
  dom.window.__MD_TEST__ = true;
  dom.window.eval(code);
  const { document } = dom.window;
  const range = document.createRange();
  range.selectNodeContents(document.getElementById('root'));
  const sel = dom.window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return dom.window.__selectionToMarkdown();
}

const FIXTURES = {
  heading: '<h2>Title</h2><p>Some <strong>bold</strong> and <em>italic</em> text.</p>',
  'nested list': '<ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol start="3"><li>Three</li></ol>',
  table: '<table><tr><th>Name</th><th>Value</th></tr><tr><td>alpha</td><td>1</td></tr></table>',
  'code block': '<pre><code class="language-js">const x = 1;\nconsole.log(x);</code></pre><p><code>inline</code></p>',
  link: '<p><a href="../other.html">relative</a> and <img src="/a.png" alt="pic"></p><blockquote>Quote</blockquote>'
};

for (const [name, html] of Object.entries(FIXTURES)) {
  test(`minified bookmarklet converts like the source: ${name}`, () => {
    assert.equal(convert(MINIFIED, html), convert(SRC, html));
  });
}

test('minified bookmarklet is a plain IIFE with the version notice and no test hooks', () => {
  assert.ok(PRODUCTION.startsWith('(function(){/* Copy as Markdown v0.0.0 '));
  assert.ok(PRODUCTION.endsWith('})();'));
  assert.ok(!PRODUCTION.includes('\n'));
  assert.ok(!PRODUCTION.includes('__MD_TEST__'));
  // Running it returns undefined, so a javascript: URL won't replace the page.
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only' });
  assert.equal(dom.window.eval(PRODUCTION), undefined);
});

test('fill replaces placeholders and rejects missing or unused values', () => {
  assert.equal(fill('a {{x}} b {{x}}', { x: 1 }), 'a 1 b 1');
  assert.throws(() => fill('{{x}} {{y}}', { x: 1 }), /no value for \{\{y\}\}/);
  assert.throws(() => fill('{{x}}', { x: 1, z: 2 }), /unused template values: z/);
});
