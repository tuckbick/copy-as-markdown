# Copy as Markdown

> {{description}}

Version {{version}}; the converter is a port of Turndown {{turndownVersion}}. It runs entirely in the browser, sends nothing anywhere and loads no outside scripts. It works in Chrome, Edge, Firefox, Brave and other desktop browsers that support bookmarklets. It can't read apps that draw text on a canvas, such as Google Docs.

## Install

- Open {{siteUrl}} and drag the "{{label}}" button to the bookmarks bar.
- Or create a bookmark whose URL is the bookmarklet code: the `copy-as-markdown-vX.Y.Z.txt` file attached to the latest GitHub release.

## Use

Select text on any page and click the bookmark. The selection is copied to the clipboard as Markdown.

## What gets converted

{{convertsList}}

Partial selections keep their context: select two list items and you get a list, select a few table rows and you get a table.

## Links

- [Install page]({{siteUrl}})
- [Source code]({{repo}}): MIT license
- [Latest release and bookmarklet code]({{repo}}/releases/latest)
- [README]({{raw}}/README.md): install options, how the converter works, and how to build it

## Optional

- [Changelog]({{raw}}/CHANGELOG.md): user-facing changes in each release
- [Author](https://tuckbick.com)
