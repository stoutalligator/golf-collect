import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Course, Player, Round, SimCourse } from '@/domain/types';

import { generateSampleRounds, ME } from './sample/generate';
import { SIM_COURSES } from './sample/sim-courses';
import seed from './seed/courses.ct.json';

/** Everything the app reads. A remote backend implements the same interface later. */
export interface AppSnapshot {
  me: Player;
  courses: Course[];
  simCourses: SimCourse[];
  rounds: Round[];
  wishlist: string[];
}

export interface Repository {
  load(): Promise<AppSnapshot>;
  saveRound(round: Round): Promise<void>;
  deleteRound(id: string): Promise<void>;
  setWishlist(courseIds: string[]): Promise<void>;
  resetToSample(): Promise<void>;
  clearRounds(): Promise<void>;
}

export const COURSE_DATA_ATTRIBUTION = seed._attribution;

const KEY = 'gk:v1:user';
interface Stored {
  rounds: Round[];
  wishlist: string[];
}

const courses = seed.courses as Course[];

const sample = (): Stored => ({
  rounds: generateSampleRounds(courses, SIM_COURSES),
  wishlist: ['fox-hopyard', 'tpc-river-highlands', 'crestbrook-park'],
});

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
    return { me: ME, courses, simCourses: SIM_COURSES, rounds: s.rounds, wishlist: s.wishlist };
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

  async resetToSample() {
    await this.write(sample());
  }

  async clearRounds() {
    const s = await this.read();
    await this.write({ ...s, rounds: [] });
  }
}
