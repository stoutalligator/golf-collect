// Art pipeline helper.
//   node scripts/art/art.mjs prompts  → create region/override prompt files, compile paste-ready prompts
//   node scripts/art/art.mjs sync     → register finished images in assets/art with the app
//
// Shared art model: heroes/engravings/vignettes per REGION, standard collectible FRAMES (course name
// drawn by the app), plus optional one-off OVERRIDES listed in src/data/config/art-overrides.json.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const promptsDir = join(root, 'assets', '_prompts');
const compiledDir = join(promptsDir, 'compiled');
const artDir = join(root, 'assets', 'art');
const registryFile = join(root, 'src', 'art', 'registry.generated.ts');
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i;
const posix = (p) => p.split(sep).join('/');
const readJson = (...p) => JSON.parse(readFileSync(join(root, ...p), 'utf8'));

function walk(dir, filter) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, filter) : filter(p) ? [p] : [];
  });
}

function fencedBlocks(text, lang) {
  const out = {};
  const re = new RegExp('```' + lang + '\\s*(\\w*)\\r?\\n([\\s\\S]*?)\\r?\\n```', 'g');
  for (const m of text.matchAll(re)) out[m[1]] = m[2].trim();
  return out;
}

function parseVars(text) {
  const vars = {};
  const body = text.match(/```vars\r?\n([\s\S]*?)\r?\n```/)?.[1] ?? '';
  for (const line of body.split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return vars;
}

const promptFiles = () =>
  walk(promptsDir, (p) => p.endsWith('.md'))
    .filter((p) => !p.startsWith(compiledDir) && !/(_style|_template|README)\.md$/.test(p));

/** Every `Save as:` path declared in prompt files. */
export function expectedOutputs() {
  return promptFiles().flatMap((f) =>
    [...readFileSync(f, 'utf8').matchAll(/\*\*Save as:\*\*\s*`([^`]+)`/g)].map((m) => ({ path: m[1], from: posix(relative(root, f)) })));
}

const shortName = (name) => name.replace(/\s*\(.*\)$/, '').replace(/\s+(Golf Course|Golf Club|Golf Links|Country Club|Course)$/i, '').trim();

/** Mirrors collectiblesFor() in src/domain/collection.ts. */
function collectiblesFor(courseId, cfg) {
  const custom = cfg.courses[courseId];
  let set = cfg.default.map((d) => ({ ...d }));
  if (!custom) return set;
  if (custom.remove) set = set.filter((d) => !custom.remove.includes(d.id));
  if (custom.override) set = set.map((d) => (custom.override[d.id] ? { ...d, ...custom.override[d.id], id: d.id } : d));
  if (custom.add) set = [...set, ...custom.add.filter((a) => !set.some((d) => d.id === a.id))];
  return set;
}

const KIND_PROMPTS = {
  'ball-marker': 'A single golf ball marker coin. The round enamel face shows {{SCENE}}. Polished metal rim with the words "{{SHORT_NAME}}" engraved around the edge.',
  'bag-tag': 'A single golf bag tag: a rounded rectangle of deep forest green stitched leather with a leather strap loop at the top, a small embossed gold emblem, and the words "{{SHORT_NAME}}" embossed in gold serif capitals.',
  'pitch-marker': 'A single brass golf pitch marker divot repair tool with two prongs, standing upright. The round head carries a small enamel painting of {{SCENE}}.',
  patch: 'A single embroidered patch shaped like a rounded shield, stitched gold border, embroidered scene of {{SCENE}}, with the words "{{SHORT_NAME}}" embroidered in cream capitals on a banner across the bottom.',
  pin: 'A single enamel lapel pin inspired by {{SCENE}}, gold metal edges, glossy enamel, small and charming.',
};

const section = (title, path, size, body) =>
  ['', `## ${title}`, '', `- **Save as:** \`${path}\``, `- **Size:** ${size}`, '', '```prompt', ...body, '{{NEGATIVE}}', '```', ''].join('\n');

/** One prompt file per region that has courses. Never overwrites edits. */
function createRegionFiles(courses) {
  const { regions } = readJson('src', 'data', 'config', 'regions.json');
  const template = readFileSync(join(promptsDir, 'regions', '_template.md'), 'utf8');
  let created = 0;
  for (const r of regions) {
    const count = courses.filter((c) => c.region === r.id).length;
    const file = join(promptsDir, 'regions', `${r.id}.md`);
    if (!count || existsSync(file)) continue;
    const text = template
      .replaceAll('{{REGION_NAME}}', r.name)
      .replaceAll('{{REGION_ID}}', r.id)
      .replaceAll('{{STATES}}', r.states.join(', '))
      .replaceAll('{{COURSE_COUNT}}', String(count))
      .replace('SCENE: {{REGION_SCENE}}', `SCENE: ${r.scene}`);
    writeFileSync(file, text);
    created++;
  }
  return created;
}

/** One prompt file per course listed in art-overrides.json. Missing sections are appended, never rewritten. */
function createOverrideFiles(courses) {
  const overrides = readJson('src', 'data', 'config', 'art-overrides.json').courses;
  const cfg = readJson('src', 'data', 'config', 'collectibles.json');
  const template = readFileSync(join(promptsDir, 'overrides', '_template.md'), 'utf8');
  let touched = 0;
  for (const [courseId, o] of Object.entries(overrides)) {
    if (courseId.startsWith('_')) continue;
    const c = courses.find((x) => x.id === courseId);
    if (!c) {
      console.warn(`⚠ art-overrides.json lists unknown course "${courseId}"`);
      continue;
    }
    const file = join(promptsDir, 'overrides', `${c.id}.md`);
    let text = existsSync(file)
      ? readFileSync(file, 'utf8')
      : template
        .replaceAll('{{COURSE_NAME}}', c.name)
        .replace('{{COURSE_FACTS}}', `*${c.city}, ${c.state} · ${c.access}. Course id \`${c.id}\`.*`)
        .replace('SHORT_NAME: {{SHORT_NAME}}', `SHORT_NAME: ${shortName(c.name)}`);
    const before = text;
    const add = (path, sec) => { if (!text.includes(path)) text = text.trimEnd() + '\n' + sec; };
    if (o.hero) {
      const p = `assets/art/courses/${c.id}/hero.png`;
      add(p, section('Destination hero', p, '1290×860 PNG (3:2); top third calm, subject in the middle band', ['{{PAINTERLY}}', 'Wide landscape of {{SCENE}}. Eye-level view, generous open sky in the upper third.']));
    }
    if (o.scorecardEngraving) {
      const p = `assets/art/courses/${c.id}/scorecard-engraving.png`;
      add(p, section('Scorecard engraving', p, '1200×400 PNG, transparent', ['{{ENGRAVED}}', 'A panoramic engraving of {{SCENE}}, low horizon, wide format, isolated on a transparent background.']));
    }
    const set = collectiblesFor(c.id, cfg);
    for (const id of o.collectibles ?? []) {
      const def = set.find((d) => d.id === id);
      if (!def) {
        console.warn(`⚠ ${c.id}: art override for unknown collectible "${id}"`);
        continue;
      }
      const p = `assets/art/courses/${c.id}/collectibles/${id}.png`;
      add(p, section(`${def.name} (complete one-off ${def.kind.replace('-', ' ')})`, p, '1024×1024 PNG, transparent; the full finished item (no layers added by the app)', ['{{PAINTERLY}}', KIND_PROMPTS[def.kind], '{{OBJECT}}']));
    }
    if (text !== before) {
      writeFileSync(file, text);
      touched++;
    }
  }
  return touched;
}

function compile() {
  const courses = readJson('src', 'data', 'seed', 'courses.ct.json').courses;
  const regions = createRegionFiles(courses);
  const overrides = createOverrideFiles(courses);
  const blocks = fencedBlocks(readFileSync(join(promptsDir, '_style.md'), 'utf8'), 'block');
  const problems = [];
  for (const f of promptFiles()) {
    const src = readFileSync(f, 'utf8');
    const vars = parseVars(src);
    const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => blocks[k] ?? vars[k] ?? m);
    const out = src.replace(/```prompt\r?\n([\s\S]*?)\r?\n```/g, (_, body) => '```text\n' + fill(fill(body)).trim() + '\n```');
    for (const m of out.matchAll(/```text\n[\s\S]*?\{\{(\w+)\}\}[\s\S]*?```/g)) problems.push(`${posix(relative(root, f))}: unresolved {{${m[1]}}}`);
    const dest = join(compiledDir, relative(promptsDir, f));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, out);
  }
  const outputs = expectedOutputs();
  const index = ['# Compiled prompts: checklist', '', "*Generated by `npm run art:prompts`. Don't edit; edit the source files in `assets/_prompts/`.*", '', '| Done | Save as | Prompt file |', '|---|---|---|'];
  for (const o of outputs) {
    const rel = o.from.replace('assets/_prompts/', '');
    index.push(`| ${existsSync(join(root, o.path)) ? '✅' : '⬜'} | \`${o.path}\` | [${rel}](${rel}) |`);
  }
  writeFileSync(join(compiledDir, 'INDEX.md'), index.join('\n') + '\n');
  const done = outputs.filter((o) => existsSync(join(root, o.path))).length;
  console.log(`New prompt files: ${regions} region, ${overrides} override.`);
  console.log(`Compiled ${promptFiles().length} prompt files → assets/_prompts/compiled/  (${done}/${outputs.length} images done; see compiled/INDEX.md)`);
  for (const p of problems) console.warn('⚠ ' + p);
}

function sync() {
  const images = walk(artDir, (p) => IMAGE_EXT.test(p)).map((p) => posix(relative(artDir, p))).sort();
  const lines = [
    '// AUTO-GENERATED by `npm run art:sync`. Do not edit.',
    '// Maps art keys (path under assets/art, no extension) to bundled images.',
    '/* eslint-disable */',
    'export const ART_REGISTRY = {',
    ...images.map((p) => `  '${p.replace(IMAGE_EXT, '')}': require('../../assets/art/${p}'),`),
    '} as const;',
    '',
  ];
  mkdirSync(dirname(registryFile), { recursive: true });
  writeFileSync(registryFile, lines.join('\n'));

  // App icon + splash are read by app.json from assets/images.
  for (const [from, to] of [['brand/app-icon.png', 'assets/images/icon.png'], ['brand/splash.png', 'assets/images/splash-icon.png']]) {
    if (existsSync(join(artDir, from))) {
      copyFileSync(join(artDir, from), join(root, to));
      console.log(`Copied assets/art/${from} → ${to}`);
    }
  }

  const expected = new Set(expectedOutputs().map((o) => o.path));
  const unexpected = images.filter((p) => !expected.has(`assets/art/${p}`));
  const missing = [...expected].filter((p) => !existsSync(join(root, p))).length;
  console.log(`Registered ${images.length} image(s) → src/art/registry.generated.ts (${missing} still to make)`);
  for (const p of unexpected) console.warn(`⚠ assets/art/${p} isn't named in any prompt file; check for a typo in the path`);
}

const cmd = process.argv[2];
if (cmd === 'prompts') compile();
else if (cmd === 'sync') sync();
else {
  console.log('Usage: node scripts/art/art.mjs <prompts|sync>');
  process.exit(1);
}
