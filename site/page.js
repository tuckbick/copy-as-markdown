// The install page's script: the icon/name picker and the "Add it by hand" code box.
// build.mjs inlines it into index.html. The choices come from the JSON config block
// on the page (EMOJIS and NAMES in site/content.mjs).
(function () {
  var config = JSON.parse(document.getElementById('config').textContent);
  var EMOJIS = config.emojis;
  var NAMES = config.names;
  var KEY = 'copy-as-markdown:name';
  var state = { emoji: EMOJIS[0], name: NAMES[0] };
  // A label needs an emoji or a name (or both): "None" is disabled in one row
  // while the other row is on "None".
  function valid (s) {
    return s && typeof s.emoji === 'string' && typeof s.name === 'string' && (s.emoji || s.name.trim());
  }
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (valid(saved)) state = saved;
  } catch (e) {}

  var drag = document.getElementById('drag');
  var custom;

  function label() { return [state.emoji, state.name.trim()].filter(Boolean).join(' '); }

  function render() {
    drag.textContent = label();
    document.querySelectorAll('.current-name').forEach(function (el) { el.textContent = label(); });
    document.querySelectorAll('#emojis .chip').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.value === state.emoji));
      b.disabled = !b.dataset.value && !state.name.trim();
    });
    var preset = NAMES.indexOf(state.name) >= 0;
    document.querySelectorAll('#names .chip').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.value === state.name));
      b.disabled = !b.dataset.value && !state.emoji;
    });
    if (custom && !preset && document.activeElement !== custom) custom.value = state.name;
    if (custom && preset && document.activeElement !== custom) custom.value = '';
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function chip(parent, value, text, key) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.value = value;
    b.textContent = text;
    b.addEventListener('click', function () { state[key] = value; render(); });
    parent.appendChild(b);
  }

  var emojiBox = document.getElementById('emojis');
  EMOJIS.forEach(function (e) { chip(emojiBox, e, e || 'None', 'emoji'); });
  var nameBox = document.getElementById('names');
  NAMES.forEach(function (n) { chip(nameBox, n, n || 'None', 'name'); });

  custom = document.createElement('input');
  custom.className = 'custom';
  custom.placeholder = 'Or type your own';
  custom.setAttribute('aria-label', 'Custom name');
  custom.maxLength = 40;
  custom.addEventListener('input', function () {
    state.name = custom.value.trim() ? custom.value : NAMES[0];
    render();
  });
  nameBox.appendChild(custom);
  render();
})();

// The code box is filled from the drag button's link when opened, so the
// ~22 KB bookmarklet isn't in the page twice (it would drown out the page's
// text for search engines).
function fillCode () {
  var ta = document.getElementById('code');
  if (!ta.value) ta.value = document.getElementById('drag').getAttribute('href');
  return ta;
}
document.getElementById('code-details').addEventListener('toggle', function () { if (this.open) fillCode(); });

document.getElementById('copybtn').addEventListener('click', function () {
  var ta = fillCode();
  ta.select();
  var done = function () { this.textContent = 'Copied!'; }.bind(this);
  if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
  else { document.execCommand('copy'); done(); }
});
