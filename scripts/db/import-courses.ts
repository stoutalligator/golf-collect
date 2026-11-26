// Imports researched course data (src/data/seed/courses.*.json) and the sim courses into Supabase.
// Idempotent: upserts by primary key, so re-run it after every `build-ct-seed` rebuild.
//
//   npm run db:import-courses
//
// Needs EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env. The service-role key bypasses
// row-level security, so this runs only on your machine and never ships in the app.
import { readdirSync, readFileSync } from 'node:fs';
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

type SeedTee = { id: string; name: string; par: number; totalYards: number; yardages: number[] | null; ratings: { men?: { rating: number; slope: number }; women?: { rating: number; slope: number } } };
type SeedCourse = {
  id: string; name: string; city: string; state: string; county?: string; region: string; biome?: string; biomeSource?: unknown;
  access: string; location: { lat: number; lng: number }; website?: string; architect?: string; yearOpened?: number; description: string;
  holes: { number: number; par: number; handicap: number }[]; tees: SeedTee[]; tags?: string[];
  verification: { status: string; sources: { name: string; url: string; checked: string; license?: string }[]; notes: string[] };
};

const seedDir = join(import.meta.dirname, '..', '..', 'src', 'data', 'seed');
const files = readdirSync(seedDir).filter((f) => /^courses\..+\.json$/.test(f));
const courses: SeedCourse[] = files.flatMap((f) => JSON.parse(readFileSync(join(seedDir, f), 'utf8')).courses);

async function run<T>(label: string, p: PromiseLike<{ error: { message: string } | null; data?: T }>) {
  const { error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
}

const checkedOn = (c: SeedCourse) => c.verification.sources.map((s) => s.checked).sort().at(-1)!;

await run('courses', db.from('courses').upsert(courses.map((c) => ({
  id: c.id, name: c.name, city: c.city, state: c.state, county: c.county ?? null, region: c.region,
  biome: c.biome ?? null, biome_source: c.biomeSource ?? null, access: c.access,
  lat: c.location.lat, lng: c.location.lng, website: c.website ?? null, architect: c.architect ?? null,
  year_opened: c.yearOpened ?? null, description: c.description,
  verification_status: c.verification.status, verification_notes: c.verification.notes,
  checked_on: checkedOn(c), tags: c.tags ?? [],
}))));

await run('course_holes', db.from('course_holes').upsert(courses.flatMap((c) =>
  c.holes.map((h) => ({ course_id: c.id, number: h.number, par: h.par, handicap: h.handicap })))));

await run('course_tees', db.from('course_tees').upsert(courses.flatMap((c) => c.tees.map((t, i) => ({
  course_id: c.id, id: t.id, name: t.name, par: t.par, total_yards: t.totalYards, hole_yardages: t.yardages,
  rating_men: t.ratings.men?.rating ?? null, slope_men: t.ratings.men?.slope ?? null,
  rating_women: t.ratings.women?.rating ?? null, slope_women: t.ratings.women?.slope ?? null, sort_order: i,
})))));

// Sources have no natural key: replace each imported course's set.
const ids = courses.map((c) => c.id);
await run('course_sources (clear)', db.from('course_sources').delete().in('course_id', ids));
await run('course_sources', db.from('course_sources').insert(courses.flatMap((c) =>
  c.verification.sources.map((s) => ({ course_id: c.id, name: s.name, url: s.url, license: s.license ?? null, checked_on: s.checked })))));

await run('sim_courses', db.from('sim_courses').upsert(SIM_COURSES.map((s) => ({ id: s.id, name: s.name, platform: s.platform ?? null, holes: s.holes }))));

const holes = courses.reduce((n, c) => n + c.holes.length, 0);
const tees = courses.reduce((n, c) => n + c.tees.length, 0);
console.log(`Imported ${courses.length} courses (${holes} holes, ${tees} tees) from ${files.join(', ')} and ${SIM_COURSES.length} sim courses.`);
