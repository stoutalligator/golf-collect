import { useMemo } from 'react';

import type { CollectibleDef, ItemState } from '@/domain/collection';
import type { CollectibleItem, Course, Tier } from '@/domain/types';

import { useAppData, type PlayerData } from './app-data';

export interface ShelfEntry {
  course: Course;
  def: CollectibleDef;
  state: ItemState;
  /** Course ball-marker tier (only drawn on ball markers). */
  tier: Tier | undefined;
  played: boolean;
}

export interface Shelf {
  kind: CollectibleItem;
  title: string;
  /** Shown when nothing on the shelf is earned yet. */
  hint: string;
  earned: ShelfEntry[];
  /** Not yet earned: courses you've played first, then closest to done. */
  locked: ShelfEntry[];
  total: number;
}

export const SHELF_ORDER: { kind: CollectibleItem; title: string; hint: string }[] = [
  { kind: 'ball-marker', title: 'Ball Markers', hint: 'Play any course to earn its ball marker. Better scores upgrade its tier.' },
  { kind: 'pitch-marker', title: 'Pitch Markers', hint: 'Make a birdie at a course to earn its pitch marker.' },
  { kind: 'bag-tag', title: 'Bag Tags', hint: 'Play a course three times to earn its bag tag.' },
  { kind: 'patch', title: 'Patches', hint: 'Birdie a par 5 at a course to earn its patch.' },
  { kind: 'pin', title: 'Pins', hint: 'Each course has its own challenge for the pin.' },
];

export const shelfTitle = (kind: string) => SHELF_ORDER.find((s) => s.kind === kind)?.title ?? 'Collectibles';

/** One shelf per collectible kind, built from a player's course collections. */
export function useShelves(pd: PlayerData): Shelf[] {
  const { courses } = useAppData();
  return useMemo(() => {
    const entries: ShelfEntry[] = courses.flatMap((course) => {
      const col = pd.collections.get(course.id);
      if (!col) return [];
      return col.items.map((state) => ({ course, def: state.def, state, tier: col.tier?.tier, played: col.played }));
    });
    const progress = (e: ShelfEntry) => (e.state.progress ? e.state.progress.current / e.state.progress.target : 0);
    return SHELF_ORDER.map(({ kind, title, hint }) => {
      const mine = entries.filter((e) => e.def.kind === kind);
      return {
        kind,
        title,
        hint,
        earned: mine.filter((e) => e.state.earned).sort((a, b) => (b.state.earnedOn ?? '').localeCompare(a.state.earnedOn ?? '')),
        locked: mine.filter((e) => !e.state.earned).sort((a, b) => Number(b.played) - Number(a.played) || progress(b) - progress(a) || a.course.name.localeCompare(b.course.name)),
        total: mine.length,
      };
    });
  }, [courses, pd]);
}
