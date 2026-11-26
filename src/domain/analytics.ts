/**
 * Performance analytics for the Stats dashboard. Pure functions over round summaries.
 * Every optional stat only uses holes where it was entered (undefined ≠ 0).
 */
import type { HoleResult, RoundSummary } from './stats';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const ratio = (hit: number, of: number) => (of ? hit / of : null);

/** Completed rounds, oldest first. */
export const chronological = (summaries: RoundSummary[]) =>
  summaries.filter((s) => s.isComplete).sort((a, b) => a.date.localeCompare(b.date) || a.roundId.localeCompare(b.roundId));

/** The most recent `n` completed rounds (all when n is undefined), oldest first. */
export function recentRounds(summaries: RoundSummary[], n?: number): RoundSummary[] {
  const all = chronological(summaries);
  return n === undefined ? all : all.slice(-n);
}

// ── Handicap (World Handicap System, simplified) ───────────────────────────

/** Score differential = (113 / slope) × (adjusted gross − course rating), to one decimal. */
export function scoreDifferential(strokes: number, rating: number, slope: number): number {
  return Math.round(((113 / slope) * (strokes - rating)) * 10) / 10;
}

/** How many of the lowest differentials count, and the adjustment, for 3..20 scores (WHS table). */
const WHS_TABLE: Record<number, [use: number, adjust: number]> = {
  3: [1, -2], 4: [1, -1], 5: [1, 0], 6: [2, -1], 7: [2, 0], 8: [2, 0],
  9: [3, 0], 10: [3, 0], 11: [3, 0], 12: [4, 0], 13: [4, 0], 14: [4, 0],
  15: [5, 0], 16: [5, 0], 17: [6, 0], 18: [6, 0], 19: [7, 0], 20: [8, 0],
};

/**
 * Handicap index from differentials (oldest first). Uses the most recent 20; needs at least 3.
 * Not an official index: no playing-conditions or exceptional-score adjustments, and gross (not net double bogey) scores.
 */
