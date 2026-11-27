// Builds src/data/seed/courses.<st>.json from OpenGolfAPI (ODbL 1.0) + manual overrides.
// Usage: node scripts/courses/build-ct-seed.mjs [--state MA] [--refresh]     (default state: CT)
// Reads scripts/courses/<st>-courses.json. Raw API responses are cached in scripts/courses/.cache (gitignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const cacheDir = join(here, '.cache');
const stateArg = process.argv.indexOf('--state');
const STATE = (stateArg > 0 ? process.argv[stateArg + 1] : 'CT').toUpperCase();
const st = STATE.toLowerCase();
const outFile = join(root, 'src', 'data', 'seed', `courses.${st}.json`);
const API = 'https://api.opengolfapi.org';
const UA = { 'User-Agent': 'course-research-client' };
const refresh = process.argv.includes('--refresh');
const YARDAGE_TOLERANCE = 0.015; // hole sum vs. stated tee total

const config = JSON.parse(readFileSync(join(here, `${st}-courses.json`), 'utf8'));
const { regions } = JSON.parse(readFileSync(join(root, 'src', 'data', 'config', 'regions.json'), 'utf8'));
const regionFor = (state) => {
  const r = regions.find((x) => x.states.includes(state));
  if (!r) throw new Error(`No region for state ${state}`);
  return r.id;
};
mkdirSync(cacheDir, { recursive: true });

async function getJson(url, cacheName) {
  const file = join(cacheDir, cacheName);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const json = await res.json();
  writeFileSync(file, JSON.stringify(json, null, 2));
  return json;
}

async function stateIndex() {
  const all = [];
  for (let offset = 0; ; offset += 100) {
    const page = await getJson(`${API}/v1/courses/state/${STATE}?offset=${offset}&limit=100`, `${st}-${offset}.json`);
    all.push(...page.courses);
    if (all.length >= page.total || page.courses.length === 0) break;
  }
  return all;
}

