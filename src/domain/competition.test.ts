import { describe, expect, it } from 'vitest';

import {
  courseHandicap, defaultFormat, makeJoinCode, matchResult, playerRoundResult, positionLabel, rank, roundLeaderboard,
  roundRobin, seasonPointsFor, seasonStandings, stablefordPoints, strokesPerHole, tournamentLeaderboard, type EventFormat,
  type ScoredHole,
} from './competition';

const holes18 = Array.from({ length: 18 }, (_, i) => ({ number: i + 1, handicap: [7, 11, 17, 3, 1, 9, 15, 13, 5, 6, 18, 2, 10, 8, 4, 16, 14, 12][i], par: [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5][i] }));

/** A player's holes: `over[i]` strokes over par on hole i+1, with strokes received for `ch`. */
function card(over: number[], ch = 0): ScoredHole[] {
  const recv = strokesPerHole(ch, holes18);
  return holes18.slice(0, over.length).map((h, i) => ({ number: h.number, par: h.par, si: h.handicap, strokes: h.par + over[i], received: recv.get(h.number) ?? 0 }));
}
const result = (playerId: string, over: number[], ch = 0, planned = 18) =>
  playerRoundResult({ playerId, roundId: `r-${playerId}`, holes: card(over, ch), holesPlanned: planned, courseHandicap: ch });
const all = (n: number) => Array(18).fill(n);

describe('handicap', () => {
  it('course handicap follows WHS: index × slope/113 + (rating − par), × allowance', () => {
    const tee = { par: 72, ratings: { men: { rating: 71.2, slope: 129 } } };
    expect(courseHandicap(12.4, tee)).toBe(Math.round(12.4 * 129 / 113 + (71.2 - 72))); // 13
    expect(courseHandicap(12.4, tee, { allowance: 95 })).toBe(Math.round((12.4 * 129 / 113 - 0.8) * 0.95)); // 13
    expect(courseHandicap(10, { par: 72, ratings: {} })).toBe(10);
  });

  it('allocates strokes by stroke index, wrapping past 18', () => {
    const s = strokesPerHole(20, holes18);
    expect(s.get(5)).toBe(2); // SI 1
    expect(s.get(12)).toBe(2); // SI 2
    expect(s.get(4)).toBe(1); // SI 3
    expect(s.get(11)).toBe(1); // SI 18
    expect([...s.values()].reduce((a, b) => a + b, 0)).toBe(20);
  });

  it('plus handicaps give strokes back from the easiest hole', () => {
    const s = strokesPerHole(-2, holes18);
    expect(s.get(11)).toBe(-1); // SI 18
    expect(s.get(3)).toBe(-1); // SI 17
    expect([...s.values()].reduce((a, b) => a + b, 0)).toBe(-2);
  });
});

describe('round results', () => {
  it('stableford points', () => {
    expect(stablefordPoints(4, 4)).toBe(2);
    expect(stablefordPoints(3, 4)).toBe(3);
    expect(stablefordPoints(7, 4)).toBe(0);
  });

  it('gross, net and stableford for one player', () => {
    const r = result('a', all(1), 18); // bogey golf with 18 strokes
    expect(r.gross).toBe(72 + 18);
    expect(r.net).toBe(72);
    expect(r.stablefordGross).toBe(18);
    expect(r.stablefordNet).toBe(36);
    expect(r.complete).toBe(true);
  });
});

