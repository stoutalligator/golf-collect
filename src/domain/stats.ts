import type { Hole, HoleScore, Round } from './types';

/** Anything with an ordered list of holes: a real Course or a SimCourse. */
export interface HoleLayout {
  holes: Hole[];
}

export interface HoleResult {
  hole: Hole;
  score: HoleScore;
  toPar: number;
  gir: boolean | undefined;
}

export interface RoundSummary {
  roundId: string;
  /** 'scramble' for team scrambles, so every course/sim filter leaves them out. */
  kind: Round['kind'] | 'scramble';
  courseId: string;
  date: string;
  /** Number of holes with a recorded score. */
  holesPlayed: number;
  /** Planned holes in the round (9 or 18). */
  holesPlanned: number;
  isComplete: boolean;
  isFull18: boolean;
  strokes: number;
  par: number;
  toPar: number;
  front: { strokes: number; par: number } | null;
  back: { strokes: number; par: number } | null;
  /** Optional stats: `entered` is how many holes had the stat recorded. */
  putts: { total: number; entered: number };
  fairways: { hit: number; entered: number };
  gir: { hit: number; entered: number };
  penalties: { total: number; entered: number };
  eagles: number; // eagle or better
  birdies: number;
  pars: number;
  bogeys: number;
  doublesPlus: number;
  results: HoleResult[];
}

export function deriveGir(score: HoleScore, par: number): boolean | undefined {
  if (score.green !== undefined) return score.green === 'hit';
  if (score.gir !== undefined) return score.gir;
  if (score.putts === undefined) return undefined;
  return score.strokes - score.putts <= par - 2;
}

/** Results for one player's recorded holes, in play order. */
export function holeResults(round: Round, layout: HoleLayout, playerId: string): HoleResult[] {
  const scores = round.scores[playerId] ?? [];
  const results: HoleResult[] = [];
  round.holeNumbers.forEach((n, i) => {
    const score = scores[i];
    const hole = layout.holes.find((h) => h.number === n);
    if (!score || !hole) return;
    results.push({ hole, score, toPar: score.strokes - hole.par, gir: deriveGir(score, hole.par) });
  });
  return results;
}

const sumNine = (results: HoleResult[], from: number, to: number) => {
  const nine = results.filter((r) => r.hole.number >= from && r.hole.number <= to);
  if (nine.length !== 9) return null;
  return { strokes: nine.reduce((s, r) => s + r.score.strokes, 0), par: nine.reduce((s, r) => s + r.hole.par, 0) };
};

export function summarizeRound(round: Round, layout: HoleLayout, playerId: string): RoundSummary {
  const results = holeResults(round, layout, playerId);
  const count = <T>(pick: (r: HoleResult) => T | undefined, test: (v: T) => boolean) => {
    const entered = results.map(pick).filter((v): v is T => v !== undefined);
    return { hit: entered.filter(test).length, entered: entered.length };
  };
  const strokes = results.reduce((s, r) => s + r.score.strokes, 0);
  const par = results.reduce((s, r) => s + r.hole.par, 0);
  const puttsEntered = results.filter((r) => r.score.putts !== undefined);
  const penEntered = results.filter((r) => r.score.penalties !== undefined);

  return {
    roundId: round.id,
    kind: round.format === 'scramble' ? 'scramble' : round.kind,
    courseId: round.courseId,
    date: round.date,
    holesPlayed: results.length,
    holesPlanned: round.holeNumbers.length,
    isComplete: round.status === 'complete' && results.length === round.holeNumbers.length,
    isFull18: round.status === 'complete' && results.length === 18,
    strokes,
    par,
    toPar: strokes - par,
    front: sumNine(results, 1, 9),
    back: sumNine(results, 10, 18),
    putts: { total: puttsEntered.reduce((s, r) => s + (r.score.putts ?? 0), 0), entered: puttsEntered.length },
    fairways: count((r) => (r.hole.par > 3 ? r.score.fairway : undefined), (v) => v === 'hit'),
    gir: count((r) => r.gir, (v) => v === true),
    penalties: { total: penEntered.reduce((s, r) => s + (r.score.penalties ?? 0), 0), entered: penEntered.length },
    eagles: results.filter((r) => r.toPar <= -2).length,
    birdies: results.filter((r) => r.toPar === -1).length,
    pars: results.filter((r) => r.toPar === 0).length,
    bogeys: results.filter((r) => r.toPar === 1).length,
    doublesPlus: results.filter((r) => r.toPar >= 2).length,
    results,
  };
}

export interface CareerStats {
  rounds: number;
  full18Rounds: number;
  avgScore: number | null; // full 18-hole rounds only
  avgToPar: number | null;
  best: { strokes: number; toPar: number; roundId: string } | null;
  puttsPerRound: number | null; // per-hole average × 18
  fairwayPct: number | null;
  girPct: number | null;
  birdies: number;
  eagles: number;
  holesPlayed: number;
  scoring: { eagles: number; birdies: number; pars: number; bogeys: number; doublesPlus: number };
}

const pct = (hit: number, entered: number) => (entered ? hit / entered : null);

export function careerStats(summaries: RoundSummary[]): CareerStats {
  const complete = summaries.filter((s) => s.isComplete);
  const full = complete.filter((s) => s.isFull18);
  const sum = (f: (s: RoundSummary) => number) => complete.reduce((a, s) => a + f(s), 0);
  const best = full.reduce<RoundSummary | null>((b, s) => (!b || s.strokes < b.strokes ? s : b), null);
  const puttsEntered = sum((s) => s.putts.entered);
  return {
    rounds: complete.length,
    full18Rounds: full.length,
    avgScore: full.length ? full.reduce((a, s) => a + s.strokes, 0) / full.length : null,
    avgToPar: full.length ? full.reduce((a, s) => a + s.toPar, 0) / full.length : null,
    best: best ? { strokes: best.strokes, toPar: best.toPar, roundId: best.roundId } : null,
    puttsPerRound: puttsEntered ? (sum((s) => s.putts.total) / puttsEntered) * 18 : null,
    fairwayPct: pct(sum((s) => s.fairways.hit), sum((s) => s.fairways.entered)),
    girPct: pct(sum((s) => s.gir.hit), sum((s) => s.gir.entered)),
    birdies: sum((s) => s.birdies),
    eagles: sum((s) => s.eagles),
    holesPlayed: sum((s) => s.holesPlayed),
    scoring: {
      eagles: sum((s) => s.eagles),
      birdies: sum((s) => s.birdies),
      pars: sum((s) => s.pars),
      bogeys: sum((s) => s.bogeys),
      doublesPlus: sum((s) => s.doublesPlus),
    },
  };
}

export function formatToPar(toPar: number): string {
  if (toPar === 0) return 'E';
  return toPar > 0 ? `+${toPar}` : `${toPar}`;
}
