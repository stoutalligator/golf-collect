/**
 * Leagues, tournaments and scheduled rounds: one rules engine for every format.
 *
 * - An **event** has a kind (league season · tournament · scheduled round), a format, members and scheduled
 *   event rounds. Players log their own rounds and link them to an event round.
 * - The **format** is config: scoring (stroke · stableford · match), gross or net, handicap allowance, and for
 *   leagues a points table by finishing position. New formats are new config values, not new code paths.
 *
 * Pure TypeScript, no React. Handicaps use the World Handicap System course-handicap formula.
 */
import { ratingFor } from './layout';
import type { Hole, ISODate, Tee } from './types';

// ── Types ──────────────────────────────────────────────────────────────────

export type EventKind = 'league' | 'tournament' | 'outing';
export type Scoring = 'stroke' | 'stableford' | 'match';
export type Basis = 'gross' | 'net';

export interface EventFormat {
  scoring: Scoring;
  basis: Basis;
  /** Percent of course handicap used for net scoring (WHS recommends 95% stroke play, 100% match play). */
  allowance: number;
  /** League season: points by finishing position each event round (1st, 2nd, …); later finishers get 0. */
  seasonPoints?: number[];
  /** League season: only a player's best N event-round point totals count (undefined = all). */
  countBest?: number;
  /** Scheduled round: group size (2–4 = twosome…foursome); undefined = no limit. */
  spots?: number;
  /** Scheduled round: the organizer's note to the group ("Carts on me, meet at the range"). */
  note?: string;
  /** Scheduled round: played as a team scramble (rounds logged for it are scrambles; they don't count for stats). */
  team?: 'scramble';
}

export const DEFAULT_SEASON_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export const defaultFormat = (kind: EventKind, scoring: Scoring = 'stroke', basis: Basis = 'net'): EventFormat => ({
  scoring,
  basis,
  allowance: scoring === 'match' ? 100 : 95,
  ...(kind === 'league' ? { seasonPoints: DEFAULT_SEASON_POINTS } : {}),
});

export interface CompetitionEvent {
  id: string;
  kind: EventKind;
  name: string;
  organizerId: string;
  format: EventFormat;
  /** Short code others can use to join (organizer shares it). */
  joinCode: string;
  startsOn: ISODate;
  endsOn?: ISODate;
  createdAt: string;
}

export type MemberStatus = 'invited' | 'joined' | 'declined';

export interface EventMember {
  eventId: string;
  playerId: string;
  role: 'organizer' | 'player';
  status: MemberStatus;
}

export interface EventRound {
  id: string;
  eventId: string;
  seq: number;
  name: string;
  courseId: string;
  teeId?: string;
  scheduledOn: ISODate;
  /** "HH:MM" local tee time, if set. */
  teeTime?: string;
  holes: 'all' | 'front' | 'back';
}

/** Match play pairing for one event round. */
export interface EventMatch {
  id: string;
  eventRoundId: string;
  playerA: string;
  playerB: string;
}

// ── Handicap ───────────────────────────────────────────────────────────────

/**
 * WHS course handicap: index × slope / 113 + (course rating − par), × allowance, rounded.
 * For 9 holes played: half the index, with the rating and par for 9 holes (see `ratingFor`). `courseHoles` is the
 * course's real hole count (a 9-hole course played twice is 18 holes played on a 9-hole course).
 */
export function courseHandicap(index: number, tee: Pick<Tee, 'par' | 'ratings' | 'ratedHoles'>, opts: { allowance?: number; holesPlayed?: number; courseHoles?: number } = {}): number {
  const allowance = (opts.allowance ?? 100) / 100;
  const played = opts.holesPlayed ?? 18;
  const scale = played / 18;
  const r = ratingFor(tee, played, opts.courseHoles ?? 18);
  if (!r) return Math.round(index * scale * allowance);
  const raw = index * scale * (r.slope / 113) + (r.rating - r.par);
  return Math.round(raw * allowance);
}

