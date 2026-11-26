// Creates clearly-fake TEST accounts in Supabase and fills them with generated rounds, so the app has
// something to show. Sample data never goes to the database any other way.
//
//   npm run db:seed-test
//
// Every account uses the reserved `.test` email domain. Re-running deletes these accounts (and, by cascade,
// everything they own) and recreates them. Real users are never touched.
//
// Creates:
//   - TEST_ACCOUNT_EMAIL (default golfer@greenskeeper.test): the account you sign in with. Its password is
//     TEST_ACCOUNT_PASSWORD from .env; if missing, one is generated and appended to .env.
//   - Four friends (accepted friendships) with their own rounds, reactions and comments.
//   - One stranger with a pending friend request to you, to try accepting requests.
import { randomBytes, randomUUID } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { FRIENDS, generateFriendRounds, generateHoleScores, generateSampleRounds, ME } from '../../src/data/sample/generate';
import { defaultFormat, roundRobin } from '../../src/domain/competition';
import { SIM_COURSES } from '../../src/data/sample/sim-courses';
import { generateSocial } from '../../src/data/sample/social';
import type { Course, Round } from '../../src/domain/types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const root = join(import.meta.dirname, '..', '..');

const TEST_DOMAIN = '@greenskeeper.test';
const myEmail = (process.env.TEST_ACCOUNT_EMAIL ?? `golfer${TEST_DOMAIN}`).toLowerCase();
if (!myEmail.endsWith(TEST_DOMAIN)) {
  console.error(`TEST_ACCOUNT_EMAIL must end with ${TEST_DOMAIN} so test data can never land on a real account.`);
  process.exit(1);
}
let myPassword = process.env.TEST_ACCOUNT_PASSWORD;
if (!myPassword) {
  myPassword = randomBytes(12).toString('base64url');
  appendFileSync(join(root, '.env'), `\n# Test account for the app (created by npm run db:seed-test)\nTEST_ACCOUNT_EMAIL=${myEmail}\nTEST_ACCOUNT_PASSWORD=${myPassword}\n`);
  console.log('Generated a test password and saved TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD to .env');
}

type Account = { sampleId: string; email: string; name: string; tagline?: string; homeCourseId?: string; memberSince?: string };
const accounts: Account[] = [
  { sampleId: ME.id, email: myEmail, name: process.env.TEST_ACCOUNT_NAME ?? ME.name, memberSince: ME.memberSince },
  ...FRIENDS.map((f) => ({
    sampleId: f.id, email: `${f.name.split(' ')[0].toLowerCase()}${TEST_DOMAIN}`, name: f.name,
    tagline: f.tagline, homeCourseId: f.homeCourseId, memberSince: f.memberSince,
  })),
];
const stranger: Account = { sampleId: 'stranger', email: `pat${TEST_DOMAIN}`, name: 'Pat Green', tagline: 'Looking for a Saturday foursome' };

