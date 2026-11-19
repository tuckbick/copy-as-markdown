// Minifies the bookmarklet and the install page's script with Terser.
// The sources (bookmarklet.js, site/page.js) stay readable; only build output is minified.
import { minify } from 'terser';

const OPTIONS = {
  // No syntax newer than the sources use.
  ecma: 2017,
  compress: {
    passes: 2,
    // Keep `(function () {...})()`: Terser would otherwise write `!function(){...}()`,
    // which evaluates to `true`, and a javascript: URL that evaluates to a value
    // replaces the page with that value.
    negate_iife: false
  },
  mangle: true
};

// Returns the bookmarklet as one line of minified JavaScript (before URL escaping).
// keepTestHooks keeps the `@test-only` lines, for running the minified code in tests.
export async function minifyBookmarklet (src, { version, keepTestHooks = false }) {
  let code = src.replace(/__VERSION__/g, version);
  if (!keepTestHooks) code = code.split('\n').filter((l) => !l.includes('@test-only')).join('\n');
  const result = await minify(code, {
    ...OPTIONS,
    // Keep only the license and version notice, so an installed bookmark shows its
    // version in its URL.
    // quote_style 1: single quotes, like the source. The URL goes in index.html's
    // href="...", where every double quote would become a 6-character &quot;.
    format: { comments: /Copy as Markdown v/, quote_style: 1 }
  });
  // Terser puts the kept comment on its own line; join it back so the URL has no %0A.
  const out = result.code.replace(/\n?(\/\* Copy as Markdown v[^*]*\*\/)\n?/, '$1');
  if (!out.startsWith('(function(){') || !out.endsWith('})();')) {
    throw new Error('minified bookmarklet must be a plain (function(){...})(); so it evaluates to undefined');
  }
  return out;
}

export async function minifyScript (src) {
  const result = await minify(src, { ...OPTIONS, format: { comments: false } });
  return result.code;
}