describe('leaderboards', () => {
  const net: EventFormat = defaultFormat('tournament', 'stroke', 'net');
  const ford: EventFormat = defaultFormat('tournament', 'stableford', 'net');

  it('ranks with shared positions for ties', () => {
    const board = roundLeaderboard([result('a', all(1), 18), result('b', all(1), 16), result('c', all(0), 0)], net);
    expect(board.map((s) => [s.playerId, positionLabel(s)])).toEqual([['a', 'T1'], ['c', 'T1'], ['b', '3']]);
  });

  it('stableford ranks highest points first and ignores unfinished rounds', () => {
    const board = roundLeaderboard([result('a', all(0), 0), result('b', all(-1), 0), result('c', [0, 0, 0], 0)], ford);
    expect(board.map((s) => s.playerId)).toEqual(['b', 'a']);
  });

  it('tournament: more rounds played ranks ahead of a lower partial total', () => {
    const r1 = [result('a', all(1), 0), result('b', all(0), 0)];
    const r2 = [result('a', all(1), 0)];
    const board = tournamentLeaderboard([r1, r2], defaultFormat('tournament', 'stroke', 'gross'));
    expect(board.map((s) => [s.playerId, s.rounds, s.value])).toEqual([['a', 2, 180], ['b', 1, 72]]);
  });

  it('season points split for ties, then season table sums (best N)', () => {
    const wk1 = rank([{ playerId: 'a', value: 70, rounds: 1 }, { playerId: 'b', value: 70, rounds: 1 }, { playerId: 'c', value: 75, rounds: 1 }], true);
    expect(Object.fromEntries(seasonPointsFor(wk1))).toEqual({ a: 21.5, b: 21.5, c: 15 });
    const wk2 = rank([{ playerId: 'c', value: 68, rounds: 1 }, { playerId: 'a', value: 72, rounds: 1 }], true);
    const table = seasonStandings([wk1, wk2], { ...defaultFormat('league'), countBest: 1 }, ['a', 'b', 'c', 'd']);
    expect(table.map((r) => [r.playerId, r.points, r.rounds, r.wins])).toEqual([['c', 25, 2, 1], ['a', 21.5, 2, 1], ['b', 21.5, 1, 1], ['d', 0, 0, 0]]);
    expect(table[1].tied && table[2].tied).toBe(true);
  });
});

describe('match play', () => {
  const f = defaultFormat('tournament', 'match', 'net');
  const m = { id: 'm1', eventRoundId: 'er', playerA: 'a', playerB: 'b' };

  it('decides early: 3 & 2', () => {
    // A wins holes 1–3, then all square through 16 → 3 up with 2 to play.
    const a = result('a', [...Array(3).fill(0), ...Array(13).fill(1)], 0, 18);
    const b = result('b', [...Array(3).fill(1), ...Array(13).fill(1)], 0, 18);
    const r = matchResult(m, a, b, { ...f, basis: 'gross' }, 18);
    expect(r.summary).toBe('3 & 2');
    expect(r.winner).toBe('a');
    expect([r.pointsA, r.pointsB]).toEqual([1, 0]);
  });

  it('net: the higher handicap receives the difference on the hardest holes', () => {
    // Same gross on every hole; B gets 1 stroke (SI 1 = hole 5) → B wins 1 up.
    const a = result('a', all(1), 5);
    const b = result('b', all(1), 6);
    const r = matchResult(m, a, b, f, 18);
    expect(r.aUp).toBe(-1);
    expect(r.summary).toBe('1 up');
    expect(r.winner).toBe('b');
  });

  it('halved and in-progress states', () => {
    expect(matchResult(m, result('a', all(0)), result('b', all(0)), f, 18).summary).toBe('Halved');
    expect(matchResult(m, result('a', [0, 0], 0, 18), result('b', [1, 0], 0, 18), { ...f, basis: 'gross' }, 18).summary).toBe('A 1 up thru 2');
    expect(matchResult(m, undefined, result('b', all(0)), f, 18).summary).toBe('Not started');
  });

  it('round robin: everyone plays everyone once, byes for odd counts', () => {
    const rounds = roundRobin(['a', 'b', 'c', 'd', 'e']);
    expect(rounds).toHaveLength(5);
    const pairs = rounds.flat().map((p) => [...p].sort().join('-'));
    expect(new Set(pairs).size).toBe(10);
    expect(pairs).toHaveLength(10);
  });
});

it('join codes avoid ambiguous characters', () => {
  const code = makeJoinCode();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
});
