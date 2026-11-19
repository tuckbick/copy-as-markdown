# Copy as Markdown: notes for coding agents

A bookmarklet that copies the current selection as Markdown. `bookmarklet.js` is the source;
`build.mjs` minifies it into the `javascript:` URL and writes `index.html` (the install page,
served by GitHub Pages at https://copy-as-markdown.tuckbick.com/) plus `llms.txt` (the same
information as Markdown for AI agents).

The install page's sources are in `site/`: `content.mjs` (text and settings, including the
emoji and name choices), `index.html` and `llms.md` (templates with `{{placeholders}}`, filled
by `scripts/fill.mjs`, which fails on a missing or unused value), and `style.css` and `page.js`
(inlined into the page; `page.js` is minified). `scripts/minify.mjs` holds the Terser settings.

## Commands

- `npm install`: dev dependencies (jsdom, and the real Turndown for parity tests)
- `npm test`: parity tests against Turndown plus behavior tests (`test/convert.test.mjs`),
  UI tests (`test/ui.test.mjs`) and tests of the minified build (`test/build.test.mjs`)
- `npm run build`: rebuild `index.html` and `llms.txt` (commit both; CI fails if they're stale)
- `npm run check-upstream`: compare `upstream.json` with the latest Turndown / GFM plugin

## Source rules for bookmarklet.js

- Write for readability: the build minifies with Terser. The only comment kept in the built
  bookmarklet is the `/* Copy as Markdown v… */` license and version notice.
- The file must stay a plain `(function () { ... })();`: a `javascript:` URL that evaluates to
  a value replaces the page, so the build fails on any other shape.
- The converter mirrors Turndown's files and names (sections are headed with the upstream
  file name). Keep it that way, and mark every intentional difference with `DIFF:`.
- The build fails above 32,000 characters (browser bookmark limits).

## Accessibility

Target is WCAG 2.2 AA; see `docs/accessibility.md`. After changing colors, layout or controls
on the install page (in `site/`), re-run `scripts/a11y-check.js` in the browser in light and
dark mode, Tab through the page, and update the doc's results. Changes to the bookmarklet's
notice or fallback dialog must keep their roles, names and focus handling. Track problems as
GitHub issues with the `accessibility` label.

## Updating from Turndown

Triggered by an "upstream" issue from the monthly workflow, or by being asked to check for
Turndown updates.

1. `GITHUB_TOKEN=$(gh auth token) npm run check-upstream` to see what changed and which
   ported files are affected.
2. For each affected file, read the upstream diff between the commit in `upstream.json` and
   the new one (`gh api repos/mixmark-io/turndown/compare/<old>...<new>`, or the file at each
   ref). Decide what applies: bug fixes and output changes in ported code usually do; string
   parsing (`html-parser.js`), reference links, `keep()` and the plugin system are not ported.
3. Port the changes into the matching section of `bookmarklet.js`. Don't undo `DIFF:` behavior
   without asking.
4. Bump `turndown` / `turndown-plugin-gfm` in `package.json` to the new versions, `npm install`,
   and run `npm test`. Parity failures show where the port still differs from the new release;
   fix them, or, if the difference is intentional, move the case into the DIFF tests.
5. Update `upstream.json` (version, commit, file list), the version table in
   `THIRD_PARTY_NOTICES.md`, and the copyright lines there if upstream's changed.
6. `npm run build`, then cut a release (below) with a changelog entry such as
   "Update converter to Turndown vX.Y.Z" describing user-visible output changes.

## Releasing

The version is in `package.json`; the build stamps it into the bookmarklet's notice comment
and the install page. Semver: major = intentional output-style change, minor = new feature or
Turndown update, patch = bug fix.

1. `npm version <patch|minor|major> --no-git-tag-version`
2. Add a `## X.Y.Z (YYYY-MM-DD)` section at the top of `CHANGELOG.md` (user-facing changes).
3. `npm test && npm run build`, then commit everything as "Release vX.Y.Z".
4. Ask the user before pushing. Then `git tag vX.Y.Z && git push && git push origin vX.Y.Z`.
   The Release workflow checks the tag matches `package.json`, runs the tests, and publishes
   a GitHub release with the changelog section and the bookmarklet URL as an asset. Pages
   picks up the new `index.html` from `main`.

If nothing in the ported files changed, still bump the parity-test versions and
`upstream.json` so the check stops reporting it; that needs no release.
