// Tests for the converter in bookmarklet.js.
//
// 1. Parity: for HTML that doesn't hit any "DIFF:" rule, the port must produce
//    exactly what the real Turndown (+ turndown-plugin-gfm) produces with the same
//    options. When Turndown releases a new version, bump the devDependency in
//    package.json and run `npm test`: any parity failure shows a behavior change
//    to port (see AGENTS.md, "Updating from Turndown").
// 2. Behavior: the intentional differences and the selection handling.
//
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const SRC = readFileSync(new URL('../bookmarklet.js', import.meta.url), 'utf8');

// Same options as the top of bookmarklet.js.
const OPTIONS = {
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
  br: '  '
};

function page (html) {
  const dom = new JSDOM(`<!doctype html><body><div id="root">${html}</div></body>`, {
    url: 'https://example.com/docs/page.html',
    runScripts: 'outside-only'
  });
  dom.window.__MD_TEST__ = true;
  dom.window.eval(SRC);
  return dom;
}

// Select the whole fixture (or a custom range) and run the bookmarklet's converter.
function port (html, select) {
  const dom = page(html);
  const { document } = dom.window;
  const sel = dom.window.getSelection();
  const range = document.createRange();
  if (select) select(range, document);
  else range.selectNodeContents(document.getElementById('root'));
  sel.removeAllRanges();
  sel.addRange(range);
  return dom.window.__selectionToMarkdown();
}

function turndown (html) {
  const dom = new JSDOM(`<!doctype html><body><div id="root">${html}</div></body>`, { url: 'https://example.com/docs/page.html' });
  const service = new TurndownService(OPTIONS);
  service.use(gfm);
  return service.turndown(dom.window.document.getElementById('root'));
}

// ---------- parity with Turndown ----------
const PARITY = {
  paragraphs: '<p>One</p><p>Two <strong>bold</strong> <em>em</em> <b>b</b> <i>i</i></p>',
  headings: '<h1>H1</h1><h2>H2</h2><h3>H3 <em>x</em></h3><h6>H6</h6>',
  escaping: '<p># not heading</p><p>1. not list</p><p>- not bullet</p><p>* star _under_ snake_case [link](x) `tick` \\back</p><p>&gt; quote</p><p>=== setext</p>',
  whitespace: '<p>  lots   of\n\n   space  <strong> padded </strong> end </p><div>a<span> b </span>c</div>',
  lineBreaks: '<p>line one<br>line two<br><br>after blank</p>',
  inlineCode: '<p>use <code>npm test</code> and <code>a`b</code> and <code>`edge`</code></p>',
  fencedCode: '<pre><code class="language-js">const a = 1;\nconsole.log(a);\n</code></pre><pre><code>```\nnested fence\n```</code></pre>',
  links: '<p><a href="https://example.com/a">abs</a> <a href="https://example.com/b" title="T &quot;q&quot;">titled</a></p>',
  images: '<p><img src="https://example.com/i.png" alt="alt [x]" title="t"> <img src="https://example.com/j.png"></p>',
  unorderedList: '<ul><li>One</li><li>Two<ul><li>Nested</li><li>Nested 2</li></ul></li><li>Three</li></ul>',
  orderedList: '<ol start="3"><li>three</li><li>four</li></ol><ol><li><p>para item</p></li><li>x</li></ol>',
  blockquote: '<blockquote><p>Quote one</p><p>Quote two</p><blockquote><p>inner</p></blockquote></blockquote>',
  hr: '<p>a</p><hr><p>b</p>',
  table: '<table><thead><tr><th>A</th><th align="right">B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
  tableTh: '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>',
  strike: '<p><del>gone</del> <s>struck</s></p>',
  taskList: '<ul><li><input type="checkbox" checked> done</li><li><input type="checkbox"> todo</li></ul>',
  highlighted: '<div class="highlight highlight-source-python"><pre>print("hi")</pre></div>',
  blank: '<p>a</p><div>   </div><p></p><p>b</p>',
  mixed: '<div><h2>Title</h2><p>Intro with <a href="https://example.com/">a link</a>.</p><ul><li><strong>Key</strong>: value</li></ul></div>'
};