/**
 * Strokes received on each hole: one per hole in stroke-index order, wrapping for handicaps over the number of
 * holes (e.g. 20 on 18 holes = 2 on SI 1–2, 1 elsewhere). Plus handicaps (negative) give strokes back from SI 18 up.
 */
export function strokesPerHole(handicap: number, holes: Pick<Hole, 'number' | 'handicap'>[]): Map<number, number> {
  const order = [...holes].sort((a, b) => a.handicap - b.handicap);
  const out = new Map(holes.map((h) => [h.number, 0]));
  if (!order.length || handicap === 0) return out;
  const n = order.length;
  if (handicap > 0) {
    for (let i = 0; i < handicap; i++) {
      const h = order[i % n];
      out.set(h.number, out.get(h.number)! + 1);
    }
  } else {
    for (let i = 0; i < -handicap; i++) {
      const h = order[n - 1 - (i % n)];
      out.set(h.number, out.get(h.number)! - 1);
    }
  }
  return out;
}

// ── One player's round in an event ──────────────────────────────────────────

export interface ScoredHole {
  number: number;
  par: number;
  /** Stroke index (1 = hardest). */
  si: number;
  strokes: number;
  /** Handicap strokes received on this hole. */
  received: number;
}

export interface PlayerRoundResult {
  playerId: string;
  roundId: string;
  holesPlayed: number;
  holesPlanned: number;
  complete: boolean;
  gross: number;
  net: number;
  courseHandicap: number;
  /** Stableford points (gross and net). */
  stablefordGross: number;
  stablefordNet: number;
  holes: ScoredHole[];
}

/** Stableford: 2 for par, +1 per stroke under, −1 per stroke over, never below 0. */
export const stablefordPoints = (strokes: number, par: number) => Math.max(0, 2 + par - strokes);

export function playerRoundResult(input: {
  playerId: string;
  roundId: string;
  holes: ScoredHole[];
  holesPlanned: number;
  courseHandicap: number;
}): PlayerRoundResult {
  const { holes } = input;
  const gross = holes.reduce((a, h) => a + h.strokes, 0);
  const received = holes.reduce((a, h) => a + h.received, 0);
  return {
    playerId: input.playerId,
    roundId: input.roundId,
    holesPlayed: holes.length,
    holesPlanned: input.holesPlanned,
    complete: holes.length === input.holesPlanned,
    gross,
    net: gross - received,
    courseHandicap: input.courseHandicap,
    stablefordGross: holes.reduce((a, h) => a + stablefordPoints(h.strokes, h.par), 0),
    stablefordNet: holes.reduce((a, h) => a + stablefordPoints(h.strokes - h.received, h.par), 0),
    holes,
  };
}

/** The number a format ranks by, and whether lower is better. */
export function metric(r: PlayerRoundResult, f: EventFormat): { value: number; lowerWins: boolean } {
  if (f.scoring === 'stableford') return { value: f.basis === 'net' ? r.stablefordNet : r.stablefordGross, lowerWins: false };
  return { value: f.basis === 'net' ? r.net : r.gross, lowerWins: true };
}

// ── Leaderboards ───────────────────────────────────────────────────────────

export interface Standing {
  playerId: string;
  /** 1-based; ties share a position. */
  position: number;
  tied: boolean;
  value: number;
  /** Event rounds this player has a complete result for. */
  rounds: number;
}

/** Rank by value with shared positions for ties ("T2"). */
export function rank<T extends { playerId: string; value: number; rounds: number }>(rows: T[], lowerWins: boolean): (T & { position: number; tied: boolean })[] {
  const sorted = [...rows].sort((a, b) => b.rounds - a.rounds || (lowerWins ? a.value - b.value : b.value - a.value) || a.playerId.localeCompare(b.playerId));
  return sorted.map((r) => {
    const better = sorted.filter((o) => o.rounds > r.rounds || (o.rounds === r.rounds && (lowerWins ? o.value < r.value : o.value > r.value))).length;
    const same = sorted.filter((o) => o.rounds === r.rounds && o.value === r.value).length;
    return { ...r, position: better + 1, tied: same > 1 };
  });
}

