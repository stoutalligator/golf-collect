import { describe, expect, it } from 'vitest';

import { ACHIEVEMENTS, COLLECTIBLES, collectiblesForCourse, TIERS } from '@/data/config/game';
import seed from '@/data/seed/courses.ct.json';
import { generateSampleRounds, ME } from '@/data/sample/generate';
import { SIM_COURSES } from '@/data/sample/sim-courses';

import { evaluateAchievements } from './achievements';
import { collectiblesFor, courseCollection, courseTier } from './collection';
import { careerStats, deriveGir, summarizeRound } from './stats';
import type { Course, HoleScore, Round } from './types';

const courses = seed.courses as Course[];
const keney = courses.find((c) => c.id === 'keney-park')!;

function makeRound(over: Partial<Round> & { strokes?: number[]; holeScores?: HoleScore[] }): Round {
  const holeNumbers = over.holeNumbers ?? keney.holes.map((h) => h.number);
  const scores = over.holeScores ?? holeNumbers.map((n, i) => ({ strokes: over.strokes?.[i] ?? keney.holes[n - 1].par }));
  return {
    id: over.id ?? 'r1', kind: over.kind ?? 'course', courseId: over.courseId ?? keney.id, date: over.date ?? '2026-06-01',
    status: over.status ?? 'complete', holeNumbers, playerIds: ['me'], scores: { me: scores }, createdAt: '2026-06-01T00:00:00Z',
  };
}

const sum = (r: Round, layout = keney) => summarizeRound(r, layout, 'me');

describe('stats', () => {
  it('scores an even-par round', () => {
    const s = sum(makeRound({}));
    expect(s.strokes).toBe(70);
    expect(s.toPar).toBe(0);
    expect(s.isFull18).toBe(true);
    expect(s.front?.par).toBe(35);
    expect(s.back?.par).toBe(35);
    expect(s.pars).toBe(18);
  });

  it('derives GIR only when putts are entered', () => {
    expect(deriveGir({ strokes: 4, putts: 2 }, 4)).toBe(true);
    expect(deriveGir({ strokes: 5, putts: 2 }, 4)).toBe(false);
    expect(deriveGir({ strokes: 4 }, 4)).toBeUndefined();
    expect(deriveGir({ strokes: 5, putts: 2, gir: true }, 4)).toBe(true);
  });

  it('treats unentered stats as missing, not zero', () => {
    const s = sum(makeRound({}));
    expect(s.putts.entered).toBe(0);
    expect(s.gir.entered).toBe(0);
    const career = careerStats([s]);
    expect(career.puttsPerRound).toBeNull();
    expect(career.girPct).toBeNull();
  });

  it('counts fairways on par 4/5 only', () => {
    const scores = keney.holes.map((h) => ({ strokes: h.par, fairway: 'hit' as const }));
    const s = sum(makeRound({ holeScores: scores }));
    expect(s.fairways.entered).toBe(keney.holes.filter((h) => h.par > 3).length);
  });

  it('does not treat a partial round as a full 18', () => {
    const s = sum(makeRound({ holeNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] }));
    expect(s.isFull18).toBe(false);
    expect(s.isComplete).toBe(true);
    expect(careerStats([s]).avgScore).toBeNull();
  });
});

