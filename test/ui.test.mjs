// Accessibility behavior of the bookmarklet's on-page UI: the notice (toast) and
// the fallback copy dialog. See docs/accessibility.md, issues #3 and #4.
//
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const SRC = readFileSync(new URL('../bookmarklet.js', import.meta.url), 'utf8');

function page () {
  const dom = new JSDOM('<!doctype html><body><button id="before">page button</button><p>text</p></body>', {
    url: 'https://example.com/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  dom.window.__MD_TEST__ = true;
  dom.window.eval(SRC);
  return dom;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function key (target, name, opts = {}) {
  const e = new target.ownerDocument.defaultView.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...opts });
  target.dispatchEvent(e);
  return e;
}

test('success notice is a polite status message with its text', async () => {
  const { window } = page();
  const d = window.__ui.toast('Copied as Markdown (3 lines)');
  assert.equal(d.getAttribute('role'), 'status');
  assert.equal(d.getAttribute('aria-live'), 'polite');
  assert.equal(d.getAttribute('aria-atomic'), 'true');
  // Text is added after the live region is in the page, so it gets announced.
  assert.equal(d.textContent, '');
  assert.ok(window.document.body.contains(d));
  await wait(80);
  assert.equal(d.textContent, 'Copied as Markdown (3 lines)');
});

test('error notice is an alert', () => {
  const { window } = page();
  const d = window.__ui.toast('Select some text first, then click the bookmarklet.', true);
  assert.equal(d.getAttribute('role'), 'alert');
  assert.equal(d.getAttribute('aria-live'), 'assertive');
});

test('fallback dialog has a role, name and description', () => {
  const { window } = page();
  const ui = window.__ui.manual('# Hello');
  const { document } = window;
  assert.equal(ui.dialog.getAttribute('role'), 'dialog');
  assert.equal(ui.dialog.getAttribute('aria-modal'), 'true');
  assert.equal(document.getElementById(ui.dialog.getAttribute('aria-labelledby')).textContent, 'Copy as Markdown');
  assert.match(document.getElementById(ui.dialog.getAttribute('aria-describedby')).textContent, /blocked clipboard access/);
  assert.equal(ui.textarea.getAttribute('aria-label'), 'Markdown');
  assert.equal(ui.textarea.value, '# Hello');
  assert.equal(ui.close.textContent, 'Close');
  assert.equal(ui.close.getAttribute('type'), 'button');
});

test('fallback dialog focuses and selects the Markdown', () => {
  const { window } = page();
  const ui = window.__ui.manual('some markdown');
  assert.equal(window.document.activeElement, ui.textarea);
  assert.equal(ui.textarea.selectionStart, 0);
  assert.equal(ui.textarea.selectionEnd, 'some markdown'.length);
});

test('Tab and Shift+Tab stay inside the dialog', () => {
  const { window } = page();
  const ui = window.__ui.manual('x');
  ui.close.focus();
  const forward = key(ui.close, 'Tab');
  assert.ok(forward.defaultPrevented);
  assert.equal(window.document.activeElement, ui.textarea);
  const back = key(ui.textarea, 'Tab', { shiftKey: true });
  assert.ok(back.defaultPrevented);
  assert.equal(window.document.activeElement, ui.close);
});

test('Escape closes the dialog and returns focus', () => {
  const { window } = page();
  const before = window.document.getElementById('before');
  before.focus();
  const ui = window.__ui.manual('x');
  key(ui.textarea, 'Escape');
  assert.ok(!window.document.body.contains(ui.overlay));
  assert.equal(window.document.activeElement, before);
});

test('Close button closes the dialog and returns focus', () => {
  const { window } = page();
  const before = window.document.getElementById('before');
  before.focus();
  const ui = window.__ui.manual('x');
  ui.close.click();
  assert.ok(!window.document.body.contains(ui.overlay));
  assert.equal(window.document.activeElement, before);
});

test('clicking outside closes; clicking inside does not', () => {
  const { window } = page();
  const ui = window.__ui.manual('x');
  ui.textarea.click();
  assert.ok(window.document.body.contains(ui.overlay));
  ui.overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.ok(!window.document.body.contains(ui.overlay));
});