export function handicapIndex(differentials: number[]): number | null {
  const recent = differentials.slice(-20);
  const row = WHS_TABLE[recent.length];
  if (!row) return null;
  const [use, adjust] = row;
  const best = [...recent].sort((a, b) => a - b).slice(0, use);
  const index = best.reduce((a, b) => a + b, 0) / use + adjust;
  return Math.round(Math.min(54, index) * 10) / 10;
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export interface TrendPoint {
  roundId: string;
  date: string;
  strokes: number;
  toPar: number;
}

export interface ParTypeStat {
  par: 3 | 4 | 5;
  holes: number;
  /** Average strokes on holes of this par. */
  avgStrokes: number | null;
  /** Average strokes over par. */
  avgToPar: number | null;
  birdieRate: number | null;
}

export interface Analytics {
  rounds: number;
  full18: number;
  /** Full 18-hole rounds, oldest first. */
  trend: TrendPoint[];
  avgScore: number | null;
  avgToPar: number | null;
  best: TrendPoint | null;
  scoring: { eagles: number; birdies: number; pars: number; bogeys: number; doublesPlus: number; holes: number };
  /** Per-round averages of birdies-or-better and doubles-or-worse (per 18 holes). */
  birdiesPer18: number | null;
  doublesPer18: number | null;
  parTypes: ParTypeStat[];
  driving: { entered: number; hit: number; left: number; right: number; short: number; pct: number | null };
  approach: { entered: number; hit: number; pct: number | null };
  putting: {
    entered: number;
    perRound: number | null;
    perHole: number | null;
    /** Putts per green hit in regulation. */
    perGir: number | null;
    onePuttPct: number | null;
    threePuttsPer18: number | null;
  };
  /** Par or better after missing the green in regulation. */
  scrambling: { chances: number; saves: number; pct: number | null };
  penaltiesPer18: number | null;
  /** Average strokes over par on each nine (full nines only). */
  frontNine: number | null;
  backNine: number | null;
}

const per18 = (count: number, holes: number) => (holes ? (count / holes) * 18 : null);

export function analytics(summaries: RoundSummary[]): Analytics {
  const rounds = chronological(summaries);
  const full = rounds.filter((s) => s.isFull18);
  const holes: HoleResult[] = rounds.flatMap((s) => s.results);
  const trend = full.map((s) => ({ roundId: s.roundId, date: s.date, strokes: s.strokes, toPar: s.toPar }));
  const best = trend.reduce<TrendPoint | null>((b, t) => (!b || t.strokes < b.strokes ? t : b), null);

  const count = (test: (h: HoleResult) => boolean) => holes.filter(test).length;
  const scoring = {
    eagles: count((h) => h.toPar <= -2),
    birdies: count((h) => h.toPar === -1),
    pars: count((h) => h.toPar === 0),
    bogeys: count((h) => h.toPar === 1),
    doublesPlus: count((h) => h.toPar >= 2),
    holes: holes.length,
  };

  const parTypes = ([3, 4, 5] as const).map((par): ParTypeStat => {
    const hs = holes.filter((h) => h.hole.par === par);
    return {
      par,
      holes: hs.length,
      avgStrokes: avg(hs.map((h) => h.score.strokes)),
      avgToPar: avg(hs.map((h) => h.toPar)),
      birdieRate: ratio(hs.filter((h) => h.toPar <= -1).length, hs.length),
    };
  });

  const tee = holes.filter((h) => h.hole.par > 3 && h.score.fairway !== undefined);
  const fw = (v: string) => tee.filter((h) => h.score.fairway === v).length;
  const girHoles = holes.filter((h) => h.gir !== undefined);
  const putts = holes.filter((h) => h.score.putts !== undefined);
  const puttsOnGir = putts.filter((h) => h.gir === true);
  const missed = holes.filter((h) => h.gir === false);
  const pens = holes.filter((h) => h.score.penalties !== undefined);

  const nine = (pick: (s: RoundSummary) => { strokes: number; par: number } | null) =>
    avg(rounds.map(pick).filter((n): n is { strokes: number; par: number } => n !== null).map((n) => n.strokes - n.par));

  return {
    rounds: rounds.length,
    full18: full.length,
    trend,
    avgScore: avg(full.map((s) => s.strokes)),
    avgToPar: avg(full.map((s) => s.toPar)),
    best,
    scoring,
    birdiesPer18: per18(scoring.birdies + scoring.eagles, scoring.holes),
    doublesPer18: per18(scoring.doublesPlus, scoring.holes),
    parTypes,
    driving: { entered: tee.length, hit: fw('hit'), left: fw('left'), right: fw('right'), short: fw('short'), pct: ratio(fw('hit'), tee.length) },
    approach: { entered: girHoles.length, hit: girHoles.filter((h) => h.gir).length, pct: ratio(girHoles.filter((h) => h.gir).length, girHoles.length) },
    putting: {
      entered: putts.length,
      perRound: putts.length ? (putts.reduce((a, h) => a + h.score.putts!, 0) / putts.length) * 18 : null,
      perHole: avg(putts.map((h) => h.score.putts!)),
      perGir: avg(puttsOnGir.map((h) => h.score.putts!)),
      onePuttPct: ratio(putts.filter((h) => h.score.putts! <= 1).length, putts.length),
      threePuttsPer18: per18(putts.filter((h) => h.score.putts! >= 3).length, putts.length),
    },
    scrambling: { chances: missed.length, saves: missed.filter((h) => h.toPar <= 0).length, pct: ratio(missed.filter((h) => h.toPar <= 0).length, missed.length) },
    penaltiesPer18: pens.length ? per18(pens.reduce((a, h) => a + h.score.penalties!, 0), pens.length) : null,
    frontNine: nine((s) => s.front),
    backNine: nine((s) => s.back),
  };
}

/** Change between the older and newer half of a series (negative = lower/better scores). */
export function trendDelta(values: number[]): number | null {
  if (values.length < 4) return null;
  const half = Math.floor(values.length / 2);
  const a = avg(values.slice(0, half))!;
  const b = avg(values.slice(-half))!;
  return b - a;
}
