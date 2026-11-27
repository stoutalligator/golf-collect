import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CompetitionEvent, EventKind, EventFormat, EventMatch, EventMember, EventRound } from '@/domain/competition';
import { summarizeCourse, type Comment, type Course, type CourseSummary, type Player, type ReactionEmoji, type Round, type SimCourse, type SocialState } from '@/domain/types';

import { FRIENDS, generateFriendRounds, generateSampleRounds, ME } from './sample/generate';
import { generateSocial } from './sample/social';
import { SIM_COURSES } from './sample/sim-courses';
import seed from './seed/courses.ct.json';

/** Everything the app reads. `SupabaseRepository` (signed in) and `LocalRepository` (offline demo) both produce it. */
export interface AppSnapshot {
  me: Player;
  friends: Player[];
  /** People who appear on rounds you can see but aren't your friends (e.g. tagged by a friend). */
  others: Player[];
  requests: { incoming: Player[]; outgoing: Player[] };
  /** Every course, lightweight (browse + search). */
  courseIndex: CourseSummary[];
  /** Full scorecards loaded so far: courses in visible rounds, your wishlist, and any opened on demand. */
  courses: Course[];
  simCourses: SimCourse[];
  /** The signed-in user's rounds. */
  rounds: Round[];
  /** Rounds owned by friends (read-only here). */
  friendRounds: Round[];
  wishlist: string[];
  social: SocialState;
  /** Leagues, tournaments and scheduled rounds you organize, belong to, or are invited to. */
  events: CompetitionEvent[];
  eventMembers: EventMember[];
  eventRounds: EventRound[];
  eventMatches: EventMatch[];
}

/** Input for creating an event (the organizer is added automatically). */
export interface NewEvent {
  kind: EventKind;
  name: string;
  format: EventFormat;
  /** May be empty: a league starts with no schedule and the organizer adds rounds as they're set. */
  rounds: Omit<EventRound, 'id' | 'eventId' | 'seq'>[];
  inviteIds: string[];
}

export type NewEventRound = Omit<EventRound, 'id' | 'eventId' | 'seq'>;
export type EventRoundChanges = Partial<Pick<EventRound, 'name' | 'scheduledOn' | 'teeTime' | 'courseId' | 'teeId' | 'holes'>>;

export interface Repository {
  /** Cached after the first call; `force` refetches. */
  load(force?: boolean): Promise<AppSnapshot>;
  /** Make sure full scorecards for these course ids are in the snapshot (no-op when already loaded). */
  loadCourses(ids: string[]): Promise<void>;
  /** Save a round you own, or one you're keeping score for (group scoring; `ownerId` is the friend). */
  saveRound(round: Round): Promise<void>;
  deleteRound(id: string): Promise<void>;
  /** Refetch just the rounds in one group (live scores while playing), merged into the snapshot. */
  refreshGroup(groupKey: string): Promise<AppSnapshot>;
  setWishlist(courseIds: string[]): Promise<void>;
  /** Toggle my reaction on a round (same emoji again removes it). */
  react(roundId: string, emoji: ReactionEmoji): Promise<void>;
  addComment(roundId: string, text: string): Promise<void>;
  clearRounds(): Promise<void>;
  searchPlayers(query: string): Promise<Player[]>;
  sendFriendRequest(playerId: string): Promise<void>;
  respondToRequest(playerId: string, accept: boolean): Promise<void>;
  removeFriend(playerId: string): Promise<void>;
  /** Returns the new event's id. */
  createEvent(input: NewEvent): Promise<string>;
  /** Join with a share code; returns the event id. */
  joinEvent(code: string): Promise<string>;
  respondToEvent(eventId: string, accept: boolean): Promise<void>;
  inviteToEvent(eventId: string, playerIds: string[]): Promise<void>;
  leaveEvent(eventId: string): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  /** Match play: replace an event round's pairings. */
  setPairings(eventRoundId: string, pairs: [string, string][]): Promise<void>;
  /** Organizer: rename the event or change its format settings (e.g. a scheduled round's note or group size). */
  updateEvent(eventId: string, changes: { name?: string; format?: EventFormat }): Promise<void>;
  /** Organizer: add a one-off round to a league or tournament schedule (named and numbered next in line). */
  addEventRound(eventId: string, round: NewEventRound): Promise<void>;
  /** Organizer: take a round off the schedule (rounds logged for it stay, just unlinked). */
  deleteEventRound(eventRoundId: string): Promise<void>;
  /** Organizer: move an event round (date, tee time, course, tee, holes) or rename it. */
  updateEventRound(eventRoundId: string, changes: EventRoundChanges): Promise<void>;
  /** Edit your own profile. Throws a readable message (e.g. username taken). */
  updateProfile(changes: ProfileChanges): Promise<void>;
  /** Offline demo only: restore the generated sample data. */
  resetToSample?(): Promise<void>;
}

