// Builds the bookmarklet URL from bookmarklet.js and writes install.html.
// Usage: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const dir = new URL('.', import.meta.url);
const src = readFileSync(new URL('bookmarklet.js', dir), 'utf8');

const code = src
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

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Copy as Markdown</title>
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
  button { font:inherit; font-size:14px; padding:6px 14px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; margin-top:8px; }
  .demo table { border-collapse: collapse; } .demo td, .demo th { border:1px solid var(--line); padding:4px 10px; }
  .demo blockquote { margin:0; padding-left:14px; border-left:3px solid var(--line); color:var(--muted); }
  .demo pre { background:var(--code); padding:12px; border-radius:8px; overflow:auto; }
  .muted { color: var(--muted); font-size: 14px; }
</style>
</head>
<body>
<main>
  <h1>Copy as Markdown</h1>
  <p class="lead">Select text on any page, click the bookmark, and the selection lands on your clipboard as Markdown.</p>

  <p><a class="drag" href="${esc(url)}" onclick="alert('Drag this button to your bookmarks bar instead of clicking it.'); return false;">⇣ Copy as Markdown</a></p>

  <h2>Install</h2>
  <div class="card">
    <ol>
      <li>Show your bookmarks bar (<code>⌘⇧B</code> on Mac, <code>Ctrl+Shift+B</code> on Windows).</li>
      <li>Drag the blue <b>Copy as Markdown</b> button above onto the bookmarks bar.</li>
    </ol>
    <p class="muted">Drag not working (e.g. Safari)? Bookmark any page, edit that bookmark, and replace its URL with this:</p>
    <textarea id="code" readonly>${esc(url)}</textarea>
    <button id="copybtn">Copy bookmarklet code</button>
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
</main>
<script>
  document.getElementById('copybtn').addEventListener('click', function () {
    var ta = document.getElementById('code');
    ta.select();
    var done = function () { this.textContent = 'Copied!'; }.bind(this);
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });
</script>
</body>
</html>
`;
writeFileSync(new URL('install.html', dir), html);
console.log('bookmarklet: ' + url.length + ' chars -> bookmarklet.url.txt, install.html');
