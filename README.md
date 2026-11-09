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

`bookmarklet.js` is the readable source. After editing it, install the dev dependencies once, then run the tests and rebuild the bookmarklet and the install page:

```bash
npm install
```

```bash
npm test
```

```bash
npm run build
```

The tests compare the port's output with the real Turndown (pinned in `package.json`) for HTML that doesn't touch an intentional difference, and check the differences and selection handling separately. CI runs them on every push and fails if the committed `index.html` is out of date.

### Versions and releases

The version is in `package.json` and shown on the install page; installed bookmarks carry it in their URL (`/* Copy as Markdown v1.0.0 …`). Changes are listed in [CHANGELOG.md](CHANGELOG.md). Pushing a tag such as `v1.1.0` runs the Release workflow, which checks the tag against `package.json`, runs the tests, and publishes a [GitHub release](https://github.com/tuckbick/copy-as-markdown/releases) with the changelog notes and the bookmarklet URL attached. The release steps are in [AGENTS.md](AGENTS.md).

### Keeping up with Turndown

`upstream.json` records the exact Turndown and turndown-plugin-gfm versions the port is based on. A monthly GitHub Action (`.github/workflows/upstream.yml`) runs `npm run check-upstream` and opens an issue labeled `upstream` when a ported file has changed. To act on it, ask Claude Code (or another coding agent) in this repo to "update from Turndown"; the steps it follows are in [AGENTS.md](AGENTS.md), which `CLAUDE.md` points to.

This writes `index.html` (the install page) and `bookmarklet.url.txt` (the raw `javascript:` URL, git-ignored). The install page's favicon is `icons/clipboard.svg`.

The build fails if the bookmarklet grows past 32,000 characters. Browsers don't publish a bookmark length limit, and long bookmarklets have been reported as cut off in Firefox and failing silently in Safari, so it stays well under that.

Source conventions: use full-line `//` comments only and end statements with semicolons, since the build joins trimmed lines without a real minifier.
