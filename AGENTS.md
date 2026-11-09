# Copy as Markdown: notes for coding agents

A bookmarklet that copies the current selection as Markdown. `bookmarklet.js` is the source;
`build.mjs` turns it into the `javascript:` URL and writes `index.html` (the install page,
served by GitHub Pages at https://copy-as-markdown.tuckbick.com/).

## Commands

- `npm install`: dev dependencies (jsdom, and the real Turndown for parity tests)
- `npm test`: parity tests against Turndown plus behavior tests (`test/convert.test.mjs`)
- `npm run build`: rebuild `index.html` (commit it; CI fails if it's stale)
- `npm run check-upstream`: compare `upstream.json` with the latest Turndown / GFM plugin

## Source rules for bookmarklet.js

- Only full-line `//` comments, and end statements with semicolons: the build joins trimmed
  lines without a minifier. `/* */` comments are kept in the built bookmarklet (used for the
  license notice).
- The converter mirrors Turndown's files and names (sections are headed with the upstream
  file name). Keep it that way, and mark every intentional difference with `DIFF:`.
- The build fails above 32,000 characters (browser bookmark limits).

## Updating from Turndown

Triggered by an "upstream" issue from the weekly workflow, or by being asked to check for
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
