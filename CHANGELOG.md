# Changelog

All notable changes to Copy as Markdown. Versions follow [semantic versioning](https://semver.org/):
a **major** bump changes Markdown output style on purpose, a **minor** bump adds features or
updates the converter to a newer Turndown, and a **patch** bump fixes bugs.

To update an installed bookmark, open the [install page](https://copy-as-markdown.tuckbick.com/)
and drag the button to your bookmarks bar again (then delete the old one).

## 1.1.0 (2026-11-10)

Accessibility, plus a clearer install page. Markdown output is unchanged.

**Bookmarklet**

- The "Copied as Markdown" notice and error messages are now announced by screen readers
  ([#3](https://github.com/tuckbick/copy-as-markdown/issues/3)), and stay on screen a little longer.
- When a page blocks the clipboard, the copy-it-yourself box is now a proper dialog: it has a
  title, instructions and a Close button, keeps keyboard focus inside, and returns focus to where
  you were when it closes ([#4](https://github.com/tuckbick/copy-as-markdown/issues/4)).

**Install page**

- Better color contrast in light and dark mode for links, the drag button, selected options and
  control outlines.
- New "What it does" section; the add-by-hand code is tucked into a collapsible section.
- Search and link-preview details: page title and description, preview image, and a sitemap.
- Accessibility test results are documented in
  [docs/accessibility.md](https://github.com/tuckbick/copy-as-markdown/blob/main/docs/accessibility.md).

## 1.0.0 (2026-11-09)

First release.

- Select text on any page, click the bookmark, and the selection is copied as Markdown.
- Converter is a compact port of Turndown v7.2.5 and turndown-plugin-gfm: headings, emphasis,
  code (inline and fenced, with language), links and images (made absolute), nested and
  ordered lists, task lists, blockquotes, tables, strikethrough.
- Partial selections keep their context (lists, tables, links, code, bold).
- Works on sites with a strict Content Security Policy; falls back to a copy-it-yourself box
  where clipboard access is blocked.
- Install page at https://copy-as-markdown.tuckbick.com/ with a choice of emoji and name for
  the bookmark.