describe('collection', () => {
  // Keney Park is par 70: `over` extra strokes spread across the holes.
  const at = (over: number, id: string, date: string, kind: Round['kind'] = 'course') =>
    sum(makeRound({ id, date, kind, strokes: keney.holes.map((h, i) => h.par + Math.floor(over / 18) + (i < over % 18 ? 1 : 0)) }));
  const set = collectiblesForCourse('keney-park');

  it.each([
    [32, null], // 102
    [29, 'bronze'], // 99
    [19, 'silver'], // 89
    [9, 'gold'], // 79
    [0, 'platinum'], // 70 = even par
  ])('tier for %i over par', (over, tier) => {
    expect(courseTier([at(over, 'a', '2026-05-01')], TIERS)?.tier ?? null).toBe(tier);
  });

  it('keeps the best tier and the first date it was reached', () => {
    const t = courseTier([at(25, 'a', '2026-05-01'), at(9, 'b', '2026-06-01'), at(5, 'c', '2026-07-01')], TIERS);
    expect(t?.tier).toBe('gold');
    expect(t?.earnedOn).toBe('2026-06-01');
  });

  it('earns the ball marker on any completed round, even untiered', () => {
    const col = courseCollection(keney, [at(32, 'a', '2026-05-01')], TIERS, set);
    expect(col.tier).toBeNull();
    expect(col.items.find((i) => i.def.id === 'ball-marker')!.earned).toBe(true);
  });

  it('awards the bag tag on the third round', () => {
    const col = courseCollection(keney, [at(15, 'a', '2026-05-01'), at(15, 'b', '2026-06-01'), at(15, 'c', '2026-07-01')], TIERS, set);
    const tag = col.items.find((i) => i.def.id === 'bag-tag')!;
    expect(tag.earned).toBe(true);
    expect(tag.earnedOn).toBe('2026-07-01');
  });

  it('never credits sim rounds to a real course', () => {
    const col = courseCollection(keney, [at(0, 'a', '2026-05-01', 'sim')], TIERS, set);
    expect(col.played).toBe(false);
    expect(col.earnedCount).toBe(0);
  });

  it('applies per-course remove / override / add', () => {
    const cfg = {
      default: COLLECTIBLES.default,
      courses: {
        x: {
          remove: ['bag-tag'],
          override: { pin: { name: 'Hole 3 Pin', rule: { type: 'parOrBetterOnHole' as const, hole: 3 } } },
          add: [{ id: 'extra', kind: 'patch' as const, name: 'Extra', howToEarn: 'Birdie the 18th', rule: { type: 'birdieOnHole' as const, hole: 18 } }],
        },
      },
    };
    const resolved = collectiblesFor('x', cfg);
    expect(resolved.map((d) => d.id)).toEqual(['ball-marker', 'pitch-marker', 'patch', 'pin', 'extra']);
    expect(resolved.find((d) => d.id === 'pin')!.rule).toEqual({ type: 'parOrBetterOnHole', hole: 3 });
    expect(collectiblesFor('unknown', cfg)).toHaveLength(COLLECTIBLES.default.length);
  });

  it('evaluates hole-specific rules', () => {
    const scores = keney.holes.map((h) => ({ strokes: h.number === 18 ? h.par - 1 : h.par + 1 }));
    const s = sum(makeRound({ holeScores: scores }));
    const defs = [
      { id: 'b18', kind: 'patch' as const, name: '', howToEarn: '', rule: { type: 'birdieOnHole' as const, hole: 18 } },
      { id: 'p1', kind: 'pin' as const, name: '', howToEarn: '', rule: { type: 'parOrBetterOnHole' as const, hole: 1 } },
    ];
    const col = courseCollection(keney, [s], TIERS, defs);
    expect(col.items.map((i) => i.earned)).toEqual([true, false]);
  });
});

describe('achievements', () => {
  const ctx = { courses, simCourses: SIM_COURSES, tiers: TIERS, setFor: collectiblesForCourse };
  it('keeps course and sim tracks separate', () => {
    const sim = sum(makeRound({ id: 's', kind: 'sim', courseId: keney.id }));
    const states = evaluateAchievements(ACHIEVEMENTS, [sim], ctx);
    expect(states.find((s) => s.def.id === 'break-80')!.earned).toBe(false);
    expect(states.find((s) => s.def.id === 'sim-break-80')!.earned).toBe(true);
  });
});

describe('sample data', () => {
  const rounds = generateSampleRounds(courses, SIM_COURSES);
  const layouts = new Map<string, { holes: Course['holes'] }>([...courses, ...SIM_COURSES].map((c) => [c.id, c]));
  const summaries = rounds.map((r) => summarizeRound(r, layouts.get(r.courseId)!, ME.id));

  it('is deterministic', () => {
    expect(generateSampleRounds(courses, SIM_COURSES)).toEqual(rounds);
  });

  it('only references real seeded courses or sim courses', () => {
    for (const r of rounds) expect(layouts.has(r.courseId)).toBe(true);
  });

  it('produces believable scores', () => {
    const career = careerStats(summaries.filter((s) => s.kind === 'course'));
    expect(career.avgScore!).toBeGreaterThan(78);
    expect(career.avgScore!).toBeLessThan(95);
  });
});
