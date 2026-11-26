import { Platform, type ImageSourcePropType } from 'react-native';

import type { Tier } from '@/domain/types';
import { SEASONS, seasonFor, type Season } from '@/lib/season';

import { ART_REGISTRY } from './registry.generated';

/**
 * Art lookup. Keys are paths under assets/art without the extension,
 * e.g. "regions/new-england/hero" or "badges/break-80".
 * Returns undefined until the image exists (+ `npm run art:sync`), so
 * components fall back to their SVG placeholder.
 */
export function getArt(key: string): ImageSourcePropType | undefined {
  return (ART_REGISTRY as Record<string, ImageSourcePropType>)[key];
}

/** First key in the list that has art. */
export function firstArt(keys: string[]): { key: string; src: ImageSourcePropType } | undefined {
  for (const key of keys) {
    const src = getArt(key);
    if (src) return { key, src };
  }
  return undefined;
}

export const artKeys = {
  homeHero: 'home/hero',
  splashScene: 'brand/splash-scene',
  emblem: 'brand/emblem',
  emblemOnDark: 'brand/emblem-on-dark',
  scorecardTree: 'scorecard/tree-emblem',
  // Shared, per region
  regionHero: (region: string) => `regions/${region}/hero`,
  regionEngraving: (region: string) => `regions/${region}/scorecard-engraving`,
  regionVignette: (region: string) => `regions/${region}/vignette`,
  // Standard collectible frames
  frame: (kind: string, tier?: Tier | null) => (tier ? `collectibles/frames/${kind}-${tier}` : `collectibles/frames/${kind}`),
  // Optional one-off overrides for a specific course
  courseHero: (courseId: string) => `courses/${courseId}/hero`,
  courseEngraving: (courseId: string) => `courses/${courseId}/scorecard-engraving`,
  courseCollectible: (courseId: string, id: string) => `courses/${courseId}/collectibles/${id}`,
  badge: (badgeId: string) => `badges/${badgeId}`,
};

// ── Seasons (home hero) ────────────────────────────────────────────────────


/** Web dev aid: `?season=winter` previews a season. */
function seasonOverride(): Season | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  const v = new URLSearchParams(window.location.search).get('season');
  return SEASONS.includes(v as Season) ? (v as Season) : undefined;
}

/** Home hero keys: today's season first, then the other seasons, then the generic hero. */
export function homeHeroKeys(date = new Date()): string[] {
  const now = seasonOverride() ?? seasonFor(date);
  const order = [now, ...SEASONS.filter((s) => s !== now)];
  return [...order.map((s) => `home/hero-${s}`), 'home/hero'];
}

/** Hero for a course: destination override → region hero. */
export const courseHeroKeys = (c: { id: string; region: string }) => [artKeys.courseHero(c.id), artKeys.regionHero(c.region)];
export const courseEngravingKeys = (c: { id: string; region: string }) => [artKeys.courseEngraving(c.id), artKeys.regionEngraving(c.region)];
