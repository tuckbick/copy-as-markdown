// Accessibility checks for the install page (index.html), run in the browser.
// See docs/accessibility.md for what this covers and how to use it.
//
// Usage: serve the repo (e.g. `python3 -m http.server 8767`), open the page,
// paste this file into the browser's developer console, and read the result.
// Run it once in light mode and once in dark mode (switch the OS appearance, or
// use the devtools "Emulate CSS prefers-color-scheme" setting).
(function () {
  function parse (c) {
    const m = c.match(/[\d.]+/g).map(Number);
    return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
  }
  // WCAG 2.x relative luminance and contrast ratio.
  function lum ({ r, g, b }) {
    return [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function blend (top, bottom) {
    const a = top.a;
    return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 };
  }
  // Effective background: blend every translucent background up to the first opaque one.
  function bgOf (el) {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.a > 0) layers.push(c);
      if (c.a === 1) break;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return bg;
  }
  function ratio (fg, bg) {
    const a = lum(fg), b = lum(bg);
    return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
  }

  // 1. Text contrast (WCAG 1.4.3): every visible text node.
  const text = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (!t.data.trim()) continue;
    const el = t.parentElement;
    if (!el.offsetParent) continue;
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    const r = ratio(blend(parse(cs.color), bg), bg);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    const key = el.tagName + '|' + cs.color + '|' + cs.backgroundColor + '|' + size;
    if (seen.has(key)) continue;
    seen.add(key);
    text.push({ sample: t.data.trim().slice(0, 30), ratio: r, need: need, pass: r >= need });
  }

  // 2. Non-text contrast (WCAG 1.4.11): outlines that identify controls, 3:1.
  function border (sel) {
    const e = document.querySelector(sel);
    if (!e) return null;
    const r = ratio(parse(getComputedStyle(e).borderTopColor), bgOf(e.parentElement));
    return { control: sel, ratio: r, pass: r >= 3 };
  }
  const outlines = ['.chip[aria-pressed="false"]', '.custom', '#copybtn'].map(border).filter(Boolean);

  // 3. Structure.
  const structure = {
    lang: document.documentElement.lang || '(missing)',
    zoomAllowed: !/user-scalable=no|maximum-scale=1(\D|$)/.test((document.querySelector('meta[name=viewport]') || {}).content || ''),
    mainLandmarks: document.querySelectorAll('main').length,
    footerOutsideMain: !!document.querySelector('body > footer') && !document.querySelector('main footer'),
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(function (h) { return h.tagName + ' ' + h.textContent.trim(); }),
    imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
    unlabeledFields: [...document.querySelectorAll('input, textarea, select')].filter(function (f) {
      return !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby') && !(f.id && document.querySelector('label[for="' + f.id + '"]'));
    }).length,
    unnamedButtons: [...document.querySelectorAll('button')].filter(function (b) { return !b.textContent.trim() && !b.getAttribute('aria-label'); }).length
  };

  // 4. Reflow (WCAG 1.4.10): run at a 320px-wide window; nothing should scroll sideways.
  const reflow = { viewport: innerWidth, horizontalScroll: document.documentElement.scrollWidth > innerWidth };

  const result = {
    scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    textFailures: text.filter(function (x) { return !x.pass; }),
    lowestTextContrast: text.slice().sort(function (a, b) { return a.ratio - b.ratio; }).slice(0, 5),
    outlines: outlines,
    structure: structure,
    reflow: reflow
  };
  console.log(result);
  return result;
})();
