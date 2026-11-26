/**
 * Derived views over leagues, tournaments and scheduled rounds: who's in, what's scheduled, and results computed
 * by the pure rules engine in domain/competition from the rounds players linked to each event round.
 */
import { useMemo } from 'react';

import {
  courseHandicap, matchResult, playerRoundResult, roundLeaderboard, seasonStandings, strokesPerHole, tournamentLeaderboard,
  type CompetitionEvent, type EventMatch, type EventMember, type EventRound, type MatchResult, type PlayerRoundResult,
  type SeasonRow, type Standing,
} from '@/domain/competition';
import type { Course, Player, Round } from '@/domain/types';
import { todayISO } from '@/lib/format';

import { useAppData, type AppData } from './app-data';

export interface EventRoundView {
  round: EventRound;
  course: Course | undefined;
  courseName: string;
  /** Linked rounds by player id (latest per player). */
  linked: Map<string, Round>;
  results: PlayerRoundResult[];
  board: Standing[];
  matches: MatchResult[];
  status: 'upcoming' | 'today' | 'past';
}

export interface MatchRow {
  playerId: string;
  played: number;
  won: number;
  lost: number;
  halved: number;
  points: number;
  position: number;
}

export interface EventView {
  event: CompetitionEvent;
  organizer: Player | undefined;
  members: (EventMember & { player: Player | undefined })[];
  joined: Player[];
  invited: Player[];
  myMembership: EventMember | undefined;
  isOrganizer: boolean;
  rounds: EventRoundView[];
  /** League season table. */
  season: SeasonRow[] | null;
  /** Tournament totals (stroke / stableford). */
  leaderboard: Standing[] | null;
  /** Match play points table. */
  matchTable: MatchRow[] | null;
  /** Players with no handicap index yet (net scoring treats them as scratch). */
  noHandicap: Player[];
  next: EventRoundView | undefined;
}

const roundStatus = (date: string): EventRoundView['status'] => {
  const today = todayISO();
  return date === today ? 'today' : date > today ? 'upcoming' : 'past';
};

function holeNumbersFor(er: EventRound, course: Course | undefined): number[] {
  const all = course?.holes.map((h) => h.number) ?? [];
  return er.holes === 'front' ? all.slice(0, 9) : er.holes === 'back' ? all.slice(9, 18) : all;
}

