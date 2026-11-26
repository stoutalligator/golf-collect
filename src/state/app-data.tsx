import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ACHIEVEMENTS, collectiblesForCourse, TIERS } from '@/data/config/game';
import { LocalRepository, type AppSnapshot, type Repository } from '@/data/repository';
import { evaluateAchievements, type AchievementState } from '@/domain/achievements';
import { courseCollection, type CourseCollection } from '@/domain/collection';
import { careerStats, summarizeRound, type CareerStats, type HoleLayout, type RoundSummary } from '@/domain/stats';
import type { Course, Round, SimCourse } from '@/domain/types';

export interface AppData extends AppSnapshot {
  ready: boolean;
  summaries: Map<string, RoundSummary>;
  /** Newest first. */
  roundsByDate: Round[];
  courseStats: CareerStats;
  simStats: CareerStats;
  collections: Map<string, CourseCollection>;
  achievements: AchievementState[];
  layoutFor(round: Round): HoleLayout | undefined;
  courseById(id: string): Course | undefined;
  simCourseById(id: string): SimCourse | undefined;
  /** Display name for a round's course (real or sim). */
  roundCourseName(round: Round): string;
  saveRound(round: Round): Promise<void>;
  deleteRound(id: string): Promise<void>;
  toggleWishlist(courseId: string): Promise<void>;
  resetToSample(): Promise<void>;
  clearRounds(): Promise<void>;
}

const Ctx = createContext<AppData | null>(null);
const repo: Repository = new LocalRepository();

const EMPTY: AppSnapshot = { me: { id: 'me', name: '', initials: '' }, courses: [], simCourses: [], rounds: [], wishlist: [] };

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AppSnapshot>(EMPTY);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    setSnap(await repo.load());
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const derived = useMemo(() => {
    const courseMap = new Map(snap.courses.map((c) => [c.id, c]));
    const simMap = new Map(snap.simCourses.map((c) => [c.id, c]));
    const layoutFor = (r: Round): HoleLayout | undefined => (r.kind === 'sim' ? simMap.get(r.courseId) : courseMap.get(r.courseId));

    const summaries = new Map<string, RoundSummary>();
    for (const r of snap.rounds) {
      const layout = layoutFor(r);
      if (layout) summaries.set(r.id, summarizeRound(r, layout, snap.me.id));
    }
    const all = [...summaries.values()];
    const done = all.filter((s) => s.isComplete);
    const collections = new Map(snap.courses.map((c) => [c.id, courseCollection(c, done, TIERS, collectiblesForCourse(c.id))]));
    const achievements = evaluateAchievements(ACHIEVEMENTS, done, { courses: snap.courses, simCourses: snap.simCourses, tiers: TIERS, setFor: collectiblesForCourse });

    return {
      summaries,
      roundsByDate: [...snap.rounds].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
      courseStats: careerStats(done.filter((s) => s.kind === 'course')),
      simStats: careerStats(done.filter((s) => s.kind === 'sim')),
      collections,
      achievements,
      layoutFor,
      courseById: (id: string) => courseMap.get(id),
      simCourseById: (id: string) => simMap.get(id),
      roundCourseName: (r: Round) => (r.kind === 'sim' ? simMap.get(r.courseId)?.name : courseMap.get(r.courseId)?.name) ?? 'Unknown course',
    };
  }, [snap]);

  const value = useMemo<AppData>(() => ({
    ...snap,
    ...derived,
    ready,
    saveRound: async (r) => { await repo.saveRound(r); await reload(); },
    deleteRound: async (id) => { await repo.deleteRound(id); await reload(); },
    toggleWishlist: async (id) => {
      const next = snap.wishlist.includes(id) ? snap.wishlist.filter((x) => x !== id) : [...snap.wishlist, id];
      await repo.setWishlist(next);
      await reload();
    },
    resetToSample: async () => { await repo.resetToSample(); await reload(); },
    clearRounds: async () => { await repo.clearRounds(); await reload(); },
  }), [snap, derived, ready, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppData must be used inside AppDataProvider');
  return v;
}
