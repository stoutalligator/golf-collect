// Builds whole-state course data from OpenGolfAPI (ODbL 1.0) for the database.
//
//   node scripts/courses/build-seed.mjs --region new-england      # all states in a region (regions.json)
//   node scripts/courses/build-seed.mjs --state MA --state RI     # specific states
//   add --refresh to re-fetch instead of using scripts/courses/.cache
//
// Output (not bundled into the app; pushed to Supabase by `npm run db:import-courses`):
//   data/courses/<st>.json           courses that pass every automated check
//   data/courses/<st>.excluded.json  everything left out, with the reason (never guessed into shape)
//
// Curated courses (scripts/courses/<st>-courses.json, built into src/data/seed/courses.<st>.json by
// build-ct-seed.mjs) are included as-is with their cross-checks and overrides; every other course is
// "single-source" (OpenGolfAPI only, automated checks pass). See .claude/skills/course-research.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  QuotaExhausted, ACCESS, ATTRIBUTION, cardProblem, courseDetail, describe, displayName, mapLimit, ogapiSource, regionFor, root, slug,
  stateIndex, statesInRegion, sum, teesFrom,
} from './lib.mjs';

const args = process.argv.slice(2);
const refresh = args.includes('--refresh');
const states = [
  ...args.flatMap((a, i) => (a === '--state' ? [args[i + 1].toUpperCase()] : [])),
  ...args.flatMap((a, i) => (a === '--region' ? statesInRegion(args[i + 1]) : [])),
];
if (!states.length) {
  console.error('Usage: node scripts/courses/build-seed.mjs --region new-england | --state MA [--state RI] [--refresh]');
  process.exit(1);
}

const outDir = join(root, 'data', 'courses');
mkdirSync(outDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);

// Ids already used by other states' output, so ids stay unique across the whole database.
const takenElsewhere = (state) => new Set(readdirSync(outDir)
  .filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== `${state.toLowerCase()}.json`)
  .flatMap((f) => JSON.parse(readFileSync(join(outDir, f), 'utf8')).courses.map((c) => c.id)));

const finished = [];
for (const state of states) {
  try {
    await buildState(state);
    finished.push(state);
  } catch (e) {
    if (!(e instanceof QuotaExhausted)) throw e;
    const left = states.filter((s) => !finished.includes(s));
    console.log(`Stopped: ${e.message}. Done: ${finished.join(', ') || 'none'}. Still to fetch: ${left.join(', ')}.`);
    console.log('Everything fetched so far is cached; re-run after the reset to continue.');
    process.exitCode = 3; // let open sockets close (process.exit() can crash Node on Windows here)
    break;
  }
}
if (finished.length === states.length) console.log(`All done: ${finished.join(', ')}.`);

