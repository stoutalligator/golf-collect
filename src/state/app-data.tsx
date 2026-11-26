import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { ACHIEVEMENTS, collectiblesForCourse, TIERS } from '@/data/config/game';
import { LocalRepository, type AppSnapshot, type NewEvent, type Repository } from '@/data/repository';
import type { EventFormat, EventRound } from '@/domain/competition';
import { SupabaseRepository } from '@/data/supabase-repository';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/state/auth';
import { evaluateAchievements, type AchievementState } from '@/domain/achievements';
import { handicapIndex, scoreDifferential } from '@/domain/analytics';
import { playLayout, ratingFor } from '@/domain/layout';
import { courseCollection, type CourseCollection, type ItemState } from '@/domain/collection';
import { careerStats, summarizeRound, type CareerStats, type HoleLayout, type RoundSummary } from '@/domain/stats';
import { roundOwner, type Comment, type Course, type CourseSummary, type Player, type Reaction, type ReactionEmoji, type Round, type SimCourse, type Tier } from '@/domain/types';

/** Everything derived for one player (you or a friend) from their rounds. */
export interface PlayerData {
  player: Player;
  /** Newest first. */
  rounds: Round[];
  courseStats: CareerStats;
  simStats: CareerStats;
  collections: Map<string, CourseCollection>;
  achievements: AchievementState[];
  /** Estimated handicap index from full 18-hole course rounds with a rated tee. */
  handicap: number | null;
  /** Score differential per round id (rated full 18s only). */
  differentials: Map<string, number>;
  coursesPlayed: number;
  collectiblesEarned: number;
}

/** What a single round earned its owner. */
export interface RoundEarnings {
  tier: { tier: Tier } | null;
  items: ItemState[];
  badges: AchievementState[];
  total: number;
}

export interface FeedPost {
  round: Round;
  owner: Player;
  summary: RoundSummary;
  /** Other players on the round. */
  with: Player[];
  earned: RoundEarnings;
  reactions: Reaction[];
  comments: Comment[];
}