async function must<T>(label: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

// 1. Remove previous test accounts (cascades to profiles, rounds, scores, social rows).
const wanted = new Set([...accounts, stranger].map((a) => a.email));
for (let page = 1; ; page++) {
  const { users } = await must('list users', db.auth.admin.listUsers({ page, perPage: 200 }));
  for (const u of users) {
    if (u.email && wanted.has(u.email.toLowerCase()) && u.email.toLowerCase().endsWith(TEST_DOMAIN)) {
      await must(`delete ${u.email}`, db.auth.admin.deleteUser(u.id));
    }
  }
  if (users.length < 200) break;
}

// 2. Create accounts (a trigger creates each profile from full_name).
const idOf = new Map<string, string>();
for (const a of [...accounts, stranger]) {
  const password = a.email === myEmail ? myPassword : randomBytes(18).toString('base64url');
  const { user } = await must(`create ${a.email}`, db.auth.admin.createUser({
    email: a.email, password, email_confirm: true, user_metadata: { full_name: a.name },
  }));
  idOf.set(a.sampleId, user.id);
  await must(`profile ${a.email}`, db.from('profiles').update({
    tagline: a.tagline ?? null, home_course_id: a.homeCourseId ?? null, home_state: 'CT',
    ...(a.memberSince ? { created_at: `${a.memberSince}T12:00:00Z` } : {}),
  }).eq('id', user.id));
}
const me = idOf.get(ME.id)!;

// 3. Friendships: you ↔ each friend (accepted); the stranger has asked to be your friend.
await must('friendships', db.from('friendships').insert([
  ...FRIENDS.map((f) => ({ requester_id: me, addressee_id: idOf.get(f.id)!, status: 'accepted', responded_at: new Date().toISOString() })),
  { requester_id: idOf.get('stranger')!, addressee_id: me, status: 'pending' },
]));

// 4. Rounds, players and hole scores from the sample generators, re-keyed to the new accounts.
const courses = (JSON.parse(readFileSync(join(root, 'src', 'data', 'seed', 'courses.ct.json'), 'utf8')) as { courses: Course[] }).courses;
const sample: Round[] = [...generateSampleRounds(courses, SIM_COURSES), ...generateFriendRounds(courses, SIM_COURSES)];
const roundId = new Map(sample.map((r) => [r.id, randomUUID()]));
const owner = (r: Round) => idOf.get(r.ownerId ?? ME.id)!;

await must('rounds', db.from('rounds').insert(sample.map((r) => ({
  id: roundId.get(r.id), owner_id: owner(r), kind: r.kind,
  course_id: r.kind === 'course' ? r.courseId : null, sim_course_id: r.kind === 'sim' ? r.courseId : null,
  tee_id: r.kind === 'course' ? r.teeId ?? null : null, played_on: r.date, status: r.status, hole_numbers: r.holeNumbers,
  created_at: r.createdAt, completed_at: r.completedAt ?? null,
}))));

const players = sample.flatMap((r) => r.playerIds.map((pid) => ({
  id: randomUUID(), round_id: roundId.get(r.id)!, profile_id: idOf.get(pid)!, is_owner: idOf.get(pid) === owner(r), sampleOwner: pid === (r.ownerId ?? ME.id), r,
})));
await must('round players', db.from('round_players').insert(players.map(({ id, round_id, profile_id, is_owner }) => ({ id, round_id, profile_id, is_owner }))));

const scoreRows = players.filter((p) => p.sampleOwner).flatMap((p) => {
  const scores = p.r.scores[p.r.ownerId ?? ME.id] ?? [];
  return p.r.holeNumbers.flatMap((n, i) => {
    const s = scores[i];
    return s ? [{
      round_player_id: p.id, hole_number: n, strokes: s.strokes, putts: s.putts ?? null, fairway: s.fairway ?? null, gir: s.gir ?? null,
      penalties: s.penalties ?? null, chips: s.chips ?? null, sand_shots: s.sandShots ?? null,
    }] : [];
  });
});
for (let i = 0; i < scoreRows.length; i += 1000) await must('hole scores', db.from('hole_scores').insert(scoreRows.slice(i, i + 1000)));

// 5. Reactions, comments and a wishlist.
const social = generateSocial(sample);
const reactions = Object.entries(social.reactions).flatMap(([rid, list]) => list.map((x) => ({ round_id: roundId.get(rid)!, user_id: idOf.get(x.playerId)!, emoji: x.emoji })));
const comments = Object.entries(social.comments).flatMap(([rid, list]) => list.map((c) => ({ round_id: roundId.get(rid)!, user_id: idOf.get(c.playerId)!, body: c.text, created_at: c.at })));
if (reactions.length) await must('reactions', db.from('reactions').insert(reactions));
if (comments.length) await must('comments', db.from('comments').insert(comments));
await must('wishlist', db.from('wishlist').insert(['fox-hopyard', 'tpc-river-highlands', 'crestbrook-park'].map((course_id) => ({ user_id: me, course_id }))));

// 6. Leagues, tournaments and a scheduled round (all on test accounts), with linked rounds.
const SKILL: Record<string, number> = { [ME.id]: 0.6, 'f-mike': 0.2, 'f-dana': 1.4, 'f-chris': 0.6, 'f-sam': -0.5 };
const courseById = new Map(courses.map((c) => [c.id, c]));
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const today = new Date().toISOString().slice(0, 10);
let eventRounds = 0;
let eventScores = 0;

async function seedEvent(spec: {
  kind: 'league' | 'tournament' | 'outing'; name: string; code: string; organizer: string; format: object;
  members: string[]; invited?: string[]; courseId: string; teeId: string; teeTime: string;
  dates: string[]; label: (i: number) => string; pairings?: boolean;
}) {
  const org = idOf.get(spec.organizer)!;
  const { id: eventId } = await must(`event ${spec.name}`, db.from('events').insert({
    kind: spec.kind, name: spec.name, organizer_id: org, format: spec.format, join_code: spec.code,
    starts_on: spec.dates[0], ends_on: spec.dates[spec.dates.length - 1],
  }).select('id').single()) as { id: string };
  // The organizer membership comes from a trigger; add everyone else.
  const others = spec.members.filter((m) => m !== spec.organizer);
  const rows = [
    ...others.map((m) => ({ event_id: eventId, profile_id: idOf.get(m)!, status: 'joined', invited_by: org })),
    ...(spec.invited ?? []).map((m) => ({ event_id: eventId, profile_id: idOf.get(m)!, status: 'invited', invited_by: org })),
  ];
  if (rows.length) await must('members', db.from('event_members').insert(rows));
  const ers = await must('event rounds', db.from('event_rounds').insert(spec.dates.map((d, i) => ({
    event_id: eventId, seq: i + 1, name: spec.label(i), course_id: spec.courseId, tee_id: spec.teeId, scheduled_on: d, tee_time: spec.teeTime, holes: 'all',
  }))).select('id, seq, scheduled_on')) as { id: string; seq: number; scheduled_on: string }[];

  const pairs = spec.pairings ? roundRobin(spec.members) : [];
  const course = courseById.get(spec.courseId)!;
  for (const er of ers.sort((a, b) => a.seq - b.seq)) {
    if (pairs.length) {
      await must('pairings', db.from('event_matches').insert(pairs[(er.seq - 1) % pairs.length].map(([a, b]) => ({ event_round_id: er.id, player_a: idOf.get(a)!, player_b: idOf.get(b)! }))));
    }
    if (spec.kind === 'outing' || er.scheduled_on >= today) continue; // only past rounds have scores
    for (const [i, m] of spec.members.entries()) {
      if ((er.seq + i) % 7 === 3) continue; // someone misses a week now and then
      const owner = idOf.get(m)!;
      const rid = randomUUID();
      const slot = randomUUID();
      const scores = generateHoleScores(course.holes, SKILL[m] ?? 0, er.seq * 101 + i * 7 + spec.code.charCodeAt(0));
      await must('event round', db.from('rounds').insert({
        id: rid, owner_id: owner, kind: 'course', course_id: course.id, tee_id: spec.teeId, played_on: er.scheduled_on, status: 'complete',
        hole_numbers: course.holes.map((h) => h.number), created_at: `${er.scheduled_on}T21:00:00Z`, completed_at: `${er.scheduled_on}T23:30:00Z`, event_round_id: er.id,
      }));
      await must('event round player', db.from('round_players').insert({ id: slot, round_id: rid, profile_id: owner, is_owner: true }));
      await must('event round scores', db.from('hole_scores').insert(scores.map((x, h) => ({
        round_player_id: slot, hole_number: h + 1, strokes: x.strokes, putts: x.putts ?? null, fairway: x.fairway ?? null, gir: x.gir ?? null,
        penalties: x.penalties ?? null, chips: null, sand_shots: null,
      }))));
      eventRounds++;
      eventScores += scores.length;
    }
  }
}

const everyone = [ME.id, ...FRIENDS.map((f) => f.id)];
const weekly = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i * 7));
// Thursdays: past weeks have results; today's and later weeks are open.
await seedEvent({
  kind: 'league', name: 'Thursday Night League', code: 'THNITE', organizer: ME.id, format: defaultFormat('league', 'stroke', 'net'),
  members: everyone, courseId: 'keney-park', teeId: 'blue', teeTime: '17:30', dates: weekly(addDays(today, -49), 10), label: (i) => `Week ${i + 1}`,
});
await seedEvent({
  kind: 'tournament', name: 'Fall Classic', code: 'FALLCL', organizer: 'f-dana', format: defaultFormat('tournament', 'stableford', 'net'),
  members: ['f-dana', ME.id, 'f-chris', 'f-mike'], courseId: 'wintonbury-hills', teeId: 'white', teeTime: '08:30',
  dates: [addDays(today, -12), addDays(today, -11)], label: (i) => `Round ${i + 1}`,
});
await seedEvent({
  kind: 'league', name: 'Winter Match Play', code: 'WINTMP', organizer: ME.id, format: defaultFormat('league', 'match', 'net'),
  members: [ME.id, 'f-mike', 'f-chris', 'f-sam'], courseId: 'airways', teeId: 'white', teeTime: '10:00',
  dates: weekly(addDays(today, -14), 3), label: (i) => `Match ${i + 1}`, pairings: true,
});
await seedEvent({
  kind: 'outing', name: 'Saturday at Fox Hopyard', code: 'SATFOX', organizer: 'f-mike', format: defaultFormat('outing'),
  members: ['f-mike', 'f-dana'], invited: [ME.id, 'f-chris'], courseId: 'fox-hopyard', teeId: 'white', teeTime: '08:10',
  dates: [addDays(today, 3)], label: () => 'Saturday round',
});

console.log(`Test accounts ready: ${accounts.length + 1} accounts, ${sample.length} rounds + ${eventRounds} event rounds (4 events), ${scoreRows.length} hole scores, ${reactions.length} reactions, ${comments.length} comments.`);
console.log(`Sign in as ${myEmail} (password in .env as TEST_ACCOUNT_PASSWORD).`);
