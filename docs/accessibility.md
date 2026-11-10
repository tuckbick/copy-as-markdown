# Accessibility

Target: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA for the install page (`index.html`,
https://copy-as-markdown.tuckbick.com/) and for the bookmarklet's own on-page UI (the "Copied"
notice and the fallback copy box).

Known issues are tracked with the
[`accessibility` label](https://github.com/tuckbick/copy-as-markdown/issues?q=label%3Aaccessibility).

## Audit of 2026-11-10

Run on the install page served locally (`python3 -m http.server 8767`) in a Chromium-based
browser, at desktop width and at 320px, in light and dark mode. An automated scanner (axe-core)
was **not** run, and no screen reader was used; see [what wasn't tested](#not-tested-yet).

### 1. Text contrast (WCAG 1.4.3)

Every visible text node's color was measured against its effective background (translucent
backgrounds blended down to the first opaque one) with the WCAG contrast formula. Normal text
needs 4.5:1; large text (24px, or 18.66px bold) needs 3:1.

| Text | Before | After: light | After: dark |
| --- | --- | --- | --- |
| Links (dark mode used the browser's default link color) | 1.8–2.0 (dark) | 4.84+ | 5.58+ |
| Drag button, white on blue | 3.1 (dark) | 5.19 | 5.85 |
| Selected chip text | 3.95 (light) | 5.78 | 5.76 |
| All other text | passed | 5.4+ | 5.3+ |

Fixed in "Fix color contrast on the install page".

### 2. Non-text contrast (WCAG 1.4.11)

Outlines that are the only sign of a control's shape need 3:1 against what's around them.

| Control | Before | After: light | After: dark |
| --- | --- | --- | --- |
| Unselected chips | 1.4 | 3.45 | 3.77 |
| "Or type your own" field | 1.4 | 3.45 | 3.77 |
| "Copy bookmarklet code" button | 1.4 | 3.45 | 3.77 |

Fixed in the same commit.

### 3. Structure and names (WCAG 1.3.1, 2.4.6, 3.1.1, 4.1.2)

| Check | Result |
| --- | --- |
| Page language set (`lang="en"`) | Pass |
| Zoom not blocked by the viewport tag | Pass |
| One `<main>`; footer outside it | Pass after "Move the footer outside `<main>`" (it was inside) |
| Heading order: one H1, H2 sections, H3 sub-sections | Pass |
| Chips are `<button>`s with `aria-pressed`, grouped under "Icon" / "Name" | Pass |
| Custom-name field and code box have labels | Pass |
| Images have `alt`; sample table has header cells | Pass |

### 4. Keyboard (WCAG 2.1.1, 2.4.3, 2.4.7, 2.5.7)

Tabbed through the whole page with a real keyboard.

| Check | Result |
| --- | --- |
| Every control reachable, in reading order | Pass |
| Visible focus ring on chips, field, links and the drag button | Pass |
| Install without dragging | **Fail**: dragging needs a mouse, and pressing Enter on the button only shows "drag this" ([#1](https://github.com/tuckbick/copy-as-markdown/issues/1)) |
| Disabled "None" chip | Skipped by Tab with no explanation ([#2](https://github.com/tuckbick/copy-as-markdown/issues/2)) |

### 5. Reflow (WCAG 1.4.10)

At a 320px-wide window nothing scrolls sideways and nothing is cut off. Pass.

### 6. Bookmarklet UI (reviewed in code, not tested with assistive technology)

| Check | Result |
| --- | --- |
| "Copied as Markdown" notice announced to screen readers (WCAG 4.1.3) | **Fail**: no live region ([#3](https://github.com/tuckbick/copy-as-markdown/issues/3)) |
| Fallback copy box is an accessible dialog: role, name, focus kept inside, focus returned on close (WCAG 4.1.2, 2.4.3) | **Fail** ([#4](https://github.com/tuckbick/copy-as-markdown/issues/4)) |

### Not tested yet

- An automated scan (axe-core or Lighthouse), and real screen readers (VoiceOver, NVDA),
  in Chrome, Firefox and Safari ([#5](https://github.com/tuckbick/copy-as-markdown/issues/5)).

## Re-running the checks

[`scripts/a11y-check.js`](../scripts/a11y-check.js) runs checks 1, 2, 3 and 5 in the browser:

1. Serve the repo: `python3 -m http.server 8767`, and open http://localhost:8767/.
2. Open the developer console, paste the contents of `scripts/a11y-check.js`, and press Enter.
3. Read `textFailures` (should be empty), `outlines` (all `pass: true`), `structure` and `reflow`.
4. Switch to dark mode (devtools: Rendering → Emulate CSS `prefers-color-scheme: dark`) and run it
   again. For reflow, also run it with the window 320px wide.

Keyboard checks (section 4) are manual: Tab through the page and confirm every control is
reachable, focus is always visible, and the order follows the page.

Re-run these after changing colors, layout or controls on the install page, and update this
file with the results.