async function buildState(state) {
  const index = await stateIndex(state, refresh);
  const region = regionFor(state);

  // Curated courses for this state (if any), already researched and built.
  const configFile = join(root, 'scripts', 'courses', `${state.toLowerCase()}-courses.json`);
  const seedFile = join(root, 'src', 'data', 'seed', `courses.${state.toLowerCase()}.json`);
  const curatedNames = existsSync(configFile) ? new Set(JSON.parse(readFileSync(configFile, 'utf8')).courses.map((c) => c.ogapi)) : new Set();
  const curated = existsSync(seedFile) ? JSON.parse(readFileSync(seedFile, 'utf8')).courses : [];

  const taken = takenElsewhere(state);
  curated.forEach((c) => taken.add(c.id));
  const uniqueId = (name, city) => {
    let id = slug(name);
    if (taken.has(id)) id = `${slug(name)}-${slug(city)}`;
    for (let n = 2; taken.has(id); n++) id = `${slug(name)}-${slug(city)}-${n}`;
    taken.add(id);
    return id;
  };

  const todo = index.filter((c) => !curatedNames.has(c.name));
  let done = 0;
  const results = await mapLimit(todo, 1, async (entry) => {
    const d = await courseDetail(entry.id, refresh);
    if (++done % 50 === 0) console.log(`  ${state}: ${done}/${todo.length} fetched`);
    const skip = (reason) => ({ excluded: { ogapiId: entry.id, name: entry.name, city: entry.city, holes: d?.holes ?? null, reason } });
    if (!d) return skip('no detail record');
    // Some records put "ST 06248" in the city field; read the town from the record's own street address instead.
    let city = d.city ?? entry.city;
    if (city && /\d/.test(city)) {
      const parts = String(d.address ?? '').split(',').map((p) => p.trim());
      const fromAddress = parts.length >= 3 ? parts[parts.length - 3] : '';
      city = fromAddress && !/\d/.test(fromAddress) ? fromAddress : null;
    }
    if (!city) return skip('missing town');
    d.city = city;
    if (!(d.course_name ?? entry.name)) return skip('missing name');
    if (d.holes && d.holes !== 18) return skip(`${d.holes}-hole course (only 18-hole cards are imported so far)`);
    const holes = d.holes_data ?? [];
    if (holes.length !== 18) return skip(`hole data has ${holes.length} holes`);
    const par = holes.map((h) => h.par);
    const handicap = holes.map((h) => h.handicap_index);
    const problem = cardProblem(par, handicap);
    if (problem) return skip(problem);
    const notes = [];
    const tees = teesFrom(d, notes);
    if (!tees.length) return skip('no tee data');
    if (!tees.some((t) => t.ratings.men || t.ratings.women)) notes.push('No course rating or slope published for any tee.');
    if (d.par && sum(par) !== d.par) notes.push(`Hole pars sum to ${sum(par)}; source lists ${d.par}.`);
    const access = ACCESS[String(d.type ?? entry.type ?? '').toLowerCase()];
    if (!access) return skip(`unknown access type "${d.type ?? entry.type}"`);
    notes.push('Access type from the OpenGolfAPI listing; not yet confirmed.');
    const name = displayName(d.course_name ?? entry.name);
    const course = {
      id: uniqueId(name, d.city ?? entry.city),
      name,
      city: d.city ?? entry.city,
      state,
      region,
      access,
      location: { lat: d.lat ?? entry.latitude, lng: d.lng ?? entry.longitude },
      website: d.website?.replace(/\?utm.*$/, '') || undefined,
      architect: d.architect || undefined,
      yearOpened: d.year_built || undefined,
      description: '',
      holes: par.map((p, i) => ({ number: i + 1, par: p, handicap: handicap[i] })),
      tees,
      verification: { status: 'single-source', sources: [ogapiSource(entry.id, today)], notes },
    };
    course.description = describe(course);
    return { course };
  });

  const courses = [...curated, ...results.flatMap((r) => (r.course ? [r.course] : []))].sort((a, b) => a.name.localeCompare(b.name));
  const excluded = results.flatMap((r) => (r.excluded ? [r.excluded] : [])).sort((a, b) => a.reason.localeCompare(b.reason) || a.name.localeCompare(b.name));
  writeFileSync(join(outDir, `${state.toLowerCase()}.json`), JSON.stringify({ _attribution: ATTRIBUTION, generated: today, state, courses }, null, 2) + '\n');
  writeFileSync(join(outDir, `${state.toLowerCase()}.excluded.json`), JSON.stringify({ generated: today, state, excluded }, null, 2) + '\n');

  const reasons = new Map();
  for (const e of excluded) {
    const key = e.reason.replace(/".*"/, '"…"').replace(/has \d+ holes$/, 'has the wrong number of holes').replace(/par \d+$/, 'par');
    reasons.set(key, (reasons.get(key) ?? 0) + 1);
  }
  console.log(`${state}: ${courses.length} courses (${curated.length} curated) · ${excluded.length} excluded of ${index.length} listed`);
  for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(4)}  ${reason}`);
}