for (const [name, html] of Object.entries(PARITY)) {
  test(`parity with Turndown: ${name}`, () => {
    assert.equal(port(html), turndown(html));
  });
}

// ---------- intentional differences (DIFF:) ----------
test('relative links and images become absolute', () => {
  assert.equal(
    port('<p><a href="other.html">rel</a> <img src="/img.png" alt="i"></p>'),
    '[rel](https://example.com/docs/other.html) ![i](https://example.com/img.png)'
  );
});

test('absolute URLs are percent-encoded by the browser (Turndown would write <url with spaces>)', () => {
  assert.equal(port('<a href="https://example.com/c d">space</a>'), '[space](https://example.com/c%20d)');
});

test('tables without a heading row use the first row as header', () => {
  assert.equal(
    port('<table><tr><td>a</td><td>b</td></tr><tr><td>1</td><td>2</td></tr></table>'),
    '| a | b |\n| --- | --- |\n| 1 | 2 |'
  );
});

test('table cells: pipes escaped, line breaks flattened', () => {
  assert.equal(
    port('<table><tr><th>A|B</th></tr><tr><td><p>one</p><p>two</p></td></tr></table>'),
    '| A\\|B |\n| --- |\n| one two |'
  );
});

test('hidden and non-content elements are dropped', () => {
  assert.equal(
    port('<p>keep<span hidden>hidden</span><span aria-hidden="true">aria</span></p><script>x()</script><style>p{}</style><button>btn</button><p hidden>gone</p>'),
    'keep'
  );
});

test('font-weight:normal <b> is not bold', () => {
  assert.equal(port('<b style="font-weight:normal">plain</b> <b>bold</b>'), 'plain **bold**');
});

test('javascript: and icon-only links lose the link', () => {
  assert.equal(port('<p><a href="javascript:void 0">js</a> <a href="https://x.com/"><svg></svg></a>end</p>'), 'js end');
});

test('data: images are dropped', () => {
  assert.equal(port('<p>a <img src="data:image/png;base64,AAAA" alt="x"> b</p>'), 'a  b');
});

test('<pre> without <code> is a fenced block', () => {
  assert.equal(port('<pre>raw\n  text</pre>'), '```\nraw\n  text\n```');
});

test('kbd is code', () => {
  assert.equal(port('<p>Press <kbd>Ctrl</kbd></p>'), 'Press `Ctrl`');
});

// ---------- selection handling ----------
test('partial selection inside bold keeps bold', () => {
  assert.equal(port('<p>x <strong>bold text here</strong> y</p>', (r, d) => {
    const t = d.querySelector('strong').firstChild;
    r.setStart(t, 5); r.setEnd(t, 9);
  }), '**text**');
});

test('partial selection across list items keeps the list', () => {
  assert.equal(port('<ul><li>alpha</li><li>beta</li><li>gamma</li></ul>', (r, d) => {
    const li = d.querySelectorAll('li');
    r.setStart(li[0].firstChild, 2); r.setEnd(li[1].firstChild, 4);
  }), '-   pha\n-   beta');
});

test('selecting table rows keeps a table', () => {
  assert.equal(port('<table><tr><th>A</th></tr><tr><td>1</td></tr><tr><td>2</td></tr></table>', (r, d) => {
    const tr = d.querySelectorAll('tr');
    r.setStartBefore(tr[1]); r.setEndAfter(tr[2]);
  }), '| 1 |\n| --- |\n| 2 |');
});

test('selection inside a code block is fenced', () => {
  assert.equal(port('<pre><code class="language-py">def f():\n    return 1</code></pre>', (r, d) => {
    const t = d.querySelector('code').firstChild;
    r.setStart(t, 4); r.setEnd(t, t.data.length);
  }), '```py\nf():\n    return 1\n```');
});

test('selection inside a link keeps the link', () => {
  assert.equal(port('<p><a href="https://example.com/x">link text</a></p>', (r, d) => {
    const t = d.querySelector('a').firstChild;
    r.setStart(t, 0); r.setEnd(t, 4);
  }), '[link](https://example.com/x)');
});

test('empty selection returns empty string', () => {
  assert.equal(port('<p>x</p>', (r, d) => { r.setStart(d.querySelector('p').firstChild, 0); }), '');
});