export interface AppData extends AppSnapshot {
  ready: boolean;
  /** Set when the last load failed (e.g. offline). */
  error: string | null;
  /** True when running on bundled sample data instead of Supabase. */
  offline: boolean;
  /** Summary of every round (yours and friends'), for the round's owner. */
  summaries: Map<string, RoundSummary>;
  /** Your rounds, newest first. */
  roundsByDate: Round[];
  courseStats: CareerStats;
  simStats: CareerStats;
  collections: Map<string, CourseCollection>;
  achievements: AchievementState[];
  handicap: number | null;
  meData: PlayerData;
  /** Completed rounds from you and your friends, newest first. */
  feed: FeedPost[];
  playerById(id: string): Player | undefined;
  playerData(id: string): PlayerData | undefined;
  /** Any round (yours or a friend's). */
  roundById(id: string): Round | undefined;
  earnedInRound(round: Round): RoundEarnings;
  layoutFor(round: Round): HoleLayout | undefined;
  /** Full scorecard when loaded (see `useCourse` / `loadCourses`). */
  courseById(id: string): Course | undefined;
  /** Lightweight listing for any course in the database. */
  courseSummary(id: string): CourseSummary | undefined;
  /** Load full scorecards for these courses (no-op for ones already loaded). */
  loadCourses(ids: string[]): Promise<void>;
  simCourseById(id: string): SimCourse | undefined;
  /** Display name for a round's course (real or sim). */
  roundCourseName(round: Round): string;
  saveRound(round: Round): Promise<void>;
  deleteRound(id: string): Promise<void>;
  toggleWishlist(courseId: string): Promise<void>;
  react(roundId: string, emoji: ReactionEmoji): Promise<void>;
  addComment(roundId: string, text: string): Promise<void>;
  /** Offline demo only. */
  resetToSample?(): Promise<void>;
  clearRounds(): Promise<void>;
  /** Refetch everything from the server (pull to refresh). */
  refresh(): Promise<void>;
  searchPlayers(query: string): Promise<Player[]>;
  sendFriendRequest(playerId: string): Promise<void>;
  respondToRequest(playerId: string, accept: boolean): Promise<void>;
  removeFriend(playerId: string): Promise<void>;
  createEvent(input: NewEvent): Promise<string>;
  joinEvent(code: string): Promise<string>;
  respondToEvent(eventId: string, accept: boolean): Promise<void>;
  inviteToEvent(eventId: string, playerIds: string[]): Promise<void>;
  leaveEvent(eventId: string): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  setPairings(eventRoundId: string, pairs: [string, string][]): Promise<void>;
  updateEvent(eventId: string, changes: { name?: string; format?: EventFormat }): Promise<void>;
  updateEventRound(eventRoundId: string, changes: Partial<Pick<EventRound, 'scheduledOn' | 'teeTime' | 'courseId' | 'teeId' | 'holes'>>): Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

const EMPTY: AppSnapshot = {
  me: { id: 'me', name: '', initials: '', isMe: true }, friends: [], others: [], requests: { incoming: [], outgoing: [] },
  courseIndex: [], courses: [], simCourses: [], rounds: [], friendRounds: [], wishlist: [], social: { reactions: {}, comments: {} },
  events: [], eventMembers: [], eventRounds: [], eventMatches: [],
};

const byNewest = (a: Round, b: Round) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  // One repository per signed-in user: Supabase when configured, the local demo otherwise.
  const repo = useMemo<Repository | null>(() => {
    if (!auth.userId) return null;
    return supabase ? new SupabaseRepository(supabase, auth.userId) : new LocalRepository();
  }, [auth.userId]);
  const [snap, setSnap] = useState<AppSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    if (!repo) return;
    try {
      setSnap(await repo.load(force));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReady(true);
    }
  }, [repo]);

  // New user (sign in / out): start from empty and load their data.
  const [loadedFor, setLoadedFor] = useState<Repository | null>(null);
  if (loadedFor !== repo) {
    setLoadedFor(repo);
    setSnap(EMPTY);
    setReady(false);
  }
  useEffect(() => {
    reload();
  }, [reload]);

  const derived = useMemo(() => {
    const courseMap = new Map(snap.courses.map((c) => [c.id, c]));
    const indexMap = new Map(snap.courseIndex.map((c) => [c.id, c]));
    const simMap = new Map(snap.simCourses.map((c) => [c.id, c]));
    const players = new Map([snap.me, ...snap.friends, ...snap.others].map((p) => [p.id, p]));
    // 9-hole courses play as 18 virtual holes when you go around twice (see domain/layout).
    const playable = new Map(snap.courses.map((c) => [c.id, playLayout(c)]));
    const layoutFor = (r: Round): HoleLayout | undefined => (r.kind === 'sim' ? simMap.get(r.courseId) : playable.get(r.courseId));
    const allRounds = [...snap.rounds, ...snap.friendRounds];
    const roundMap = new Map(allRounds.map((r) => [r.id, r]));

    const summaries = new Map<string, RoundSummary>();
    for (const r of allRounds) {
      const layout = layoutFor(r);
      if (layout) summaries.set(r.id, summarizeRound(r, layout, roundOwner(r)));
    }

    const buildPlayer = (player: Player): PlayerData => {
      const rounds = allRounds.filter((r) => roundOwner(r) === player.id).sort(byNewest);
      const done = rounds.map((r) => summaries.get(r.id)).filter((s): s is RoundSummary => !!s && s.isComplete);
      const collections = new Map(snap.courses.map((c) => [c.id, courseCollection(c, done, TIERS, collectiblesForCourse(c.id))]));
      const differentials = new Map<string, number>();
      for (const r of [...rounds].reverse()) {
        const s = summaries.get(r.id);
        const course = r.kind === 'course' ? courseMap.get(r.courseId) : undefined;
        const tee = course?.tees.find((t) => t.id === r.teeId);
        const rating = course && tee ? ratingFor(tee, 18, course.holes.length) : undefined;
        if (s?.isFull18 && rating) differentials.set(r.id, scoreDifferential(s.strokes, rating.rating, rating.slope));
      }
      const cols = [...collections.values()];
      return {
        player,
        rounds,
        courseStats: careerStats(done.filter((s) => s.kind === 'course')),
        simStats: careerStats(done.filter((s) => s.kind === 'sim')),
        collections,
        achievements: evaluateAchievements(ACHIEVEMENTS, done, { courses: snap.courses, simCourses: snap.simCourses, tiers: TIERS, setFor: collectiblesForCourse }),
        handicap: handicapIndex([...differentials.values()]),
        differentials,
        coursesPlayed: cols.filter((c) => c.played).length,
        collectiblesEarned: cols.reduce((n, c) => n + c.earnedCount, 0),
      };
    };

    const playerDataMap = new Map([...players.values()].map((p) => [p.id, buildPlayer(p)]));
    const meData = playerDataMap.get(snap.me.id)!;

    const earnedInRound = (round: Round): RoundEarnings => {
      const pd = playerDataMap.get(roundOwner(round));
      const col = pd && round.kind === 'course' ? pd.collections.get(round.courseId) : undefined;
      const tier = col?.tier?.roundId === round.id ? { tier: col.tier.tier } : null;
      const items = col?.items.filter((i) => i.roundId === round.id && !(tier && i.def.kind === 'ball-marker')) ?? [];
      const badges = pd?.achievements.filter((a) => a.earnedRoundId === round.id) ?? [];
      return { tier, items, badges, total: items.length + badges.length + (tier ? 1 : 0) };
    };

    const feed: FeedPost[] = allRounds
      .filter((r) => r.status === 'complete')
      .sort(byNewest)
      .flatMap((round) => {
        const owner = players.get(roundOwner(round));
        const summary = summaries.get(round.id);
        if (!owner || !summary) return [];
        return [{
          round,
          owner,
          summary,
          with: round.playerIds.filter((id) => id !== owner.id).map((id) => players.get(id)).filter((p): p is Player => !!p),
          earned: earnedInRound(round),
          reactions: snap.social.reactions[round.id] ?? [],
          comments: snap.social.comments[round.id] ?? [],
        }];
      });

    return {
      summaries,
      roundsByDate: meData.rounds,
      courseStats: meData.courseStats,
      simStats: meData.simStats,
      collections: meData.collections,
      achievements: meData.achievements,
      handicap: meData.handicap,
      meData,
      feed,
      playerById: (id: string) => players.get(id),
      playerData: (id: string) => playerDataMap.get(id),
      roundById: (id: string) => roundMap.get(id),
      earnedInRound,
      layoutFor,
      courseById: (id: string) => courseMap.get(id),
      courseSummary: (id: string) => indexMap.get(id),
      simCourseById: (id: string) => simMap.get(id),
      roundCourseName: (r: Round) => (r.kind === 'sim' ? simMap.get(r.courseId)?.name : (courseMap.get(r.courseId) ?? indexMap.get(r.courseId))?.name) ?? 'Unknown course',
    };
  }, [snap]);

  const value = useMemo<AppData>(() => ({
    ...snap,
    ...derived,
    ready,
    error,
    offline: auth.offline,
    saveRound: async (r) => { await repo!.saveRound(r); await reload(); },
    deleteRound: async (id) => { await repo!.deleteRound(id); await reload(); },
    toggleWishlist: async (id) => {
      const next = snap.wishlist.includes(id) ? snap.wishlist.filter((x) => x !== id) : [...snap.wishlist, id];
      await repo!.setWishlist(next);
      await reload();
    },
    react: async (roundId, emoji) => { await repo!.react(roundId, emoji); await reload(); },
    addComment: async (roundId, text) => { await repo!.addComment(roundId, text); await reload(); },
    resetToSample: repo?.resetToSample ? async () => { await repo.resetToSample!(); await reload(); } : undefined,
    clearRounds: async () => { await repo!.clearRounds(); await reload(); },
    refresh: () => reload(true),
    loadCourses: async (ids) => { await repo!.loadCourses(ids); await reload(); },
    searchPlayers: (q) => repo!.searchPlayers(q),
    sendFriendRequest: async (id) => { await repo!.sendFriendRequest(id); await reload(); },
    respondToRequest: async (id, accept) => { await repo!.respondToRequest(id, accept); await reload(); },
    removeFriend: async (id) => { await repo!.removeFriend(id); await reload(); },
    createEvent: async (input) => { const id = await repo!.createEvent(input); await reload(); return id; },
    joinEvent: async (code) => { const id = await repo!.joinEvent(code); await reload(); return id; },
    respondToEvent: async (id, accept) => { await repo!.respondToEvent(id, accept); await reload(); },
    inviteToEvent: async (id, ids) => { await repo!.inviteToEvent(id, ids); await reload(); },
    leaveEvent: async (id) => { await repo!.leaveEvent(id); await reload(); },
    deleteEvent: async (id) => { await repo!.deleteEvent(id); await reload(); },
    setPairings: async (id, pairs) => { await repo!.setPairings(id, pairs); await reload(); },
    updateEvent: async (id, changes) => { await repo!.updateEvent(id, changes); await reload(); },
    updateEventRound: async (id, changes) => { await repo!.updateEventRound(id, changes); await reload(); },
  }), [snap, derived, ready, error, auth.offline, repo, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData must be used inside AppDataProvider');
  return v;
}

/**
 * Full scorecard for a course, loading it on demand the first time it's needed.
 * `loading` is true while fetching; `missing` when the id isn't a known course.
 */
export function useCourse(id: string | undefined): { course: Course | undefined; loading: boolean; missing: boolean } {
  const data = useAppData();
  const course = id ? data.courseById(id) : undefined;
  const known = !!id && (!!course || !!data.courseSummary(id));
  const [failed, setFailed] = useState<string | null>(null);
  const requested = useRef<string | null>(null);
  useEffect(() => {
    if (!id || course || !known || requested.current === id) return;
    requested.current = id;
    data.loadCourses([id]).catch(() => setFailed(id));
  }, [id, course, known, data]);
  return { course, loading: !!id && !course && known && failed !== id, missing: !!id && data.ready && !known };
}