export function buildEventView(data: AppData, event: CompetitionEvent): EventView {
  const members = data.eventMembers.filter((m) => m.eventId === event.id).map((m) => ({ ...m, player: data.playerById(m.playerId) }));
  const joined = members.filter((m) => m.status === 'joined').map((m) => m.player).filter((p): p is Player => !!p);
  const invited = members.filter((m) => m.status === 'invited').map((m) => m.player).filter((p): p is Player => !!p);
  const allRounds = [...data.rounds, ...data.friendRounds];
  const f = event.format;

  const handicapOf = (id: string) => data.playerData(id)?.handicap ?? null;

  const rounds: EventRoundView[] = data.eventRounds
    .filter((r) => r.eventId === event.id)
    .sort((a, b) => a.seq - b.seq)
    .map((er) => {
      const course = data.courseById(er.courseId);
      const linked = new Map<string, Round>();
      for (const r of allRounds.filter((x) => x.eventRoundId === er.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
        linked.set(r.ownerId ?? data.me.id, r);
      }
      const planned = holeNumbersFor(er, course).length || 18;
      const results: PlayerRoundResult[] = [];
      for (const [playerId, r] of linked) {
        const summary = data.summaries.get(r.id);
        const tee = course?.tees.find((t) => t.id === (r.teeId ?? er.teeId)) ?? course?.tees[0];
        if (!summary || !course || !tee) continue;
        const ch = courseHandicap(handicapOf(playerId) ?? 0, tee, { allowance: f.allowance, nine: planned === 9 });
        const recv = strokesPerHole(ch, summary.results.map((x) => x.hole));
        results.push(playerRoundResult({
          playerId,
          roundId: r.id,
          holesPlanned: r.holeNumbers.length,
          courseHandicap: ch,
          holes: summary.results.map((x) => ({ number: x.hole.number, par: x.hole.par, si: x.hole.handicap, strokes: x.score.strokes, received: recv.get(x.hole.number) ?? 0 })),
        }));
      }
      const byId = new Map(results.map((r) => [r.playerId, r]));
      const matches = data.eventMatches
        .filter((m: EventMatch) => m.eventRoundId === er.id)
        .map((m) => matchResult(m, byId.get(m.playerA), byId.get(m.playerB), f, planned));
      return {
        round: er,
        course,
        courseName: course?.name ?? data.courseSummary(er.courseId)?.name ?? 'Course',
        linked,
        results,
        board: f.scoring === 'match' ? [] : roundLeaderboard(results, f),
        matches,
        status: roundStatus(er.scheduledOn),
      };
    });

  const memberIds = joined.map((p) => p.id);
  let season: SeasonRow[] | null = null;
  let leaderboard: Standing[] | null = null;
  let matchTable: MatchRow[] | null = null;
  if (event.kind === 'league' && f.scoring !== 'match') season = seasonStandings(rounds.map((r) => r.board), f, memberIds);
  if (event.kind === 'tournament' && f.scoring !== 'match') leaderboard = tournamentLeaderboard(rounds.map((r) => r.results), f);
  if (f.scoring === 'match' && event.kind !== 'outing') {
    const rows = new Map(memberIds.map((id) => [id, { playerId: id, played: 0, won: 0, lost: 0, halved: 0, points: 0, position: 0 }]));
    for (const m of rounds.flatMap((r) => r.matches).filter((x) => x.finished)) {
      for (const [id, pts] of [[m.playerA, m.pointsA], [m.playerB, m.pointsB]] as const) {
        const row = rows.get(id) ?? { playerId: id, played: 0, won: 0, lost: 0, halved: 0, points: 0, position: 0 };
        row.played++;
        row.points += pts;
        if (pts === 1) row.won++;
        else if (pts === 0.5) row.halved++;
        else row.lost++;
        rows.set(id, row);
      }
    }
    const sorted = [...rows.values()].sort((a, b) => b.points - a.points || b.won - a.won);
    matchTable = sorted.map((r) => ({ ...r, position: sorted.filter((o) => o.points > r.points).length + 1 }));
  }

  const myMembership = members.find((m) => m.playerId === data.me.id);
  return {
    event,
    organizer: data.playerById(event.organizerId),
    members,
    joined,
    invited,
    myMembership,
    isOrganizer: event.organizerId === data.me.id,
    rounds,
    season,
    leaderboard,
    matchTable,
    noHandicap: f.basis === 'net' ? joined.filter((p) => handicapOf(p.id) === null) : [],
    next: rounds.find((r) => r.status !== 'past'),
  };
}

/** One event, fully derived. */
export function useEvent(eventId: string | undefined): EventView | undefined {
  const data = useAppData();
  return useMemo(() => {
    const event = data.events.find((e) => e.id === eventId);
    return event ? buildEventView(data, event) : undefined;
  }, [data, eventId]);
}

/** Lists for the Events screen and Home: invitations, your events, and upcoming event rounds. */
export function useEventLists() {
  const data = useAppData();
  return useMemo(() => {
    const mine = data.eventMembers.filter((m) => m.playerId === data.me.id);
    const statusOf = (id: string) => mine.find((m) => m.eventId === id)?.status;
    const invitations = data.events.filter((e) => statusOf(e.id) === 'invited');
    const active = data.events.filter((e) => statusOf(e.id) === 'joined' || e.organizerId === data.me.id);
    const today = todayISO();
    const upcoming = data.eventRounds
      .filter((r) => active.some((e) => e.id === r.eventId) && r.scheduledOn >= today)
      .sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn) || (a.teeTime ?? '').localeCompare(b.teeTime ?? ''))
      .map((r) => ({ round: r, event: data.events.find((e) => e.id === r.eventId)!, courseName: data.courseById(r.courseId)?.name ?? data.courseSummary(r.courseId)?.name ?? 'Course' }));
    return { invitations, active, upcoming };
  }, [data]);
}

/** Event rounds you could link a new round at this course to (scheduled within a week either side of today). */
export function linkableEventRounds(data: AppData, courseId: string | undefined) {
  if (!courseId) return [];
  const today = new Date(`${todayISO()}T12:00:00`);
  const within = (iso: string) => Math.abs(new Date(`${iso}T12:00:00`).getTime() - today.getTime()) <= 7 * 864e5;
  const joined = new Set(data.eventMembers.filter((m) => m.playerId === data.me.id && m.status === 'joined').map((m) => m.eventId));
  return data.eventRounds
    .filter((r) => joined.has(r.eventId) && r.courseId === courseId && within(r.scheduledOn))
    .map((r) => ({ round: r, event: data.events.find((e) => e.id === r.eventId)! }))
    .filter((x) => x.event);
}
