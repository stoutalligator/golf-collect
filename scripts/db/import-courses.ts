// Imports researched course data and the sim courses into Supabase. Idempotent (upserts by primary key):
// re-run after rebuilding course data. New courses appear in the app on next launch; no app build needed.
//
//   npm run db:import-courses                 # every state file in data/courses/
//   npm run db:import-courses -- --state RI   # just these states
//
// Reads data/courses/<st>.json (built by scripts/courses/build-seed.mjs). If that folder is empty it falls back
// to the curated seeds in src/data/seed/. Needs EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env;
// the service-role key bypasses row-level security, so this runs only on your machine and never ships in the app.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { SIM_COURSES } from '../../src/data/sample/sim-courses.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

type SeedTee = { id: string; name: string; par: number; totalYards: number; yardages: number[] | null; ratedHoles?: 9 | 18; ratings: { men?: { rating: number; slope: number }; women?: { rating: number; slope: number } } };
type SeedCourse = {
  id: string; name: string; city: string; state: string; county?: string; region: string; biome?: string; biomeSource?: unknown;
  access: string; location: { lat: number; lng: number }; website?: string; architect?: string; yearOpened?: number; description: string;
  holes: { number: number; par: number; handicap: number }[]; tees: SeedTee[]; tags?: string[];
  verification: { status: string; sources: { name: string; url: string; checked: string; license?: string }[]; notes: string[] };
};

const root = join(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const only = new Set(args.flatMap((a, i) => (a === '--state' ? [args[i + 1].toLowerCase()] : [])));
const dataDir = join(root, 'data', 'courses');
const stateFiles = existsSync(dataDir)
  ? readdirSync(dataDir).filter((f) => /^[a-z]{2}\.json$/.test(f) && (!only.size || only.has(f.slice(0, 2)))).map((f) => join(dataDir, f))
  : [];
const seedDir = join(root, 'src', 'data', 'seed');
const files = stateFiles.length ? stateFiles : readdirSync(seedDir).filter((f) => /^courses\..+\.json$/.test(f)).map((f) => join(seedDir, f));
const courses: SeedCourse[] = files.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')).courses);

async function run(label: string, p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
}
async function inChunks<T>(label: string, rows: T[], size: number, write: (chunk: T[]) => PromiseLike<{ error: { message: string } | null }>) {
  for (let i = 0; i < rows.length; i += size) await run(`${label} ${i}`, write(rows.slice(i, i + size)));
}

const checkedOn = (c: SeedCourse) => c.verification.sources.map((s) => s.checked).sort().at(-1)!;

await inChunks('courses', courses.map((c) => ({
  id: c.id, name: c.name, city: c.city, state: c.state, county: c.county ?? null, region: c.region,
  biome: c.biome ?? null, biome_source: c.biomeSource ?? null, access: c.access,
  lat: c.location.lat, lng: c.location.lng, website: c.website ?? null, architect: c.architect ?? null,
  year_opened: c.yearOpened ?? null, description: c.description,
  verification_status: c.verification.status, verification_notes: c.verification.notes,
  checked_on: checkedOn(c), tags: c.tags ?? [],
  par: c.holes.reduce((s, h) => s + h.par, 0), hole_count: c.holes.length,
})), 500, (chunk) => db.from('courses').upsert(chunk));

await inChunks('course_holes', courses.flatMap((c) =>
  c.holes.map((h) => ({ course_id: c.id, number: h.number, par: h.par, handicap: h.handicap }))), 1000, (chunk) => db.from('course_holes').upsert(chunk));

await inChunks('course_tees', courses.flatMap((c) => c.tees.map((t, i) => ({
  course_id: c.id, id: t.id, name: t.name, par: t.par, total_yards: t.totalYards, hole_yardages: t.yardages,
  rating_men: t.ratings.men?.rating ?? null, slope_men: t.ratings.men?.slope ?? null,
  rating_women: t.ratings.women?.rating ?? null, slope_women: t.ratings.women?.slope ?? null, sort_order: i,
  rated_holes: t.ratedHoles ?? 18,
}))), 1000, (chunk) => db.from('course_tees').upsert(chunk));

// Sources have no natural key: replace each imported course's set.
const ids = courses.map((c) => c.id);
await inChunks('course_sources (clear)', ids, 200, (chunk) => db.from('course_sources').delete().in('course_id', chunk));
await inChunks('course_sources', courses.flatMap((c) =>
  c.verification.sources.map((s) => ({ course_id: c.id, name: s.name, url: s.url, license: s.license ?? null, checked_on: s.checked }))), 1000,
(chunk) => db.from('course_sources').insert(chunk));

await run('sim_courses', db.from('sim_courses').upsert(SIM_COURSES.map((s) => ({ id: s.id, name: s.name, platform: s.platform ?? null, holes: s.holes }))));

const holes = courses.reduce((n, c) => n + c.holes.length, 0);
const tees = courses.reduce((n, c) => n + c.tees.length, 0);
const byState = Object.entries(courses.reduce<Record<string, number>>((m, c) => ({ ...m, [c.state]: (m[c.state] ?? 0) + 1 }), {}))
  .map(([s, n]) => `${s} ${n}`).join(' · ');
console.log(`Imported ${courses.length} courses (${holes} holes, ${tees} tees): ${byState}; plus ${SIM_COURSES.length} sim courses.`);
