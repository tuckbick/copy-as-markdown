# Changelog

All notable changes to Copy as Markdown. Versions follow [semantic versioning](https://semver.org/):
a **major** bump changes Markdown output style on purpose, a **minor** bump adds features or
updates the converter to a newer Turndown, and a **patch** bump fixes bugs.

To update an installed bookmark, open the [install page](https://copy-as-markdown.tuckbick.com/)
and drag the button to your bookmarks bar again (then delete the old one).

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