/** One event round's leaderboard (stroke / stableford). Only complete rounds are ranked. */
export function roundLeaderboard(results: PlayerRoundResult[], f: EventFormat): Standing[] {
  const complete = results.filter((r) => r.complete);
  const { lowerWins } = complete[0] ? metric(complete[0], f) : { lowerWins: f.scoring !== 'stableford' };
  return rank(complete.map((r) => ({ playerId: r.playerId, value: metric(r, f).value, rounds: 1 })), lowerWins);
}

/**
 * Tournament leaderboard: totals across event rounds. Players who've completed more rounds rank ahead of those
 * still to play (so a partial total never "leads" by being lower).
 */
export function tournamentLeaderboard(byRound: PlayerRoundResult[][], f: EventFormat): Standing[] {
  const totals = new Map<string, { value: number; rounds: number }>();
  for (const results of byRound) {
    for (const r of results.filter((x) => x.complete)) {
      const t = totals.get(r.playerId) ?? { value: 0, rounds: 0 };
      totals.set(r.playerId, { value: t.value + metric(r, f).value, rounds: t.rounds + 1 });
    }
  }
  return rank([...totals].map(([playerId, t]) => ({ playerId, ...t })), f.scoring !== 'stableford');
}

/** Season points for one event round from its leaderboard: tied players split the points for the places they span. */
export function seasonPointsFor(standings: Standing[], table: number[] = DEFAULT_SEASON_POINTS): Map<string, number> {
  const out = new Map<string, number>();
  const groups = new Map<number, Standing[]>();
  standings.forEach((s) => groups.set(s.position, [...(groups.get(s.position) ?? []), s]));
  for (const [pos, group] of groups) {
    const places = Array.from({ length: group.length }, (_, i) => table[pos - 1 + i] ?? 0);
    const each = places.reduce((a, b) => a + b, 0) / group.length;
    group.forEach((s) => out.set(s.playerId, Math.round(each * 10) / 10));
  }
  return out;
}

export interface SeasonRow {
  playerId: string;
  position: number;
  tied: boolean;
  points: number;
  /** Points per event round, in schedule order (undefined = didn't play). */
  perRound: (number | undefined)[];
  rounds: number;
  wins: number;
}

/** League season table: points by finishing position each event round, optionally best N rounds only. */
export function seasonStandings(roundBoards: Standing[][], f: EventFormat, memberIds: string[]): SeasonRow[] {
  const perRound = roundBoards.map((b) => seasonPointsFor(b, f.seasonPoints ?? DEFAULT_SEASON_POINTS));
  const rows = memberIds.map((playerId) => {
    const pts = perRound.map((m) => m.get(playerId));
    const counted = pts.filter((p): p is number => p !== undefined).sort((a, b) => b - a).slice(0, f.countBest ?? Infinity);
    return {
      playerId,
      perRound: pts,
      rounds: pts.filter((p) => p !== undefined).length,
      wins: roundBoards.filter((b) => b.some((s) => s.playerId === playerId && s.position === 1)).length,
      points: Math.round(counted.reduce((a, b) => a + b, 0) * 10) / 10,
    };
  });
  // Season tables rank on points alone (rounds played doesn't gate position).
  const ranked = rank(rows.map((r) => ({ ...r, value: r.points, rounds: 0 })), false);
  return ranked.map(({ value: _v, ...r }) => ({ ...r, rounds: rows.find((x) => x.playerId === r.playerId)!.rounds }));
}

// ── Match play ─────────────────────────────────────────────────────────────

export interface MatchResult {
  matchId: string;
  playerA: string;
  playerB: string;
  /** Holes up for A after the holes both have played (negative = B up). */
  aUp: number;
  holesPlayed: number;
  holesLeft: number;
  /** Decided early (up by more than holes left) or after the last hole. */
  finished: boolean;
  winner: string | null; // null = halved / not finished
  /** "3 & 2", "1 up", "Halved", "A 2 up thru 12". */
  summary: string;
  pointsA: number;
  pointsB: number;
}

