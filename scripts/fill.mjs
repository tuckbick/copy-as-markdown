// Fills {{name}} placeholders in a template. Throws on a placeholder with no value
// and on a value the template never uses, so a typo on either side fails the build.
export function fill (template, values) {
  const used = new Set();
  const out = template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    if (!Object.hasOwn(values, name)) throw new Error(`no value for {{${name}}}`);
    used.add(name);
    return String(values[name]);
  });
  const unused = Object.keys(values).filter((k) => !used.has(k));
  if (unused.length) throw new Error(`unused template values: ${unused.join(', ')}`);
  return out;
}
