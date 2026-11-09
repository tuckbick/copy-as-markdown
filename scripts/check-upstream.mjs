// Checks whether Turndown or turndown-plugin-gfm have changed since the versions
// recorded in upstream.json (the versions bookmarklet.js is ported from).
//
// Usage: node scripts/check-upstream.mjs [--out report.md]
// Prints a Markdown report. In GitHub Actions it also sets the step output
// `updates=true|false`. Set GITHUB_TOKEN to avoid API rate limits.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const upstream = JSON.parse(readFileSync(new URL('upstream.json', root), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'copy-as-markdown-upstream-check' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh (path) {
  const res = await fetch(`https://api.github.com/${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function npmLatest (name) {
  const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
  return res.ok ? (await res.json()).version : null;
}

const lines = [];
let updates = false;

for (const [name, info] of Object.entries(upstream)) {
  const release = await gh(`repos/${info.repo}/releases/latest`);
  const repo = await gh(`repos/${info.repo}`);
  const head = await gh(`repos/${info.repo}/commits/${repo.default_branch}`);
  const releaseCommit = release ? (await gh(`repos/${info.repo}/commits/${release.tag_name}`)).sha : null;

  // A package is "ahead" when its latest release or its default branch has moved
  // past the recorded commit.
  const targets = [];
  if (releaseCommit && releaseCommit !== info.commit) targets.push({ label: `release ${release.tag_name}`, sha: releaseCommit });
  if (head.sha !== info.commit && head.sha !== releaseCommit) targets.push({ label: `${repo.default_branch} @ ${head.sha.slice(0, 7)}`, sha: head.sha });

  lines.push(`## ${name}`, '', `Ported from **${info.version}** (\`${info.commit.slice(0, 7)}\`). Latest release: **${release ? release.tag_name : 'none'}**.`, '');

  // Ignore targets that are behind or equal to the recorded commit
  // (e.g. an old release when the port tracks a newer branch commit).
  const ahead = [];
  for (const t of targets) {
    const cmp = await gh(`repos/${info.repo}/compare/${info.commit}...${t.sha}`);
    if (cmp.ahead_by > 0) ahead.push({ ...t, cmp });
  }

  if (!ahead.length) {
    lines.push('Up to date.', '');
    continue;
  }

  for (const t of ahead) {
    const cmp = t.cmp;
    const changed = (cmp.files || []).map((f) => f.filename);
    const tracked = changed.filter((f) => info.files.includes(f));
    if (tracked.length) updates = true;
    lines.push(
      `### ${t.label}: ${cmp.ahead_by} new commit(s)`,
      '',
      `Compare: ${cmp.html_url}`,
      '',
      tracked.length
        ? `Ported files that changed (review these):\n${tracked.map((f) => `- \`${f}\``).join('\n')}`
        : 'None of the ported files changed (nothing to port).',
      ''
    );
    if (changed.length > tracked.length) {
      lines.push(`Other changed files: ${changed.filter((f) => !tracked.includes(f)).map((f) => `\`${f}\``).join(', ')}`, '');
    }
  }
}

// npm versions used by the parity tests.
const npmLines = [];
for (const dep of ['turndown', 'turndown-plugin-gfm']) {
  const latest = await npmLatest(dep);
  const pinned = pkg.devDependencies[dep];
  if (latest && latest !== pinned) {
    updates = true;
    npmLines.push(`- \`${dep}\`: tests pin ${pinned}, npm latest is ${latest}`);
  }
}
if (npmLines.length) lines.push('## npm (parity tests)', '', ...npmLines, '');

const report = `# Upstream check\n\n${updates ? '**Updates to review.** Ask Claude: "Update from Turndown" (see AGENTS.md).' : 'No upstream changes to port.'}\n\n${lines.join('\n')}`;
console.log(report);

const outIdx = process.argv.indexOf('--out');
if (outIdx > -1) writeFileSync(process.argv[outIdx + 1], report);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `updates=${updates}\n`);