export interface ProfileChanges {
  name?: string;
  /** Lowercase letters, numbers and underscores, 3–20; null clears it. */
  username?: string | null;
  tagline?: string | null;
  homeCourseId?: string | null;
}

export const COURSE_DATA_ATTRIBUTION = seed._attribution;

const KEY = 'gk:v2:user';
interface Stored {
  rounds: Round[];
  friendRounds: Round[];
  wishlist: string[];
  social: SocialState;
}

const courses = seed.courses as Course[];

const sample = (): Stored => {
  const rounds = generateSampleRounds(courses, SIM_COURSES);
  const friendRounds = generateFriendRounds(courses, SIM_COURSES);
  return {
    rounds,
    friendRounds,
    wishlist: ['fox-hopyard', 'tpc-river-highlands', 'crestbrook-park'],
    social: generateSocial([...rounds, ...friendRounds]),
  };
};

/**
 * Offline demo: bundled course seed + generated sample rounds in AsyncStorage. Used only when Supabase isn't
 * configured (no EXPO_PUBLIC_SUPABASE_* env vars); sample data never goes to the database.
 */
export class LocalRepository implements Repository {
  private cache: Stored | null = null;

  private async read(): Promise<Stored> {
    if (this.cache) return this.cache;
    let stored: Stored | null = null;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      stored = raw ? (JSON.parse(raw) as Stored) : null;
    } catch {
      stored = null;
    }
    this.cache = stored ?? sample();
    if (!stored) await this.write(this.cache);
    return this.cache;
  }

  private async write(next: Stored) {
    this.cache = next;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (e.g. private browsing); keep working in memory.
    }
  }

  async load(): Promise<AppSnapshot> {
    const s = await this.read();
    return {
      me: ME, friends: FRIENDS, others: [], requests: { incoming: [], outgoing: [] },
      events: [], eventMembers: [], eventRounds: [], eventMatches: [],
      courseIndex: courses.map(summarizeCourse), courses, simCourses: SIM_COURSES, rounds: s.rounds, friendRounds: s.friendRounds, wishlist: s.wishlist, social: s.social,
    };
  }

  async loadCourses() {
    // Offline demo: every bundled course is already loaded.
  }

  async saveRound(round: Round) {
    const s = await this.read();
    if (round.ownerId && round.ownerId !== ME.id) {
      await this.write({ ...s, friendRounds: [...s.friendRounds.filter((r) => r.id !== round.id), round] });
      return;
    }
    await this.write({ ...s, rounds: [...s.rounds.filter((r) => r.id !== round.id), round] });
  }

  async deleteRound(id: string) {
    const s = await this.read();
    await this.write({ ...s, rounds: s.rounds.filter((r) => r.id !== id), friendRounds: s.friendRounds.filter((r) => r.id !== id) });
  }

  async setWishlist(courseIds: string[]) {
    const s = await this.read();
    await this.write({ ...s, wishlist: courseIds });
  }

  async react(roundId: string, emoji: ReactionEmoji) {
    const s = await this.read();
    const list = s.social.reactions[roundId] ?? [];
    const mine = list.find((x) => x.playerId === ME.id);
    const rest = list.filter((x) => x.playerId !== ME.id);
    const next = mine?.emoji === emoji ? rest : [...rest, { playerId: ME.id, emoji }];
    await this.write({ ...s, social: { ...s.social, reactions: { ...s.social.reactions, [roundId]: next } } });
  }

  async addComment(roundId: string, text: string) {
    const s = await this.read();
    const list = s.social.comments[roundId] ?? [];
    const comment: Comment = { id: `${roundId}-c${Date.now()}`, playerId: ME.id, text, at: new Date().toISOString() };
    await this.write({ ...s, social: { ...s.social, comments: { ...s.social.comments, [roundId]: [...list, comment] } } });
  }

  async clearRounds() {
    const s = await this.read();
    await this.write({ ...s, rounds: [] });
  }

  async searchPlayers(): Promise<Player[]> {
    return [];
  }

  async sendFriendRequest() {}

  async respondToRequest() {}

  async removeFriend() {}

  private needsAccount(): never {
    throw new Error('Leagues and events need an account (this is the offline demo).');
  }

  async refreshGroup() { return this.load(); }

  async createEvent(): Promise<string> { this.needsAccount(); }

  async joinEvent(): Promise<string> { this.needsAccount(); }

  async respondToEvent() { this.needsAccount(); }

  async inviteToEvent() { this.needsAccount(); }

  async leaveEvent() { this.needsAccount(); }

  async deleteEvent() { this.needsAccount(); }

  async setPairings() { this.needsAccount(); }

  async updateEvent() { this.needsAccount(); }

  async updateEventRound() { this.needsAccount(); }

  async addEventRound() { this.needsAccount(); }

  async deleteEventRound() { this.needsAccount(); }

  async updateProfile(): Promise<void> {
    throw new Error('Profiles need an account (this is the offline demo).');
  }

  async resetToSample() {
    await this.write(sample());
  }
}
