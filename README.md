# Copy as Markdown

A browser bookmarklet: select text on any web page, click the bookmark, and the selection is converted to Markdown and copied to your clipboard.

Inspired by [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown), minus the round trip of pasting into a separate page and copying again.

## Install

Open the install page, **https://copy-as-markdown.tuckbick.com/**, and drag the **📋 Copy as Markdown** button to your bookmarks bar. (It's [`index.html`](index.html), published with GitHub Pages; you can also open it locally.)

If dragging doesn't work (some Safari versions), create any bookmark and replace its URL with the code shown on the install page.

Browsers don't keep a favicon for `javascript:` bookmarks, so the emoji at the start of the bookmark's name serves as its icon. The install page lets you pick the emoji and name (default "📋 Copy as Markdown", or a shorter one like "📋 MD", or your own) before dragging; the choices are the `EMOJIS` and `NAMES` lists in `build.mjs`.

## What it converts

- Headings, bold, italic, strikethrough
- Inline code and fenced code blocks (with language from `language-*` / `lang-*` classes)
- Links and images, with relative URLs made absolute
- Bulleted, numbered (respects `start`), nested lists and checkboxes
- Blockquotes and line breaks
- Tables as GitHub-flavored Markdown tables

Partial selections keep their context: selecting two list items gives a list, selecting table rows gives a table, selecting inside a bold phrase or link keeps the formatting.

## How it works

- **Turndown port:** the converter is a compact port of [Turndown](https://github.com/mixmark-io/turndown) and its GFM plugin (the library behind clipboard2markdown's to-markdown). It uses the same functions, rules and option names, with string parsing, reference links and the plugin system left out. Each intentional difference is marked `DIFF:` in `bookmarklet.js`, mainly: absolute link/image URLs, every table converted (not just ones with a heading row), and hidden or non-content elements dropped. Licenses are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Options:** set at the top of `bookmarklet.js` using Turndown's option names (`headingStyle`, `bulletListMarker`, `codeBlockStyle`, `emDelimiter`, …).
- **Self-contained:** no external scripts are loaded, so it works on sites with a strict Content Security Policy.
- **Clipboard:** it writes through the `copy` event and falls back to `navigator.clipboard`. If a page blocks both, a box opens with the Markdown pre-selected so you can press Cmd/Ctrl+C.
- **Inputs and iframes:** selections inside text fields and same-origin iframes work too.

Won't work on apps that draw text on a canvas (e.g. Google Docs), since there's no page text to read.

## License

MIT, see [LICENSE](LICENSE). The converter is adapted from Turndown and turndown-plugin-gfm (MIT), and the install page's icon is Twemoji (CC-BY 4.0); details and full license texts are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Development

The site is published by GitHub Pages straight from the root of `main` (Settings → Pages → *Deploy from a branch*), so pushing a rebuilt `index.html` updates it. `.nojekyll` tells Pages to serve the files as-is, and `CNAME` sets the custom domain (copy-as-markdown.tuckbick.com, a DNS CNAME to `tuckbick.github.io`).

`bookmarklet.js` is the readable source. After editing it, rebuild the bookmarklet and the install page:

```bash
node build.mjs
```

This writes `index.html` (the install page) and `bookmarklet.url.txt` (the raw `javascript:` URL, git-ignored). The install page's favicon is `icons/clipboard.svg`.

The build fails if the bookmarklet grows past 32,000 characters. Browsers don't publish a bookmark length limit, and long bookmarklets have been reported as cut off in Firefox and failing silently in Safari, so it stays well under that.

Source conventions: use full-line `//` comments only and end statements with semicolons, since the build joins trimmed lines without a real minifier.
