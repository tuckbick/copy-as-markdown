# Third-party notices

Copy as Markdown itself is MIT licensed (see [LICENSE](LICENSE)). It includes adapted code and an
image from the projects below, under their own licenses.

| Component | Used in | Version | License |
| --- | --- | --- | --- |
| [Turndown](https://github.com/mixmark-io/turndown) | Converter in `bookmarklet.js` (adapted port) | v7.2.5 | MIT |
| [turndown-plugin-gfm](https://github.com/mixmark-io/turndown-plugin-gfm) | Tables, strikethrough, task lists, highlighted code in `bookmarklet.js` (adapted port) | master @ `61a981b` (after v1.0.1) | MIT |
| collapse-whitespace (as included in Turndown) | Whitespace handling in `bookmarklet.js` (adapted port) | from Turndown v7.2.5 | MIT |
| [Twemoji](https://github.com/jdecked/twemoji) | `icons/clipboard.svg`, the install page's favicon | v17.0.3 | CC-BY 4.0 (graphics) |

The exact upstream versions the port tracks are recorded in [`upstream.json`](upstream.json).

The built bookmarklet keeps a one-line copyright notice for the adapted code, and the install page
credits the Twemoji icon in its footer.

**Acknowledgement (no code used):** [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown)
by Euan Goddard (MIT) inspired this project; the idea of treating `<kbd>`, `<samp>` and `<tt>` as code
comes from its converter settings.

## Twemoji 📋 clipboard icon

`icons/clipboard.svg` is the Twemoji "clipboard" emoji (U+1F4CB) from https://github.com/jdecked/twemoji
(v17.0.3), unmodified.

Copyright 2019 Twitter, Inc and other contributors. Graphics licensed under CC-BY 4.0:
https://creativecommons.org/licenses/by/4.0/

## Turndown and turndown-plugin-gfm

https://github.com/mixmark-io/turndown and https://github.com/mixmark-io/turndown-plugin-gfm

MIT License

Copyright (c) 2017 Dom Christie

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## collapse-whitespace (as included in Turndown)

MIT License

Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
