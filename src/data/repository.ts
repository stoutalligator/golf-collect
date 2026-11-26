import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Comment, Course, Player, ReactionEmoji, Round, SimCourse, SocialState } from '@/domain/types';

import { FRIENDS, generateFriendRounds, generateSampleRounds, ME } from './sample/generate';
import { generateSocial } from './sample/social';
import { SIM_COURSES } from './sample/sim-courses';
import seed from './seed/courses.ct.json';

/** Everything the app reads. A remote backend implements the same interface later. */
export interface AppSnapshot {
  me: Player;
  friends: Player[];
  courses: Course[];
  simCourses: SimCourse[];
  /** The signed-in user's rounds. */
  rounds: Round[];
  /** Rounds owned by friends (read-only here). */
  friendRounds: Round[];
  wishlist: string[];
  social: SocialState;
}

export interface Repository {
  load(): Promise<AppSnapshot>;
  saveRound(round: Round): Promise<void>;
  deleteRound(id: string): Promise<void>;
  setWishlist(courseIds: string[]): Promise<void>;
  /** Toggle my reaction on a round (same emoji again removes it). */
  react(roundId: string, emoji: ReactionEmoji): Promise<void>;
  addComment(roundId: string, text: string): Promise<void>;
  resetToSample(): Promise<void>;
  clearRounds(): Promise<void>;
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

/** Static course data + user data in AsyncStorage (seeded with sample rounds on first run). */
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
    return { me: ME, friends: FRIENDS, courses, simCourses: SIM_COURSES, rounds: s.rounds, friendRounds: s.friendRounds, wishlist: s.wishlist, social: s.social };
  }

  async saveRound(round: Round) {
    const s = await this.read();
    await this.write({ ...s, rounds: [...s.rounds.filter((r) => r.id !== round.id), round] });
  }

  async deleteRound(id: string) {
    const s = await this.read();
    await this.write({ ...s, rounds: s.rounds.filter((r) => r.id !== id) });
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

  async resetToSample() {
    await this.write(sample());
  }

  async clearRounds() {
    const s = await this.read();
    await this.write({ ...s, rounds: [] });
  }
}
