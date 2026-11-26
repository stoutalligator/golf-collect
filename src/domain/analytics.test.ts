import { describe, expect, it } from 'vitest';

import seed from '@/data/seed/courses.ct.json';

import { analytics, handicapIndex, recentRounds, scoreDifferential, trendDelta } from './analytics';
import { summarizeRound } from './stats';
import type { Course, HoleScore, Round } from './types';

const courses = seed.courses as Course[];
const keney = courses.find((c) => c.id === 'keney-park')!;

function round(id: string, date: string, holeScores: HoleScore[]): Round {
  return {
    id, kind: 'course', courseId: keney.id, date, status: 'complete', holeNumbers: keney.holes.map((h) => h.number),
    playerIds: ['me'], scores: { me: holeScores }, createdAt: `${date}T00:00:00Z`,
  };
}
const par = (over: (par: number, i: number) => Partial<HoleScore> = () => ({})) =>
  keney.holes.map((h, i) => ({ strokes: h.par, ...over(h.par, i) }));
const sum = (r: Round) => summarizeRound(r, keney, 'me');

describe('handicap', () => {
  it('computes a score differential', () => {
    expect(scoreDifferential(85, 70.1, 120)).toBe(14);
  });

  it('needs at least 3 scores and follows the WHS table', () => {
    expect(handicapIndex([10, 12])).toBeNull();
    expect(handicapIndex([10, 12, 14])).toBe(8); // lowest 1, −2
    expect(handicapIndex([10, 12, 14, 9, 11, 13])).toBe(8.5); // avg lowest 2 (9,10), −1
  });

  it('uses only the most recent 20 (lowest 8)', () => {
    const diffs = [0, 0, 0, ...Array.from({ length: 20 }, (_, i) => 10 + i)];
    expect(handicapIndex(diffs)).toBe(13.5); // 10..17 → 13.5; the three old zeros drop off
  });
});

describe('analytics', () => {
  it('par-type averages and scoring use every hole', () => {
    const a = analytics([sum(round('a', '2026-06-01', par((p) => ({ strokes: p === 3 ? 4 : p }))))]);
    const p3 = a.parTypes.find((t) => t.par === 3)!;
    expect(p3.avgToPar).toBe(1);
    expect(a.parTypes.find((t) => t.par === 4)!.avgToPar).toBe(0);
    expect(a.scoring.bogeys).toBe(p3.holes);
  });

  it('leaves optional stats null when never entered', () => {
    const a = analytics([sum(round('a', '2026-06-01', par()))]);
    expect(a.putting.perRound).toBeNull();
    expect(a.driving.pct).toBeNull();
    expect(a.scrambling.pct).toBeNull();
    expect(a.penaltiesPer18).toBeNull();
  });

  it('putting, GIR and scrambling', () => {
    // Every hole: par with 2 putts (GIR) except hole 1: par with 1 putt after missing the green (a save).
    const a = analytics([sum(round('a', '2026-06-01', par((_, i) => ({ putts: i === 0 ? 1 : 2 }))))]);
    expect(a.putting.perRound).toBeCloseTo(35);
    expect(a.approach.hit).toBe(17);
    expect(a.scrambling).toEqual({ chances: 1, saves: 1, pct: 1 });
    expect(a.putting.perGir).toBe(2);
  });

  it('keeps the trend in date order and picks the best', () => {
    const r1 = sum(round('a', '2026-07-01', par((p, i) => ({ strokes: p + (i < 10 ? 1 : 0) }))));
    const r2 = sum(round('b', '2026-06-01', par((p, i) => ({ strokes: p + (i < 5 ? 1 : 0) }))));
    const a = analytics([r1, r2]);
    expect(a.trend.map((t) => t.roundId)).toEqual(['b', 'a']);
    expect(a.best?.roundId).toBe('b');
    expect(recentRounds([r1, r2], 1).map((s) => s.roundId)).toEqual(['a']);
  });

  it('trend delta compares the newer half to the older half', () => {
    expect(trendDelta([90, 90, 80, 80])).toBe(-10);
    expect(trendDelta([90, 80])).toBeNull();
  });
});
