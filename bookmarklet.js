// Copy as Markdown — bookmarklet source.
// Select text on any page, click the bookmarklet, and the selection is
// converted to Markdown and put on your clipboard.
// Self-contained (no external scripts) so it works on sites with strict CSP.
// Build with: node build.mjs
// Rules for this file: only full-line // comments, and end statements with semicolons.
(function () {
  'use strict';

  var BRK = '\uE000';
  var BLOCK = /^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|BODY|CAPTION|DD|DETAILS|DIALOG|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|SUMMARY|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|IFRAME|OBJECT|EMBED|SVG|CANVAS|VIDEO|AUDIO|BUTTON|SELECT|TEXTAREA|HEAD|META|LINK|DIALOG)$/;

  function tag(n) { return (n.nodeName || '').toUpperCase(); }

  // ---------- whitespace normalisation (like a browser renders it) ----------
  function collapse(root) {
    var prev = null, atStart = true;
    function boundary() {
      if (prev) prev.data = prev.data.replace(/ +$/, '');
      prev = null;
      atStart = true;
    }
    (function walk(node) {
      for (var c = node.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          var t = c.data.replace(/[ \t\r\n\f]+/g, ' ');
          if (atStart || (prev && / $/.test(prev.data))) t = t.replace(/^ /, '');
          c.data = t;
          if (t) { prev = c; atStart = false; }
        } else if (c.nodeType === 1) {
          var n = tag(c);
          if (SKIP.test(n)) continue;
          if (n === 'PRE') { boundary(); continue; }
          if (n === 'BR' || BLOCK.test(n)) { boundary(); walk(c); boundary(); } else walk(c);
        }
      }
    })(root);
    boundary();
  }

  // ---------- helpers ----------
  function nl(s) { return (s.match(/\n/g) || []).length; }

  function join(a, b) {
    var ta = /[ \t\n]*$/.exec(a)[0], lb = /^[ \t\n]*/.exec(b)[0];
    var n = Math.min(2, Math.max(nl(ta), nl(lb)));
    if (!n) return a + b;
    return a.slice(0, a.length - ta.length) + '\n\n'.slice(0, n) + b.slice(lb.length);
  }

  function esc(s, lineStart) {
    s = s.replace(/[\\`*]/g, '\\$&').replace(/_/g, function (m, i, str) {
      return /\w/.test(str.charAt(i - 1)) && /\w/.test(str.charAt(i + 1)) ? m : '\\_';
    }).replace(/\]\(/g, '\\](');
    if (lineStart) s = s.replace(/^(#{1,6} |>|[-+] |=+$)/, '\\$1').replace(/^(\d+)\. /, '$1\\. ');
    return s;
  }

  function flat(s) { return s.replace(new RegExp('\\s*(\\n|' + BRK + ')\\s*', 'g'), ' ').trim(); }

  function wrap(s, d) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[2] ? m[1] + d + m[2] + d + m[3] : s;
  }

  function fenceFor(text, min) {
    var runs = text.match(/`+/g) || [], max = 0;
    for (var i = 0; i < runs.length; i++) max = Math.max(max, runs[i].length);
    return new Array(Math.max(min, max + 1) + 1).join('`');
  }

  function preText(n) {
    var out = '';
    for (var c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) out += c.data;
      else if (c.nodeType === 1) {
        var t = tag(c);
        if (t === 'BR') out += '\n';
        else if (/^(DIV|P|LI|TR)$/.test(t)) { out += preText(c); if (!/\n$/.test(out)) out += '\n'; }
        else out += preText(c);
      }
    }
    return out;
  }

  function indent(s, pad) { return s.replace(new RegExp('(\\n|' + BRK + ')(?=[^\\n])', 'g'), '$1' + pad); }

  function cleanUrl(u) { return u.replace(/[()\s<>]/g, function (c) { return encodeURIComponent(c); }); }

  // ---------- converter ----------
  function kids(node, ctx) {
    var out = '';
    for (var c = node.firstChild; c; c = c.nextSibling) out = join(out, conv(c, ctx, out));
    return out;
  }

  function list(n, ctx) {
    var ordered = tag(n) === 'OL';
    var num = ordered ? (parseInt(n.getAttribute('start'), 10) || 1) : 0;
    var sub = { inList: true };
    var items = [], lastPad = '  ';
    for (var c = n.firstChild; c; c = c.nextSibling) {
      var t = c.nodeType === 1 ? tag(c) : '';
      if (t === 'LI') {
        var marker = ordered ? (num++) + '. ' : '- ';
        lastPad = new Array(marker.length + 1).join(' ');
        var body = kids(c, sub).replace(/^\s+|\s+$/g, '');
        items.push(marker + indent(body, lastPad));
      } else if (t === 'UL' || t === 'OL') {
        var nested = conv(c, sub, '').replace(/^\s+|\s+$/g, '');
        if (!nested) continue;
        if (items.length) items[items.length - 1] += '\n' + lastPad + indent(nested, lastPad);
        else items.push(nested);
      } else {
        var other = conv(c, sub, '').replace(/^\s+|\s+$/g, '');
        if (other) items.push(other);
      }
    }
    var s = items.join('\n');
    return ctx.inList ? '\n' + s + '\n' : '\n\n' + s + '\n\n';
  }

  function table(n, ctx) {
    if (n.querySelector('table')) return '\n\n' + kids(n, ctx) + '\n\n';
    var rows = [], width = 0;
    var trs = n.rows || n.querySelectorAll('tr');
    for (var r = 0; r < trs.length; r++) {
      var cells = [], tc = trs[r].cells;
      for (var i = 0; i < tc.length; i++) {
        var txt = flat(kids(tc[i], { inTable: true })).replace(/\|/g, '\\|');
        cells.push(txt);
        for (var span = (parseInt(tc[i].getAttribute('colspan'), 10) || 1) - 1; span > 0; span--) cells.push('');
      }
      width = Math.max(width, cells.length);
      rows.push(cells);
    }
    if (!rows.length || !width) return '\n\n' + kids(n, ctx) + '\n\n';
    var out = [];
    for (var j = 0; j < rows.length; j++) {
      while (rows[j].length < width) rows[j].push('');
      out.push('| ' + rows[j].join(' | ') + ' |');
      if (j === 0) out.push('|' + new Array(width + 1).join(' --- |'));
    }
    var cap = n.querySelector('caption');
    return '\n\n' + (cap ? flat(kids(cap, ctx)) + '\n\n' : '') + out.join('\n') + '\n\n';
  }

  function conv(n, ctx, before) {
    if (n.nodeType === 3) return ctx.code ? n.data : esc(n.data, !before || /\n$/.test(before));
    if (n.nodeType === 11) return kids(n, ctx);
    if (n.nodeType !== 1) return '';
    var t = tag(n);
    if (SKIP.test(t) || n.hidden || n.getAttribute('aria-hidden') === 'true') return '';
    var c, m;
    switch (t) {
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
        c = flat(kids(n, ctx));
        if (ctx.inTable) return c;
        return c ? '\n\n' + new Array(+t.charAt(1) + 1).join('#') + ' ' + c + '\n\n' : '';
      case 'BR':
        return BRK;
      case 'HR':
        return '\n\n---\n\n';
      case 'STRONG': case 'B':
        c = kids(n, ctx);
        if (/^(normal|[1-4]00)$/.test(n.style.fontWeight)) return c;
        return wrap(c, '**');
      case 'EM': case 'I': case 'CITE': case 'DFN':
        return wrap(kids(n, ctx), '*');
      case 'DEL': case 'S': case 'STRIKE':
        return wrap(kids(n, ctx), '~~');
      case 'CODE': case 'KBD': case 'SAMP': case 'TT':
        c = n.textContent.replace(/\n/g, ' ');
        if (ctx.code || !c) return c;
        var tk = fenceFor(c, 1), sp = /^`|`$/.test(c) ? ' ' : '';
        return tk + sp + c + sp + tk;
      case 'PRE':
        var code = preText(n).replace(/\n$/, '');
        var inner = n.querySelector('code');
        m = /(?:^|\s)lang(?:uage)?-([\w+#.-]+)/.exec((n.className || '') + ' ' + (inner ? inner.className : ''));
        var f = fenceFor(code, 3);
        return '\n\n' + f + (m ? m[1] : '') + '\n' + code + '\n' + f + '\n\n';
      case 'A':
        c = kids(n, ctx);
        var href = n.getAttribute('href');
        if (!href || /^\s*javascript:/i.test(href) || !c.trim()) return c;
        var url = cleanUrl(n.href || href);
        if (/\n/.test(c)) c = esc(n.textContent.replace(/\s+/g, ' ').trim(), false);
        if (ctx.inTable) c = flat(c);
        var title = n.getAttribute('title');
        m = /^(\s*)([\s\S]*?)(\s*)$/.exec(c);
        return m[1] + '[' + m[2] + '](' + url + (title ? ' "' + title.replace(/"/g, '\\"') + '"' : '') + ')' + m[3];
      case 'IMG':
        var src = n.getAttribute('src') ? n.src : (n.getAttribute('data-src') || '');
        var alt = (n.getAttribute('alt') || '').replace(/\s+/g, ' ').replace(/[\[\]]/g, '\\$&');
        if (!src || /^data:/i.test(src)) return alt;
        return '![' + alt + '](' + cleanUrl(src) + ')';
      case 'INPUT':
        return n.type === 'checkbox' ? (n.checked ? '[x] ' : '[ ] ') : '';
      case 'UL': case 'OL':
        return list(n, ctx);
      case 'LI':
        return '\n- ' + indent(kids(n, ctx).replace(/^\s+|\s+$/g, ''), '  ') + '\n';
      case 'BLOCKQUOTE':
        c = kids(n, ctx).replace(/^\s+|\s+$/g, '');
        if (!c) return '';
        if (ctx.inTable) return c;
        c = '> ' + c.replace(new RegExp('(\\n|' + BRK + ')', 'g'), '$1> ').replace(/> \n/g, '>\n');
        return '\n\n' + c + '\n\n';
      case 'TABLE':
        return ctx.inTable ? kids(n, ctx) : table(n, ctx);
      case 'DT':
        c = flat(kids(n, ctx));
        return c ? '\n\n**' + c + '**\n\n' : '';
    }
    c = kids(n, ctx);
    return BLOCK.test(t) ? '\n\n' + c + '\n\n' : c;
  }

  function finish(s) {
    return s
      .replace(new RegExp(BRK + '(?=[ \\t]*(\\n|$))', 'g'), '')
      .replace(new RegExp(BRK, 'g'), '  \n')
      .replace(/[ \t]+$/gm, function (m) { return m === '  ' ? m : ''; })
      .replace(/^\n+|\s+$/g, '');
  }

  // ---------- selection -> markdown ----------
  var WRAP_INLINE = /^(A|B|STRONG|I|EM|S|DEL|STRIKE|CODE|KBD|SAMP|PRE)$/;

  function topTags(root) {
    var seen = {};
    for (var c = root.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) seen[tag(c)] = true;
    return seen;
  }

  function rangeToMarkdown(range) {
    var doc = range.startContainer.ownerDocument || document;
    var root = doc.createElement('div');
    root.appendChild(range.cloneContents());
    var el = range.commonAncestorContainer;
    if (el.nodeType !== 1) el = el.parentNode;
    // Re-create the context the selection lives in (lists, tables, links, code, bold…)
    for (; el && el.nodeType === 1 && el !== doc.body && el !== doc.documentElement; el = el.parentNode) {
      var t = tag(el), top = topTags(root);
      var need = WRAP_INLINE.test(t) ||
        ((t === 'UL' || t === 'OL') && top.LI) ||
        (/^(THEAD|TBODY|TFOOT)$/.test(t) && top.TR) ||
        (t === 'TR' && (top.TD || top.TH)) ||
        (t === 'TABLE' && (top.TR || top.TBODY || top.THEAD || top.TFOOT));
      if (need) {
        var w = el.cloneNode(false);
        while (root.firstChild) w.appendChild(root.firstChild);
        root.appendChild(w);
      }
    }
    collapse(root);
    return finish(kids(root, {}));
  }

  function selectionToMarkdown(win) {
    win = win || window;
    var doc = win.document, ae = doc.activeElement;
    if (ae && tag(ae) === 'IFRAME') {
      try { var inner = selectionToMarkdown(ae.contentWindow); if (inner) return inner; } catch (e) {}
    }
    if (ae && (tag(ae) === 'TEXTAREA' || tag(ae) === 'INPUT')) {
      try {
        if (ae.selectionEnd > ae.selectionStart) return ae.value.slice(ae.selectionStart, ae.selectionEnd);
      } catch (e) {}
    }
    var sel = win.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
    var parts = [];
    for (var i = 0; i < sel.rangeCount; i++) {
      var md = rangeToMarkdown(sel.getRangeAt(i));
      if (md) parts.push(md);
    }
    return parts.join('\n\n');
  }

  // ---------- UI ----------
  var FONT = 'font:500 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  function toast(msg, bad) {
    var d = document.createElement('div');
    d.textContent = msg;
    d.setAttribute('style', 'all:initial;position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:360px;padding:10px 14px;border-radius:8px;' + FONT + 'color:#fff;background:' + (bad ? '#b42318' : '#1f2328') + ';box-shadow:0 6px 20px rgba(0,0,0,.25);transition:opacity .3s;opacity:1');
    (document.body || document.documentElement).appendChild(d);
    setTimeout(function () { d.style.opacity = '0'; }, bad ? 3500 : 1800);
    setTimeout(function () { d.remove(); }, bad ? 4000 : 2300);
  }

  function manual(text) {
    var o = document.createElement('div');
    o.setAttribute('style', 'all:initial;position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center');
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('style', 'all:initial;box-sizing:border-box;width:min(760px,92vw);height:65vh;padding:14px;border-radius:10px;background:#fff;color:#1f2328;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;overflow:auto');
    o.appendChild(ta);
    function close() { o.remove(); }
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    (document.body || document.documentElement).appendChild(o);
    ta.focus();
    ta.select();
    toast('This page blocked clipboard access. The Markdown is selected: press Cmd/Ctrl+C, then Esc.', true);
  }

  function copy(text, done, fail) {
    var ok = false;
    function onCopy(e) {
      e.clipboardData.setData('text/plain', text);
      e.preventDefault();
      e.stopImmediatePropagation();
      ok = true;
    }
    window.addEventListener('copy', onCopy, true);
    try { document.execCommand('copy'); } catch (e) {}
    window.removeEventListener('copy', onCopy, true);
    if (ok) return done();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  }

  if (window.__MD_TEST__) { window.__selectionToMarkdown = selectionToMarkdown; return; } // @test-only

  var md;
  try { md = selectionToMarkdown(); } catch (e) { toast('Copy as Markdown failed: ' + e.message, true); return; }
  if (!md) { toast('Select some text first, then click the bookmarklet.', true); return; }
  copy(md, function () {
    var lines = md.split('\n').length;
    toast('Copied as Markdown (' + lines + ' line' + (lines === 1 ? '' : 's') + ')');
  }, function () { manual(md); });
})();