/**
 * Net (or gross) match play over holes both players have scored. Strokes are taken off the lower handicap
 * (the higher-handicap player receives the difference), per match play convention.
 */
export function matchResult(m: EventMatch, a: PlayerRoundResult | undefined, b: PlayerRoundResult | undefined, f: EventFormat, holeCount: number): MatchResult {
  const base = { matchId: m.id, playerA: m.playerA, playerB: m.playerB };
  if (!a || !b) return { ...base, aUp: 0, holesPlayed: 0, holesLeft: holeCount, finished: false, winner: null, summary: 'Not started', pointsA: 0, pointsB: 0 };
  const diff = f.basis === 'net' ? a.courseHandicap - b.courseHandicap : 0;
  const holes = a.holes.map((h) => h.number).filter((n) => b.holes.some((x) => x.number === n)).sort((x, y) => x - y);
  // The higher handicap receives the difference, allocated by stroke index over the round's holes.
  const layout = new Map([...a.holes, ...b.holes].map((h) => [h.number, h.si]));
  const received = strokesPerHole(Math.abs(diff), [...layout].map(([number, handicap]) => ({ number, handicap })));
  let aUp = 0;
  let played = 0;
  for (const n of holes) {
    const sa = a.holes.find((h) => h.number === n)!.strokes - (diff > 0 ? received.get(n) ?? 0 : 0);
    const sb = b.holes.find((h) => h.number === n)!.strokes - (diff < 0 ? received.get(n) ?? 0 : 0);
    if (sa < sb) aUp++;
    else if (sb < sa) aUp--;
    played++;
    if (Math.abs(aUp) > holeCount - played) break; // decided
  }
  const left = holeCount - played;
  const finished = Math.abs(aUp) > left || left === 0;
  const winner = finished && aUp !== 0 ? (aUp > 0 ? m.playerA : m.playerB) : null;
  const lead = Math.abs(aUp);
  const summary = !finished
    ? aUp === 0 ? `All square thru ${played}` : `${aUp > 0 ? 'A' : 'B'} ${lead} up thru ${played}`
    : aUp === 0 ? 'Halved'
      : left > 0 ? `${lead} & ${left}` : `${lead} up`;
  const pointsA = finished ? (aUp > 0 ? 1 : aUp === 0 ? 0.5 : 0) : 0;
  const pointsB = finished ? (aUp < 0 ? 1 : aUp === 0 ? 0.5 : 0) : 0;
  return { ...base, aUp, holesPlayed: played, holesLeft: left, finished, winner, summary, pointsA, pointsB };
}

/**
 * Round-robin pairings (circle method): every player meets every other once, spread over event rounds.
 * Odd counts get a bye each round. Returns one list of [a, b] pairs per round.
 */
export function roundRobin(playerIds: string[]): [string, string][][] {
  const ids = [...playerIds];
  if (ids.length < 2) return [];
  if (ids.length % 2) ids.push('__bye__');
  const n = ids.length;
  const rounds: [string, string][][] = [];
  const rot = ids.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const order = [ids[0], ...rot];
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = order[i];
      const b = order[n - 1 - i];
      if (a !== '__bye__' && b !== '__bye__') pairs.push([a, b]);
    }
    rounds.push(pairs);
    rot.unshift(rot.pop()!);
  }
  return rounds;
}

// ── Labels ─────────────────────────────────────────────────────────────────

export const FORMAT_LABEL = (f: EventFormat) => {
  const basis = f.basis === 'net' ? 'Net' : 'Gross';
  return f.scoring === 'stroke' ? `${basis} stroke play` : f.scoring === 'stableford' ? `${basis} Stableford` : `${basis} match play`;
};

export const KIND_LABEL: Record<EventKind, string> = { league: 'League', tournament: 'Tournament', outing: 'Scheduled round' };

export const positionLabel = (s: { position: number; tied: boolean }) => `${s.tied ? 'T' : ''}${s.position}`;

/** Short, unambiguous join code (no 0/O/1/I). */
export function makeJoinCode(rand: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join('');
}
