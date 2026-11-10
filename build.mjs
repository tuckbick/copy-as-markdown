// Builds the bookmarklet URL from bookmarklet.js and writes index.html (the install page, served by GitHub Pages).
// Usage: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const src = readFileSync(new URL('bookmarklet.js', dir), 'utf8');

// The version lives in package.json; it's stamped into the bookmarklet's notice
// comment (so an installed bookmark shows its version in its URL) and the install page.
const { version } = JSON.parse(readFileSync(new URL('package.json', dir), 'utf8'));
const upstream = JSON.parse(readFileSync(new URL('upstream.json', dir), 'utf8'));
const turndownVersion = upstream.turndown.version;

const code = src
  .replace(/__VERSION__/g, version)
  .split('\n')
  .filter((l) => !l.includes('@test-only'))
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('//'))
  .join('\n');

// Only escape what would break the URL: % (escapes), # (fragment) and line breaks.
// Full encodeURIComponent roughly doubles the length for no benefit.
const url = 'javascript:' + code.replace(/[%#\r\n\t]/g, encodeURIComponent);
const MAX = 32000;
if (url.length > MAX) {
  console.error(`bookmarklet is ${url.length} chars; keep it under ${MAX} so it works in every browser`);
  process.exit(1);
}
writeFileSync(new URL('bookmarklet.url.txt', dir), url + '\n');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ---------- search ----------
// Shown as the headline and snippet in search results.
const TITLE = 'Copy as Markdown: Bookmarklet to Copy Selected Text as Markdown';
const DESCRIPTION = 'Free bookmarklet: select text on any web page, click it, and get clean Markdown on your clipboard. Keeps headings, links, lists, tables and code. No extension needed.';

// ---------- icon ----------
// Browsers don't keep a favicon for javascript: bookmarks, so the bookmarklet's
// "icon" is the emoji at the start of its name. icons/clipboard.svg (the Twemoji 📋,
// CC-BY 4.0, see THIRD_PARTY_NOTICES.md) is the install page's own favicon.
const NAME = 'Copy as Markdown';
const EMOJI = '📋';

// Name choices on the install page. The dragged bookmark takes the button's
// label as its name, so people can pick whatever they'll recognize. The first
// entry in each list is the default.
const EMOJIS = ['📋', '📝', '✂️', '⬇️', '🔽', ''];
const NAMES = [NAME, 'MD', 'Markdown', 'Copy as MD', 'Copy MD', 'Selection → MD', 'Markdownify', ''];
const svgIcon = readFileSync(new URL('icons/clipboard.svg', dir));
const svgDataUri = 'data:image/svg+xml;base64,' + svgIcon.toString('base64');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESCRIPTION)}">
<link rel="icon" type="image/svg+xml" href="${svgDataUri}">
<style>
  :root { --bg:#f6f7f9; --card:#fff; --fg:#1f2328; --muted:#59636e; --line:#d1d9e0; --accent:#0969da; --code:#eff2f5; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --card:#161b22; --fg:#e6edf3; --muted:#9198a1; --line:#30363d; --accent:#4493f8; --code:#1f242c; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 40px 16px 80px; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 36px 0 8px; }
  p.lead { color: var(--muted); margin: 0 0 28px; }
  .drag { display:inline-flex; align-items:center; gap:8px; padding:12px 20px; border-radius:10px; background:var(--accent); color:#fff; font-weight:600; text-decoration:none; cursor:grab; box-shadow:0 2px 8px rgba(0,0,0,.15); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; }
  ol { padding-left: 22px; } li { margin: 4px 0; }
  code { background:var(--code); padding:1px 5px; border-radius:4px; font-size:.9em; }
  textarea { width:100%; height:110px; font:12px/1.4 ui-monospace,Menlo,monospace; background:var(--code); color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:10px; resize:vertical; }
  details summary { cursor:pointer; margin-top:8px; }
  details[open] summary { margin-bottom:4px; }
  button { font:inherit; font-size:14px; padding:6px 14px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; margin-top:8px; }
  .demo table { border-collapse: collapse; } .demo td, .demo th { border:1px solid var(--line); padding:4px 10px; }
  .demo blockquote { margin:0 0 16px; padding-left:14px; border-left:3px solid var(--line); color:var(--muted); }
  .demo pre { background:var(--code); padding:12px; border-radius:8px; overflow:auto; }
  .muted { color: var(--muted); font-size: 14px; }
  .version { font-size: 14px; font-weight: 500; color: var(--muted); vertical-align: middle; margin-left: 4px; }
  .picker { padding:14px 16px; display:grid; grid-template-columns:auto 1fr; gap:10px 14px; align-items:start; }
  .h2-note { font-size:13px; font-weight:500; color:var(--muted); margin-left:6px; }
  .picker-note { grid-column:1 / -1; margin:2px 0 0; font-size:13px; }
  .chip:disabled { opacity:.4; cursor:not-allowed; }
  .picker-label { font-size:13px; color:var(--muted); margin:0; padding-top:4px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { font:inherit; font-size:14px; margin:0; padding:3px 10px; border-radius:999px; border:1px solid var(--line); background:transparent; color:var(--fg); cursor:pointer; min-width:36px; }
  .chip[aria-pressed="true"] { border-color:var(--accent); color:var(--accent); background:color-mix(in srgb, var(--accent) 12%, transparent); font-weight:600; }
  .chip:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .custom { font:inherit; font-size:14px; padding:3px 10px; border-radius:999px; border:1px solid var(--line); background:transparent; color:var(--fg); width:160px; max-width:100%; }
  .custom:focus { outline:2px solid var(--accent); outline-offset:1px; }
  .drag-zone { margin:12px 0 6px; }
  .drag-zone .drag { font-size:18px; padding:16px 28px; border-radius:12px; min-height:58px; }
  @media (max-width: 480px) { .picker { grid-template-columns:1fr; } .picker-label { padding-top:0; } }
</style>
</head>
<body>
<main>
  <h1>Copy as Markdown <span class="version">v${version}</span></h1>
  <p class="lead">Select text on any page, click the bookmark, and the selection lands on your clipboard as Markdown.</p>

  <h2 id="configure">Configure <span class="h2-note">optional</span></h2>
  <section class="card picker" aria-labelledby="configure">
    <p class="picker-label" id="emoji-label">Icon</p>
    <div class="chips" id="emojis" role="group" aria-labelledby="emoji-label"></div>
    <p class="picker-label" id="name-label">Name</p>
    <div class="chips" id="names" role="group" aria-labelledby="name-label"></div>
    <p class="picker-note muted">This becomes the bookmark's name. Browsers don't show icons for bookmarklets, so the emoji is how you'll spot it; shorter names won't get cut off in the bar.</p>
  </section>

  <h2>Install</h2>
  <div class="card">
    <ol>
      <li>Show your bookmarks bar (<code>⌘⇧B</code> on Mac, <code>Ctrl+Shift+B</code> on Windows).</li>
      <li>Drag this button onto the bookmarks bar:
        <div class="drag-zone">
          <a class="drag" id="drag" href="${esc(url)}" onclick="alert('Drag this button to your bookmarks bar instead of clicking it.'); return false;">${EMOJI} ${NAME}</a>
        </div>
      </li>
    </ol>
    <details id="code-details">
      <summary class="muted">Drag not working (e.g. Safari)? Add it by hand</summary>
      <p class="muted">Bookmark any page, edit that bookmark, name it <b class="current-name">${EMOJI} ${NAME}</b>, and replace its URL with this:</p>
      <textarea id="code" readonly aria-label="Bookmarklet code"></textarea>
      <button id="copybtn">Copy bookmarklet code</button>
    </details>
  </div>

  <h2>Try it here</h2>
  <p class="muted">Once installed, select some of the sample below and click the bookmark.</p>
  <div class="card demo">
    <h3>Sample section</h3>
    <p>Some <strong>bold</strong>, <em>italic</em>, <code>inline code</code>, and a <a href="https://github.com/euangoddard/clipboard2markdown">link</a>.</p>
    <ul>
      <li>First item</li>
      <li>Second item
        <ul><li>Nested item</li></ul>
      </li>
    </ul>
    <blockquote>A quoted line.</blockquote>
    <table>
      <tr><th>Name</th><th>Value</th></tr>
      <tr><td>alpha</td><td>1</td></tr>
      <tr><td>beta</td><td>2</td></tr>
    </table>
    <pre><code class="language-js">const x = 1;
console.log(x);</code></pre>
  </div>

  <footer class="muted" style="margin-top:40px">
    <p>Version ${version}, converter based on Turndown ${turndownVersion}. <a href="https://github.com/tuckbick/copy-as-markdown/blob/main/CHANGELOG.md">Changelog</a> · <a href="https://github.com/tuckbick/copy-as-markdown/releases">Releases</a>. To check which version you have installed, edit the bookmark: its URL starts with <code>javascript:(function () {/* Copy as Markdown v…</code>.</p>
    <p>MIT licensed. The converter is adapted from <a href="https://github.com/mixmark-io/turndown">Turndown</a> and <a href="https://github.com/mixmark-io/turndown-plugin-gfm">turndown-plugin-gfm</a> (MIT). Icon: <a href="https://github.com/jdecked/twemoji">Twemoji</a> 📋, licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC-BY 4.0</a>. <a href="https://github.com/tuckbick/copy-as-markdown/blob/main/THIRD_PARTY_NOTICES.md">Full notices</a>.</p>
  </footer>
</main>
<script>
  (function () {
    var EMOJIS = ${JSON.stringify(EMOJIS)};
    var NAMES = ${JSON.stringify(NAMES)};
    var KEY = 'copy-as-markdown:name';
    var state = { emoji: EMOJIS[0], name: NAMES[0] };
    // A label needs an emoji or a name (or both): "None" is disabled in one row
    // while the other row is on "None".
    function valid (s) {
      return s && typeof s.emoji === 'string' && typeof s.name === 'string' && (s.emoji || s.name.trim());
    }
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (valid(saved)) state = saved;
    } catch (e) {}

    var drag = document.getElementById('drag');
    var custom;

    function label() { return [state.emoji, state.name.trim()].filter(Boolean).join(' '); }

    function render() {
      drag.textContent = label();
      document.querySelectorAll('.current-name').forEach(function (el) { el.textContent = label(); });
      document.querySelectorAll('#emojis .chip').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.value === state.emoji));
        b.disabled = !b.dataset.value && !state.name.trim();
      });
      var preset = NAMES.indexOf(state.name) >= 0;
      document.querySelectorAll('#names .chip').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.value === state.name));
        b.disabled = !b.dataset.value && !state.emoji;
      });
      if (custom && !preset && document.activeElement !== custom) custom.value = state.name;
      if (custom && preset && document.activeElement !== custom) custom.value = '';
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }

    function chip(parent, value, text, key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.value = value;
      b.textContent = text;
      b.addEventListener('click', function () { state[key] = value; render(); });
      parent.appendChild(b);
    }

    var emojiBox = document.getElementById('emojis');
    EMOJIS.forEach(function (e) { chip(emojiBox, e, e || 'None', 'emoji'); });
    var nameBox = document.getElementById('names');
    NAMES.forEach(function (n) { chip(nameBox, n, n || 'None', 'name'); });

    custom = document.createElement('input');
    custom.className = 'custom';
    custom.placeholder = 'Or type your own';
    custom.setAttribute('aria-label', 'Custom name');
    custom.maxLength = 40;
    custom.addEventListener('input', function () {
      state.name = custom.value.trim() ? custom.value : NAMES[0];
      render();
    });
    nameBox.appendChild(custom);
    render();
  })();

  // The code box is filled from the drag button's link when opened, so the
  // ~22 KB bookmarklet isn't in the page twice (it would drown out the page's
  // text for search engines).
  function fillCode () {
    var ta = document.getElementById('code');
    if (!ta.value) ta.value = document.getElementById('drag').getAttribute('href');
    return ta;
  }
  document.getElementById('code-details').addEventListener('toggle', function () { if (this.open) fillCode(); });

  document.getElementById('copybtn').addEventListener('click', function () {
    var ta = fillCode();
    ta.select();
    var done = function () { this.textContent = 'Copied!'; }.bind(this);
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });
</script>
</body>
</html>
`;
writeFileSync(new URL('index.html', dir), html);
console.log(`v${version}: bookmarklet ${url.length} chars -> bookmarklet.url.txt, index.html`);
