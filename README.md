# Copy as Markdown

A browser bookmarklet: select text on any web page, click the bookmark, and the selection is converted to Markdown and copied to your clipboard.

Inspired by [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown), minus the round trip of pasting into a separate page and copying again.

## Install

Open [`install.html`](install.html) in your browser (download it, or enable GitHub Pages for this repo) and drag the **Copy as Markdown** button to your bookmarks bar.

If dragging doesn't work (some Safari versions), create any bookmark and replace its URL with the code shown on the install page.

## What it converts

- Headings, bold, italic, strikethrough
- Inline code and fenced code blocks (with language from `language-*` / `lang-*` classes)
- Links and images, with relative URLs made absolute
- Bulleted, numbered (respects `start`), nested lists and checkboxes
- Blockquotes and line breaks
- Tables as GitHub-flavored Markdown tables

Partial selections keep their context: selecting two list items gives a list, selecting table rows gives a table, selecting inside a bold phrase or link keeps the formatting.

## How it works

- **Self-contained:** no external scripts are loaded, so it works on sites with a strict Content Security Policy.
- **Clipboard:** it writes through the `copy` event and falls back to `navigator.clipboard`. If a page blocks both, a box opens with the Markdown pre-selected so you can press Cmd/Ctrl+C.
- **Inputs and iframes:** selections inside text fields and same-origin iframes work too.

Won't work on apps that draw text on a canvas (e.g. Google Docs), since there's no page text to read.

## Development

`bookmarklet.js` is the readable source. After editing it, rebuild the bookmarklet and the install page:

```bash
node build.mjs
```

This writes `install.html` and `bookmarklet.url.txt` (the raw `javascript:` URL, git-ignored).

Source conventions: use full-line `//` comments only and end statements with semicolons, since the build joins trimmed lines without a real minifier.