const ACCESS = {
  'public': 'public', 'public/municipal': 'municipal', 'municipal': 'municipal',
  'semi-private': 'semi-private', 'private': 'private',
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const sum = (a) => a.reduce((x, y) => x + y, 0);

function assertCard(id, par, handicap) {
  if (par.length !== 18) throw new Error(`${id}: expected 18 holes, got ${par.length}`);
  const si = [...handicap].sort((a, b) => a - b).join(',');
  if (si !== Array.from({ length: 18 }, (_, i) => i + 1).join(',')) throw new Error(`${id}: stroke index is not 1..18`);
  if (par.some((p) => p < 3 || p > 6)) throw new Error(`${id}: implausible par`);
}

function describe(c) {
  const access = { public: 'Public', municipal: 'Municipal', 'semi-private': 'Semi-private', private: 'Private' }[c.access];
  const maxYards = Math.max(...c.tees.map((t) => t.totalYards));
  const parts = [`${access} 18-hole course in ${c.city}, par ${sum(c.holes.map((h) => h.par))}, playing up to ${maxYards.toLocaleString('en-US')} yards`];
  if (c.architect) parts.push(`designed by ${c.architect}`);
  if (c.yearOpened) parts.push(`dating to ${c.yearOpened}`);
  return parts.join(', ') + '.';
}

// The state index is fetched only if some entry uses OpenGolfAPI (card-only states make no API calls).
let byName;
const courses = [];

for (const entry of config.courses) {
  // Card-only course (not in OpenGolfAPI): the override supplies the whole card plus city and location.
  let d = { holes_data: [], tees: [] };
  const sources = [];
  if (entry.ogapi) {
    byName ??= new Map((await stateIndex()).map((c) => [c.name, c]));
    const hit = byName.get(entry.ogapi);
    if (!hit) throw new Error(`Not in OpenGolfAPI ${STATE} index: ${entry.ogapi}`);
    d = await getJson(`${API}/api/v1/courses/${hit.id}`, `${hit.id}.json`);
    sources.push({
      name: 'OpenGolfAPI', url: `${API}/api/v1/courses/${hit.id}`, checked: config.checked,
      license: 'ODbL-1.0 — © OpenStreetMap contributors via OpenGolfAPI',
    });
  } else if (!entry.override || !config.overrides[entry.override]?.location || !entry.access) {
    throw new Error(`${entry.id}: without "ogapi" it needs an override with city and location, and a confirmed access`);
  }
  const notes = [];
  let status = 'single-source';

  let par = d.holes_data.map((h) => h.par);
  let handicap = d.holes_data.map((h) => h.handicap_index);

  // Group OGAPI tee rows (one per gender) into tees.
  const teeMap = new Map();
  for (const t of d.tees) {
    const id = slug(t.tee_name);
    const tee = teeMap.get(id) ?? { id, name: titleCase(t.tee_name), par: t.par, totalYards: t.yardage, yardages: null, ratings: {} };
    tee.ratings[t.gender === 'Female' ? 'women' : 'men'] = { rating: t.course_rating, slope: t.slope };
    teeMap.set(id, tee);
  }
  for (const tee of teeMap.values()) {
    const ys = d.holes_data.map((h) => h.yardages?.[tee.id] ?? h.yardages?.[tee.name.toLowerCase()]);
    if (ys.every((y) => typeof y === 'number' && y > 0)) {
      const diff = Math.abs(sum(ys) - tee.totalYards) / tee.totalYards;
      if (diff <= YARDAGE_TOLERANCE) {
        tee.yardages = ys;
        if (sum(ys) !== tee.totalYards) notes.push(`${tee.name}: hole yardages sum to ${sum(ys)} vs. stated ${tee.totalYards}.`);
      } else {
        notes.push(`${tee.name}: hole yardages sum to ${sum(ys)} vs. stated ${tee.totalYards}; hole breakdown omitted.`);
      }
    }
  }
  let tees = [...teeMap.values()];

  const ov = entry.override && config.overrides[entry.override];
  if (ov) {
    par = ov.par;
    handicap = ov.handicap;
    tees = ov.tees.map((t) => ({ id: t.id, name: t.name, par: sum(ov.par), totalYards: sum(t.yardages), yardages: t.yardages, ratings: t.ratings }));
    sources.push({ ...ov.source, checked: config.checked });
    for (const s of ov.extraSources ?? []) sources.push({ ...s, checked: config.checked });
    notes.splice(0, notes.length, ov.note);
    status = ov.status;
  }
  if (entry.crossCheck) {
    sources.push({ name: entry.crossCheck.name, url: entry.crossCheck.url, checked: config.checked });
    notes.push(`Cross-checked: ${entry.crossCheck.matched}.`);
    if (status === 'single-source') status = 'cross-checked';
  }
  if (entry.accessSource) {
    sources.push({ name: entry.accessSource.name, url: entry.accessSource.url, checked: config.checked });
    notes.push(entry.accessSource.note + '.');
  }

  assertCard(entry.id, par, handicap);
  if (sum(par) !== d.par && !ov) notes.push(`Hole pars sum to ${sum(par)}; source lists ${d.par}.`);
  // Overrides may also correct listing facts (null drops a value we can't confirm).
  const fact = (key, fallback) => (ov && key in ov ? ov[key] ?? undefined : fallback);

  const course = {
    id: entry.id,
    name: entry.name,
    city: fact('city', d.city),
    state: STATE,
    county: entry.county,
    region: regionFor(STATE),
    ...(entry.biome ? { biome: entry.biome, biomeSource: entry.biomeSource } : {}),
    access: entry.access ?? ACCESS[String(d.type).toLowerCase()] ?? 'public',
    location: fact('location', { lat: d.lat, lng: d.lng }),
    website: fact('website', d.website?.replace(/\?utm.*$/, '') || undefined),
    architect: fact('architect', d.architect || undefined),
    yearOpened: fact('yearOpened', d.year_built || undefined),
    description: '',
    holes: par.map((p, i) => ({ number: i + 1, par: p, handicap: handicap[i] })),
    tees: tees.sort((a, b) => b.totalYards - a.totalYards),
    verification: { status, sources, notes },
  };
  course.description = describe(course);
  courses.push(course);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({
  _attribution: '© OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI — https://opengolfapi.org/attribution',
  generated: config.checked,
  courses,
}, null, 2) + '\n');

for (const c of courses) {
  const withHoles = c.tees.filter((t) => t.yardages).length;
  console.log(`${c.verification.status.padEnd(14)} ${c.name.padEnd(34)} ${c.access.padEnd(12)} tees ${c.tees.length} (${withHoles} w/ hole yds)`);
}
console.log(`\nWrote ${courses.length} courses → ${outFile}`);
