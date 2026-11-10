// Copy as Markdown — bookmarklet source.
// Select text on any page, click the bookmarklet, and the selection is
// converted to Markdown and put on your clipboard.
// Self-contained (no external scripts) so it works on sites with strict CSP.
// Build with: node build.mjs
//
// The converter is a compact port of Turndown (https://github.com/mixmark-io/turndown)
// and turndown-plugin-gfm: same function names, rules, options and algorithms.
// Turndown's string parsing, reference links, keep() and the plugin system are left out.
// Every intentional difference from Turndown is marked "DIFF:".
// See THIRD_PARTY_NOTICES.md for the licenses.
//
// Rules for this file: only full-line // comments, and end statements with semicolons
// (the build joins trimmed lines without a real minifier).
(function () {
  /* Copy as Markdown v__VERSION__ (MIT, (c) 2026 Tucker Bickler). Converter adapted from Turndown (MIT, (c) 2017 Dom Christie), turndown-plugin-gfm (MIT, (c) 2017 Dom Christie) and collapse-whitespace (MIT, (c) 2014 Luc Thevenard). */
  'use strict';

  // ===================== options (Turndown option names) =====================
  // DIFF: headingStyle, hr, bulletListMarker and codeBlockStyle are changed from
  // Turndown's defaults ('setext', '* * *', '*', 'indented').
  const options = {
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    br: '  ',
    blankReplacement: function (content, node) {
      return node.isBlock ? '\n\n' : '';
    },
    defaultReplacement: function (content, node) {
      return node.isBlock ? '\n\n' + content + '\n\n' : content;
    }
  };

  // ===================== utilities.js =====================
  function repeat (character, count) {
    return Array(count + 1).join(character);
  }

  function trimLeadingNewlines (string) {
    return string.replace(/^\n*/, '');
  }

  function trimTrailingNewlines (string) {
    let indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === '\n') indexEnd--;
    return string.substring(0, indexEnd);
  }

  function trimNewlines (string) {
    return trimTrailingNewlines(trimLeadingNewlines(string));
  }

  const blockElements = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
    'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
    'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
    'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
    'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
    'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
  ];

  const voidElements = [
    'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
    'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
  ];

  const meaningfulWhenBlankElements = [
    'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
    'AUDIO', 'VIDEO'
  ];

  function is (node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
  }

  function has (node, tagNames) {
    return (
      node.getElementsByTagName &&
      tagNames.some(function (tagName) {
        return node.getElementsByTagName(tagName).length;
      })
    );
  }

  function isBlock (node) { return is(node, blockElements); }
  function isVoid (node) { return is(node, voidElements); }
  function hasVoid (node) { return has(node, voidElements); }
  function isMeaningfulWhenBlank (node) { return is(node, meaningfulWhenBlankElements); }
  function hasMeaningfulWhenBlank (node) { return has(node, meaningfulWhenBlankElements); }

  const markdownEscapes = [
    [/\\/g, '\\\\'],
    [/\*/g, '\\*'],
    [/^-/g, '\\-'],
    [/^\+ /g, '\\+ '],
    [/^(=+)/g, '\\$1'],
    [/^(#{1,6}) /g, '\\$1 '],
    [/`/g, '\\`'],
    [/^~~~/g, '\\~~~'],
    [/\[/g, '\\['],
    [/\]/g, '\\]'],
    [/^>/g, '\\>'],
    [/_/g, '\\_'],
    [/^(\d+)\. /g, '$1\\. ']
  ];

  function escapeMarkdown (string) {
    return markdownEscapes.reduce(function (accumulator, escape) {
      return accumulator.replace(escape[0], escape[1]);
    }, string);
  }

  // ===================== collapse-whitespace.js =====================
  function collapseWhitespace (element) {
    if (!element.firstChild || isPre(element)) return;

    let prevText = null;
    let keepLeadingWs = false;

    let prev = null;
    let node = next(prev, element);

    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) {
        let text = node.data.replace(/[ \r\n\t]+/g, ' ');

        if ((!prevText || / $/.test(prevText.data)) &&
            !keepLeadingWs && text[0] === ' ') {
          text = text.substr(1);
        }

        if (!text) {
          node = remove(node);
          continue;
        }

        node.data = text;
        prevText = node;
      } else if (node.nodeType === 1) {
        if (isBlock(node) || node.nodeName === 'BR') {
          if (prevText) prevText.data = prevText.data.replace(/ $/, '');
          prevText = null;
          keepLeadingWs = false;
        } else if (isVoid(node) || isPre(node)) {
          prevText = null;
          keepLeadingWs = true;
        } else if (prevText) {
          keepLeadingWs = false;
        }
      } else {
        node = remove(node);
        continue;
      }

      const nextNode = next(prev, node);
      prev = node;
      node = nextNode;
    }

    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, '');
      if (!prevText.data) remove(prevText);
    }
  }

  function isPre (node) { return node.nodeName === 'PRE'; }

  function remove (node) {
    const next = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next;
  }

  function next (prev, current) {
    if ((prev && prev.parentNode === current) || isPre(current)) {
      return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
  }

  // ===================== node.js =====================
  // DIFF: KBD, SAMP and TT count as code (as in clipboard2markdown).
  const codeElements = ['CODE', 'KBD', 'SAMP', 'TT'];

  function Node (node) {
    node.isBlock = isBlock(node);
    node.isCode = is(node, codeElements) || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node);
    return node;
  }

  function isBlank (node) {
    return (
      !isVoid(node) &&
      !isMeaningfulWhenBlank(node) &&
      /^\s*$/i.test(node.textContent) &&
      !hasVoid(node) &&
      !hasMeaningfulWhenBlank(node)
    );
  }

  function flankingWhitespace (node) {
    if (node.isBlock) return { leading: '', trailing: '' };

    const edges = edgeWhitespace(node.textContent);

    if (edges.leadingAscii && isFlankedByWhitespace('left', node)) {
      edges.leading = edges.leadingNonAscii;
    }
    if (edges.trailingAscii && isFlankedByWhitespace('right', node)) {
      edges.trailing = edges.trailingNonAscii;
    }
    return { leading: edges.leading, trailing: edges.trailing };
  }

  function edgeWhitespace (string) {
    const m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
      leading: m[1],
      leadingAscii: m[2],
      leadingNonAscii: m[3],
      trailing: m[4],
      trailingNonAscii: m[5],
      trailingAscii: m[6]
    };
  }

  function isFlankedByWhitespace (side, node) {
    let sibling, regExp, isFlanked;
    if (side === 'left') {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }
    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked;
  }

  // ===================== commonmark-rules.js =====================
  const rules = {};

  rules.paragraph = {
    filter: 'p',
    replacement: function (content) {
      return '\n\n' + content + '\n\n';
    }
  };

  rules.lineBreak = {
    filter: 'br',
    replacement: function (content, node, options) {
      return options.br + '\n';
    }
  };

  rules.heading = {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function (content, node, options) {
      const hLevel = Number(node.nodeName.charAt(1));
      if (options.headingStyle === 'setext' && hLevel < 3) {
        const underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
        return '\n\n' + content + '\n' + underline + '\n\n';
      } else {
        return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n';
      }
    }
  };

  rules.blockquote = {
    filter: 'blockquote',
    replacement: function (content) {
      content = trimNewlines(content).replace(/^/gm, '> ');
      return '\n\n' + content + '\n\n';
    }
  };

  rules.list = {
    filter: ['ul', 'ol'],
    replacement: function (content, node) {
      const parent = node.parentNode;
      if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
        return '\n' + content;
      } else {
        return '\n\n' + content + '\n\n';
      }
    }
  };

  rules.listItem = {
    filter: 'li',
    replacement: function (content, node, options) {
      let prefix = options.bulletListMarker + '   ';
      const parent = node.parentNode;
      if (parent.nodeName === 'OL') {
        const start = parent.getAttribute('start');
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + '.  ';
      }
      const isParagraph = /\n$/.test(content);
      content = trimNewlines(content) + (isParagraph ? '\n' : '');
      content = content.replace(/\n/gm, '\n' + ' '.repeat(prefix.length));
      return prefix + content + (node.nextSibling ? '\n' : '');
    }
  };

  rules.indentedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'indented' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      return '\n\n    ' + node.firstChild.textContent.replace(/\n/g, '\n    ') + '\n\n';
    }
  };

  rules.fencedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node, options) {
      const className = node.firstChild.getAttribute('class') || '';
      const language = (className.match(/language-(\S+)/) || [null, ''])[1];
      return fencedCode(node.firstChild.textContent, language, options);
    }
  };

  function fencedCode (code, language, options) {
    const fenceChar = options.fence.charAt(0);
    let fenceSize = 3;
    const fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');
    let match;
    while ((match = fenceInCodeRegex.exec(code))) {
      if (match[0].length >= fenceSize) fenceSize = match[0].length + 1;
    }
    const fence = repeat(fenceChar, fenceSize);
    return '\n\n' + fence + language + '\n' + code.replace(/\n$/, '') + '\n' + fence + '\n\n';
  }

  rules.horizontalRule = {
    filter: 'hr',
    replacement: function (content, node, options) {
      return '\n\n' + options.hr + '\n\n';
    }
  };

  // DIFF: uses node.href (the absolute URL) instead of the raw href attribute,
  // so relative links still work after you paste them somewhere else.
  rules.inlineLink = {
    filter: function (node) {
      return node.nodeName === 'A' && node.getAttribute('href');
    },
    replacement: function (content, node) {
      const href = escapeLinkDestination(node.href || node.getAttribute('href'));
      const title = escapeLinkTitle(cleanAttribute(node.getAttribute('title')));
      const titlePart = title ? ' "' + title + '"' : '';
      return '[' + content + '](' + href + titlePart + ')';
    }
  };

  rules.emphasis = {
    filter: ['em', 'i'],
    replacement: function (content, node, options) {
      if (!content.trim()) return '';
      return options.emDelimiter + content + options.emDelimiter;
    }
  };

  rules.strong = {
    filter: ['strong', 'b'],
    replacement: function (content, node, options) {
      if (!content.trim()) return '';
      return options.strongDelimiter + content + options.strongDelimiter;
    }
  };

  // DIFF: also matches KBD, SAMP and TT (as in clipboard2markdown).
  rules.code = {
    filter: function (node) {
      const hasSiblings = node.previousSibling || node.nextSibling;
      const isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
      return is(node, codeElements) && !isCodeBlock;
    },
    replacement: function (content) {
      if (!content) return '';
      content = content.replace(/\r?\n|\r/g, ' ');
      const extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
      let delimiter = '`';
      const matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
      return delimiter + extraSpace + content + extraSpace + delimiter;
    }
  };

  // DIFF: absolute src (node.src), and inline data: images are dropped
  // rather than putting huge base64 strings on your clipboard.
  rules.image = {
    filter: 'img',
    replacement: function (content, node) {
      const alt = escapeMarkdown(cleanAttribute(node.getAttribute('alt')));
      const raw = node.getAttribute('src') ? node.src : '';
      if (/^data:/i.test(raw)) return '';
      const src = escapeLinkDestination(raw);
      const title = cleanAttribute(node.getAttribute('title'));
      const titlePart = title ? ' "' + escapeLinkTitle(title) + '"' : '';
      return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : '';
    }
  };

  function cleanAttribute (attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : '';
  }

  function escapeLinkDestination (destination) {
    const escaped = destination.replace(/([<>()])/g, '\\$1');
    return escaped.indexOf(' ') >= 0 ? '<' + escaped + '>' : escaped;
  }

  function escapeLinkTitle (title) {
    return title.replace(/"/g, '\\"');
  }

  // ===================== turndown-plugin-gfm =====================
  const gfm = {};
  const indexOf = Array.prototype.indexOf;
  const every = Array.prototype.every;
  const highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;

  gfm.highlightedCodeBlock = {
    filter: function (node) {
      const firstChild = node.firstChild;
      return (
        node.nodeName === 'DIV' &&
        highlightRegExp.test(node.className) &&
        firstChild &&
        firstChild.nodeName === 'PRE'
      );
    },
    replacement: function (content, node, options) {
      const className = node.className || '';
      const language = (className.match(highlightRegExp) || [null, ''])[1];
      return '\n\n' + options.fence + language + '\n' + node.firstChild.textContent + '\n' + options.fence + '\n\n';
    }
  };

  gfm.strikethrough = {
    filter: ['del', 's', 'strike'],
    replacement: function (content) {
      return '~' + content + '~';
    }
  };

  gfm.taskListItems = {
    filter: function (node) {
      return node.type === 'checkbox' && node.parentNode.nodeName === 'LI';
    },
    replacement: function (content, node) {
      return (node.checked ? '[x]' : '[ ]') + ' ';
    }
  };

  gfm.tableCell = {
    filter: ['th', 'td'],
    replacement: function (content, node) {
      return cell(content, node);
    }
  };

  gfm.tableRow = {
    filter: 'tr',
    replacement: function (content, node) {
      let borderCells = '';
      const alignMap = { left: ':--', right: '--:', center: ':-:' };
      if (isHeadingRow(node) || isFallbackHeadingRow(node)) {
        for (let i = 0; i < node.childNodes.length; i++) {
          let border = '---';
          const align = (node.childNodes[i].getAttribute('align') || '').toLowerCase();
          if (align) border = alignMap[align] || border;
          borderCells += cell(border, node.childNodes[i]);
        }
      }
      return '\n' + content + (borderCells ? '\n' + borderCells : '');
    }
  };

  // DIFF: Turndown keeps tables without a heading row as raw HTML. Here every
  // table is converted, using its first row as the heading row when needed.
  gfm.table = {
    filter: function (node) {
      return node.nodeName === 'TABLE' && node.rows.length > 0;
    },
    replacement: function (content) {
      content = content.replace('\n\n', '\n');
      return '\n\n' + content + '\n\n';
    }
  };

  gfm.tableSection = {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: function (content) {
      return content;
    }
  };

  function isHeadingRow (tr) {
    const parentNode = tr.parentNode;
    return (
      parentNode.nodeName === 'THEAD' ||
      (
        parentNode.firstChild === tr &&
        (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
        every.call(tr.childNodes, function (n) { return n.nodeName === 'TH'; })
      )
    );
  }

  function isFallbackHeadingRow (tr) {
    let table = tr.parentNode;
    while (table && table.nodeName !== 'TABLE') table = table.parentNode;
    return !!table && table.rows[0] === tr && !isHeadingRow(tr);
  }

  function isFirstTbody (element) {
    const previousSibling = element.previousSibling;
    return (
      element.nodeName === 'TBODY' && (
        !previousSibling ||
        (previousSibling.nodeName === 'THEAD' && /^\s*$/i.test(previousSibling.textContent))
      )
    );
  }

  // DIFF: line breaks inside a cell become spaces and | is escaped,
  // so multi-line cells don't break the table.
  function cell (content, node) {
    const index = indexOf.call(node.parentNode.childNodes, node);
    const prefix = index === 0 ? '| ' : ' ';
    content = content.replace(/\s*\n+\s*/g, ' ').trim().replace(/\|/g, '\\|');
    return prefix + content + ' |';
  }

  // ===================== page rules (DIFF: not in Turndown) =====================
  // Like Turndown's remove(), but checked before other rules so hidden
  // paragraphs etc. are dropped too.
  const pageRules = {};

  pageRules.removed = {
    filter: function (node) {
      return (
        /^(script|style|noscript|template|iframe|object|embed|svg|canvas|video|audio|button|select|textarea|dialog|head|meta|link)$/i.test(node.nodeName) ||
        node.hidden ||
        node.getAttribute('aria-hidden') === 'true'
      );
    },
    replacement: function () { return ''; }
  };

  // Many sites use <b style="font-weight:normal"> purely for layout.
  pageRules.notBold = {
    filter: function (node) {
      return /^(STRONG|B)$/.test(node.nodeName) && /^(normal|[1-4]00)$/.test(node.style.fontWeight);
    },
    replacement: function (content) { return content; }
  };

  // javascript: links and icon-only links (no text, no image) become plain content.
  pageRules.plainLink = {
    filter: function (node) {
      if (node.nodeName !== 'A' || !node.getAttribute('href')) return false;
      return /^\s*javascript:/i.test(node.getAttribute('href')) ||
        (!/\S/.test(node.textContent) && !node.getElementsByTagName('img').length);
    },
    replacement: function (content) { return content; }
  };

  // A <pre> without a <code> child is still a code block.
  pageRules.plainPre = {
    filter: function (node) {
      return node.nodeName === 'PRE' && !(node.firstChild && node.firstChild.nodeName === 'CODE');
    },
    replacement: function (content, node, options) {
      return fencedCode(node.textContent, '', options);
    }
  };

  // ===================== rules.js =====================
  // Order matches Turndown: rules added later (plugins) are checked first.
  const ruleArray = [];
  [rules, gfm, pageRules].forEach(function (set) {
    const added = [];
    for (const key in set) added.push(set[key]);
    ruleArray.unshift.apply(ruleArray, added);
  });
  const blankRule = { replacement: options.blankReplacement };
  const defaultRule = { replacement: options.defaultReplacement };

  function forNode (node) {
    if (node.isBlank) return blankRule;
    for (let i = 0; i < ruleArray.length; i++) {
      if (filterValue(ruleArray[i], node)) return ruleArray[i];
    }
    return defaultRule;
  }

  function filterValue (rule, node) {
    const filter = rule.filter;
    if (typeof filter === 'string') return filter === node.nodeName.toLowerCase();
    if (Array.isArray(filter)) return filter.indexOf(node.nodeName.toLowerCase()) > -1;
    return !!filter.call(rule, node, options);
  }

  // ===================== turndown.js =====================
  function turndown (root) {
    collapseWhitespace(root);
    return postProcess(process(root));
  }

  function process (parentNode) {
    return Array.prototype.reduce.call(parentNode.childNodes, function (output, node) {
      node = Node(node);
      let replacement = '';
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : escapeMarkdown(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode(node);
      }
      join(output, replacement);
      return output;
    }, []);
  }

  function postProcess (output) {
    return output.join('').replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '');
  }

  function replacementForNode (node) {
    const rule = forNode(node);
    let content = process(node).join('');
    const whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content = content.trim();
    return whitespace.leading + rule.replacement(content, node, options) + whitespace.trailing;
  }

  function join (output, replacement) {
    const tail = output.pop() || '';
    const s1 = trimTrailingNewlines(tail);
    const s2 = trimLeadingNewlines(replacement);
    const nls = Math.max(tail.length - s1.length, replacement.length - s2.length);
    const separator = '\n\n'.substring(0, nls);
    if (s1) output.push(s1);
    if (separator) output.push(separator);
    if (s2) output.push(s2);
  }

  // ===================== selection -> markdown =====================
  const WRAP_INLINE = /^(A|B|STRONG|I|EM|S|DEL|STRIKE|CODE|KBD|SAMP|TT|PRE)$/;

  function topTags (root) {
    const seen = {};
    for (let c = root.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) seen[c.nodeName] = true;
    return seen;
  }

  function rangeToMarkdown (range) {
    const doc = range.startContainer.ownerDocument || document;
    const root = doc.createElement('div');
    root.appendChild(range.cloneContents());
    let el = range.commonAncestorContainer;
    if (el.nodeType !== 1) el = el.parentNode;
    // Re-create the context the selection lives in (lists, tables, links, code, bold…)
    for (; el && el.nodeType === 1 && el !== doc.body && el !== doc.documentElement; el = el.parentNode) {
      const t = el.nodeName, top = topTags(root);
      const need = WRAP_INLINE.test(t) ||
        ((t === 'UL' || t === 'OL') && top.LI) ||
        (/^(THEAD|TBODY|TFOOT)$/.test(t) && top.TR) ||
        (t === 'TR' && (top.TD || top.TH)) ||
        (t === 'TABLE' && (top.TR || top.TBODY || top.THEAD || top.TFOOT));
      if (need) {
        const w = el.cloneNode(false);
        while (root.firstChild) w.appendChild(root.firstChild);
        root.appendChild(w);
      }
    }
    return turndown(root);
  }

  function selectionToMarkdown (win) {
    win = win || window;
    const doc = win.document, ae = doc.activeElement;
    if (ae && ae.nodeName === 'IFRAME') {
      try { const inner = selectionToMarkdown(ae.contentWindow); if (inner) return inner; } catch (e) {}
    }
    if (ae && (ae.nodeName === 'TEXTAREA' || ae.nodeName === 'INPUT')) {
      try {
        if (ae.selectionEnd > ae.selectionStart) return ae.value.slice(ae.selectionStart, ae.selectionEnd);
      } catch (e) {}
    }
    const sel = win.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return '';
    const parts = [];
    for (let i = 0; i < sel.rangeCount; i++) {
      const md = rangeToMarkdown(sel.getRangeAt(i));
      if (md) parts.push(md);
    }
    return parts.join('\n\n');
  }

  // ===================== UI =====================
  const FONT = 'font:500 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  function el (tag, style, attrs) {
    const e = document.createElement(tag);
    e.setAttribute('style', 'all:initial;' + style);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    return e;
  }

  function root () { return document.body || document.documentElement; }

  // On-page notice. It's a live region (role=status, or role=alert for errors) so
  // screen readers announce it. The text is added after the region is in the page,
  // because some screen readers only announce changes to an existing region.
  function toast (msg, bad) {
    const d = el('div', 'position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:360px;padding:10px 14px;border-radius:8px;' + FONT + 'color:#fff;background:' + (bad ? '#b42318' : '#1f2328') + ';box-shadow:0 6px 20px rgba(0,0,0,.25);transition:opacity .3s;opacity:1', {
      role: bad ? 'alert' : 'status',
      'aria-live': bad ? 'assertive' : 'polite',
      'aria-atomic': 'true'
    });
    root().appendChild(d);
    setTimeout(function () { d.textContent = msg; }, 50);
    setTimeout(function () { d.style.opacity = '0'; }, bad ? 5500 : 3000);
    setTimeout(function () { d.remove(); }, bad ? 6000 : 3500);
    return d;
  }

  // Fallback when the page blocks the clipboard: a modal dialog with the Markdown
  // selected. It has a name and description, keeps Tab inside, closes on Escape,
  // the Close button or a click outside, and returns focus to where it was.
  function manual (text) {
    const id = 'cam-' + Math.random().toString(36).slice(2);
    const previous = document.activeElement;
    const o = el('div', 'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center');
    const box = el('div', 'box-sizing:border-box;width:min(760px,92vw);max-height:90vh;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:12px;background:#fff;color:#1f2328;box-shadow:0 12px 40px rgba(0,0,0,.35);' + FONT, {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': id + '-title',
      'aria-describedby': id + '-desc'
    });
    const title = el('div', 'display:block;font:600 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1f2328', { id: id + '-title' });
    title.textContent = 'Copy as Markdown';
    const desc = el('div', 'display:block;' + FONT + 'color:#1f2328', { id: id + '-desc' });
    desc.textContent = 'This page blocked clipboard access. The Markdown below is selected: press Cmd+C (Mac) or Ctrl+C to copy it, then close this box.';
    const ta = el('textarea', 'display:block;box-sizing:border-box;width:100%;height:55vh;padding:12px;border:1px solid #818b98;border-radius:8px;background:#fff;color:#1f2328;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;overflow:auto', {
      'aria-label': 'Markdown',
      readonly: ''
    });
    ta.value = text;
    const btn = el('button', 'display:inline-block;align-self:flex-end;padding:6px 16px;border:1px solid #818b98;border-radius:8px;background:#fff;color:#1f2328;cursor:pointer;' + FONT, { type: 'button' });
    btn.textContent = 'Close';
    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(ta);
    box.appendChild(btn);
    o.appendChild(box);

    function close () {
      o.remove();
      if (previous && previous.focus && document.contains(previous)) {
        try { previous.focus(); } catch (e) {}
      }
    }
    btn.addEventListener('click', close);
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const first = ta, last = btn;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    root().appendChild(o);
    ta.focus();
    ta.select();
    return { overlay: o, dialog: box, textarea: ta, close: btn };
  }

  function copy (text, done, fail) {
    let ok = false;
    function onCopy (e) {
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

  if (window.__MD_TEST__) { window.__selectionToMarkdown = selectionToMarkdown; window.__ui = { toast: toast, manual: manual }; return; } // @test-only

  let md;
  try { md = selectionToMarkdown(); } catch (e) { toast('Copy as Markdown failed: ' + e.message, true); return; }
  if (!md) { toast('Select some text first, then click the bookmarklet.', true); return; }
  copy(md, function () {
    const lines = md.split('\n').length;
    toast('Copied as Markdown (' + lines + ' line' + (lines === 1 ? '' : 's') + ')');
  }, function () { manual(md); });
})();
