// Shared course-research helpers (OpenGolfAPI fetch + cache, scorecard checks, tee grouping, naming).
// Used by build-ct-seed.mjs (curated CT demo seed) and build-seed.mjs (whole states).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, '..', '..');
export const cacheDir = join(here, '.cache');
export const API = 'https://api.opengolfapi.org';
const UA = { 'User-Agent': 'course-research-client' };
export const YARDAGE_TOLERANCE = 0.015; // hole sum vs. stated tee total
export const ATTRIBUTION = '© OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI — https://opengolfapi.org/attribution';
export const OGAPI_LICENSE = 'ODbL-1.0 — © OpenStreetMap contributors via OpenGolfAPI';

mkdirSync(cacheDir, { recursive: true });

const { regions } = JSON.parse(readFileSync(join(root, 'src', 'data', 'config', 'regions.json'), 'utf8'));
export const regionFor = (state) => {
  const r = regions.find((x) => x.states.includes(state));
  if (!r) throw new Error(`No region for state ${state}`);
  return r.id;
};
export const statesInRegion = (id) => regions.find((r) => r.id === id)?.states ?? [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Pause before every network request (cache hits skip it). */
const PACE_MS = 350;

/** Thrown when the API's daily request quota is used up (500/day for OpenGolfAPI; resets at midnight UTC). */
export class QuotaExhausted extends Error {
  constructor(resetAt) {
    super(`OpenGolfAPI daily quota used up; resets ${resetAt ?? 'at midnight UTC'}`);
    this.resetAt = resetAt;
  }
}

/**
 * GET JSON with a permanent on-disk cache: once fetched, a record is never requested again unless `refresh`.
 * Polite retry/backoff on short 429/5xx; stops immediately when the daily quota is exhausted.
 */
export async function getJson(url, cacheName, refresh = false) {
  const file = join(cacheDir, cacheName);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; ; attempt++) {
    await sleep(PACE_MS);
    const res = await fetch(url, { headers: UA });
    if (res.ok) {
      const json = await res.json();
      writeFileSync(file, JSON.stringify(json, null, 2));
      return json;
    }
    if (res.status === 429 && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new QuotaExhausted(res.headers.get('x-ratelimit-reset'));
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 7) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 3000 * 2 ** attempt));
      continue;
    }
    throw new Error(`${res.status} ${url}`);
  }
}

export async function stateIndex(state, refresh = false) {
  const all = [];
  for (let offset = 0; ; offset += 100) {
    const page = await getJson(`${API}/v1/courses/state/${state}?offset=${offset}&limit=100`, `${state.toLowerCase()}-${offset}.json`, refresh);
    all.push(...page.courses);
    if (all.length >= page.total || page.courses.length === 0) break;
  }
  return all;
}

export const courseDetail = (id, refresh = false) => getJson(`${API}/api/v1/courses/${id}`, `${id}.json`, refresh);

/** Run `fn` over items with limited concurrency (be polite to the API). */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

export const ACCESS = {
  'public': 'public', 'public/municipal': 'municipal', 'municipal': 'municipal',
  'semi-private': 'semi-private', 'private': 'private', 'resort': 'public', 'public/resort': 'public',
};

export const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
export const sum = (a) => a.reduce((x, y) => x + y, 0);

/**
 * Display name from an OpenGolfAPI name. Multi-course clubs come as "Player At Lyman Orchards Golf Club" or
 * "1 At Ponkapoag Golf Club"; show them as "Lyman Orchards Golf Club (Player Course)" / "Ponkapoag Golf Club (Course 1)".
 */
export function displayName(name) {
  const m = /^(.+?) At (.+)$/.exec(name.trim());
  if (!m) return name.trim();
  const [, course, club] = m;
  const label = /^\d+$/.test(course) ? `Course ${course}` : /course$/i.test(course) ? course : `${course} Course`;
  return `${club} (${label})`;
}

/** Returns a reason string when the 18-hole scorecard fails a check, else null. */
export function cardProblem(par, handicap) {
  if (par.length !== 18) return `expected 18 holes, got ${par.length}`;
  if (par.some((p) => !Number.isInteger(p) || p < 3 || p > 6)) return 'implausible hole par';
  const si = [...handicap].sort((a, b) => a - b).join(',');
  if (si !== Array.from({ length: 18 }, (_, i) => i + 1).join(',')) return 'stroke index is not exactly 1–18';
  const total = sum(par);
  if (total < 54 || total > 76) return `implausible total par ${total}`;
  return null;
}

/** Group OpenGolfAPI tee rows (one per gender) into tees; hole yardages kept only when they add up. */
export function teesFrom(d, notes) {
  const teeMap = new Map();
  for (const t of d.tees ?? []) {
    if (!t.tee_name) continue;
    if (/9-hole/i.test(t.tee_name)) continue; // 9-hole rating rows don't describe the 18-hole card
    const name = titleCase(t.tee_name.replace(/\s*\(18-hole\)\s*/i, '').trim());
    const id = slug(name);
    const tee = teeMap.get(id) ?? { id, name, par: t.par ?? d.par, totalYards: t.yardage, yardages: null, ratings: {} };
    if (t.course_rating && t.slope) tee.ratings[t.gender === 'Female' ? 'women' : 'men'] = { rating: t.course_rating, slope: t.slope };
    if (!tee.totalYards && t.yardage) tee.totalYards = t.yardage;
    teeMap.set(id, tee);
  }
  const holes = d.holes_data ?? [];
  for (const tee of teeMap.values()) {
    const ys = holes.map((h) => h.yardages?.[tee.id] ?? h.yardages?.[tee.name.toLowerCase()]);
    if (ys.length === 18 && ys.every((y) => typeof y === 'number' && y > 0) && tee.totalYards) {
      const diff = Math.abs(sum(ys) - tee.totalYards) / tee.totalYards;
      if (diff <= YARDAGE_TOLERANCE) {
        tee.yardages = ys;
        if (sum(ys) !== tee.totalYards) notes.push(`${tee.name}: hole yardages sum to ${sum(ys)} vs. stated ${tee.totalYards}.`);
      } else {
        notes.push(`${tee.name}: hole yardages sum to ${sum(ys)} vs. stated ${tee.totalYards}; hole breakdown omitted.`);
      }
    }
    if (!tee.totalYards && tee.yardages) tee.totalYards = sum(tee.yardages);
  }
  return [...teeMap.values()].filter((t) => t.totalYards > 0).sort((a, b) => b.totalYards - a.totalYards);
}

export function describe(c) {
  const access = { public: 'Public', municipal: 'Municipal', 'semi-private': 'Semi-private', private: 'Private' }[c.access];
  const maxYards = Math.max(...c.tees.map((t) => t.totalYards));
  const parts = [`${access} 18-hole course in ${c.city}, par ${sum(c.holes.map((h) => h.par))}, playing up to ${maxYards.toLocaleString('en-US')} yards`];
  if (c.architect) parts.push(`designed by ${c.architect}`);
  if (c.yearOpened) parts.push(`dating to ${c.yearOpened}`);
  return parts.join(', ') + '.';
}

export const ogapiSource = (id, checked) => ({ name: 'OpenGolfAPI', url: `${API}/api/v1/courses/${id}`, checked, license: OGAPI_LICENSE });
