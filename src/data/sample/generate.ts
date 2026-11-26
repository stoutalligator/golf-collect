/**
 * Deterministic sample rounds across the researched CT courses (+ a few sim rounds).
 * Same seed → same rounds, so screenshots and tests are stable.
 */
import type { Course, FairwayResult, HoleScore, Player, Round, SimCourse } from '@/domain/types';

export const ME: Player = { id: 'me', name: 'John F.', initials: 'JF', homeState: 'CT', isMe: true, memberSince: '2026-04-01' };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Plan = { courseId: string; date: string; kind?: 'course' | 'sim'; skill?: number; nine?: boolean; scoreOnly?: boolean };

/** skill: 0 = typical (~mid-80s on these courses), positive = hotter day. */
const PLAN: Plan[] = [
  { courseId: 'keney-park', date: '2026-04-18' },
  { courseId: 'airways', date: '2026-04-26' },
  { courseId: 'wintonbury-hills', date: '2026-05-03' },
  { courseId: 'keney-park', date: '2026-05-10', scoreOnly: true },
  { courseId: 'sim-harbor-bluff', date: '2026-05-14', kind: 'sim' },
  { courseId: 'simsbury-farms', date: '2026-05-24' },
  { courseId: 'airways', date: '2026-05-31', nine: true },
  { courseId: 'timberlin', date: '2026-06-07' },
  { courseId: 'lyman-orchards-jones', date: '2026-06-14' },
  { courseId: 'keney-park', date: '2026-06-21', skill: 0.4 },
  { courseId: 'shennecossett', date: '2026-06-28' },
  { courseId: 'sim-saltgrass-dunes', date: '2026-07-02', kind: 'sim', skill: 0.3 },
  { courseId: 'wintonbury-hills', date: '2026-07-12' },
  { courseId: 'lake-of-isles-north', date: '2026-07-19' },
  { courseId: 'airways', date: '2026-07-26', skill: 0.5 },
  { courseId: 'tashua-knolls', date: '2026-08-02', scoreOnly: true },
  { courseId: 'lyman-orchards-player', date: '2026-08-09' },
  { courseId: 'keney-park', date: '2026-08-16', skill: 0.6 },
  { courseId: 'richter-park', date: '2026-08-23' },
  { courseId: 'sim-granite-ridge', date: '2026-08-27', kind: 'sim' },
  { courseId: 'timberlin', date: '2026-09-06', skill: 0.3 },
  { courseId: 'shennecossett', date: '2026-09-13', skill: 0.5 },
  { courseId: 'simsbury-farms', date: '2026-09-20' },
  { courseId: 'airways', date: '2026-10-04', skill: 1.1 },
  { courseId: 'wintonbury-hills', date: '2026-10-11', skill: 0.5 },
  { courseId: 'sim-harbor-bluff', date: '2026-10-15', kind: 'sim', skill: 1.0 },
  { courseId: 'keney-park', date: '2026-10-25', skill: 0.7 },
  { courseId: 'tashua-knolls', date: '2026-11-08', skill: 0.4 },
  { courseId: 'sim-saltgrass-dunes', date: '2026-11-12', kind: 'sim', skill: 0.6 },
  { courseId: 'shennecossett', date: '2026-11-22', skill: 0.8 },
];

/** Strokes relative to par, from a weighted distribution shifted by skill. */
function holeToPar(r: () => number, par: number, handicap: number, skill: number): number {
  const difficulty = (18 - handicap) / 17; // 1 = hardest hole
  const base = [
    { v: -1, w: 0.07 + 0.06 * skill },
    { v: 0, w: 0.33 + 0.15 * skill },
    { v: 1, w: 0.37 },
    { v: 2, w: Math.max(0.05, 0.16 + 0.06 * difficulty - 0.1 * skill) },
    { v: 3, w: Math.max(0.01, 0.06 + 0.03 * difficulty - 0.04 * skill) },
  ];
  if (par === 5) base[0].w += 0.04;
  const total = base.reduce((s, b) => s + b.w, 0);
  let x = r() * total;
  for (const b of base) {
    if ((x -= b.w) <= 0) return b.v;
  }
  return 1;
}

function holeScore(r: () => number, par: number, handicap: number, skill: number, scoreOnly: boolean): HoleScore {
  const strokes = Math.max(1, par + holeToPar(r, par, handicap, skill));
  if (scoreOnly) return { strokes };
  const toPar = strokes - par;
  let putts = toPar <= -1 ? (r() < 0.75 ? 1 : 2) : r() < 0.12 ? 1 : r() < 0.88 ? 2 : 3;
  putts = Math.min(putts, strokes - 1);
  const score: HoleScore = { strokes, putts };
  if (par > 3) {
    const f = r();
    score.fairway = (f < 0.48 + 0.1 * skill ? 'hit' : f < 0.72 ? 'right' : f < 0.94 ? 'left' : 'short') as FairwayResult;
  }
  if (toPar >= 2 && r() < 0.45) score.penalties = 1;
  else if (r() < 0.6) score.penalties = 0; // sometimes left blank on purpose
  return score;
}

export function generateSampleRounds(courses: Course[], simCourses: SimCourse[], seed = 20261125): Round[] {
  const r = rng(seed);
  const layouts = new Map<string, { holes: Course['holes']; teeId?: string }>([
    ...courses.map((c) => [c.id, { holes: c.holes, teeId: c.tees[Math.min(1, c.tees.length - 1)]?.id }] as const),
    ...simCourses.map((s) => [s.id, { holes: s.holes }] as const),
  ]);

  return PLAN.flatMap((p, i) => {
    const layout = layouts.get(p.courseId);
    if (!layout) return [];
    const holeNumbers = p.nine ? layout.holes.slice(0, 9).map((h) => h.number) : layout.holes.map((h) => h.number);
    const scores = holeNumbers.map((n) => {
      const h = layout.holes.find((x) => x.number === n)!;
      return holeScore(r, h.par, h.handicap, p.skill ?? 0, !!p.scoreOnly);
    });
    const round: Round = {
      id: `sample-${String(i + 1).padStart(2, '0')}`,
      kind: p.kind ?? 'course',
      courseId: p.courseId,
      teeId: layout.teeId,
      date: p.date,
      status: 'complete',
      holeNumbers,
      playerIds: [ME.id],
      scores: { [ME.id]: scores },
      createdAt: `${p.date}T12:00:00.000Z`,
      completedAt: `${p.date}T16:30:00.000Z`,
    };
    return [round];
  });
}
