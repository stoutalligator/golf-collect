import type { RoundSummary } from './stats';
import type { CollectibleCategory, CollectibleItem, Course, Tier } from './types';

// ── Tiers ─────────────────────────────────────────────────────────────────

export type TierRule =
  | { type: 'scoreBelow'; score: number } // "break N": full 18, strokes < N
  | { type: 'toParAtMost'; value: number }; // e.g. 0 = even par or better

export interface TierDef {
  tier: Tier;
  name: string;
  /** Short rule label, e.g. "Break 90". */
  label: string;
  rule: TierRule;
}

export interface EarnedTier {
  tier: Tier;
  earnedOn: string;
  roundId: string;
}

const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'platinum'];
export const tierRank = (t: Tier) => TIER_ORDER.indexOf(t);

function meetsTier(rule: TierRule, s: RoundSummary): boolean {
  if (!s.isFull18) return false;
  return rule.type === 'scoreBelow' ? s.strokes < rule.score : s.toPar <= rule.value;
}

const byDate = (a: RoundSummary, b: RoundSummary) => a.date.localeCompare(b.date) || a.roundId.localeCompare(b.roundId);

/** Highest tier reached across rounds, dated by the first round that reached it. Null = no tier yet. */
export function courseTier(summaries: RoundSummary[], tiers: TierDef[]): EarnedTier | null {
  let best: EarnedTier | null = null;
  for (const s of [...summaries].sort(byDate)) {
    for (const def of tiers) {
      if (meetsTier(def.rule, s) && (!best || tierRank(def.tier) > tierRank(best.tier))) {
        best = { tier: def.tier, earnedOn: s.date, roundId: s.roundId };
      }
    }
  }
  return best;
}

// ── Collectibles (per-course sets) ─────────────────────────────────────────

export type CollectibleRule =
  | { type: 'roundsAtCourse'; count: number }
  | { type: 'birdieAtCourse' }
  | { type: 'birdieOnHole'; hole: number }
  | { type: 'birdieOnParFive' }
  | { type: 'parOrBetterOnHole'; hole: number }
  | { type: 'parOrBetterOnHardestHole' }
  | { type: 'scoreBelowAtCourse'; score: number }
  | { type: 'tierAtCourse'; tier: Tier };

export interface CollectibleDef {
  /** Unique within a course; also the art file name (collectibles/<course>/<id>.png). */
  id: string;
  /** Art shape + collection category. */
  kind: CollectibleItem;
  name: string;
  howToEarn: string;
  rule: CollectibleRule;
}

export interface CourseSetConfig {
  remove?: string[];
  override?: Record<string, Partial<Omit<CollectibleDef, 'id'>>>;
  add?: CollectibleDef[];
}

export interface CollectiblesConfig {
  default: CollectibleDef[];
  courses: Record<string, CourseSetConfig>;
}

export const KIND_CATEGORY: Record<CollectibleItem, CollectibleCategory> = {
  'ball-marker': 'markers',
  'pitch-marker': 'markers',
  'bag-tag': 'bag-tags',
  patch: 'patches',
  pin: 'pins',
};

/** The resolved collectible set for one course: default set, then remove → override → add. */
export function collectiblesFor(courseId: string, config: CollectiblesConfig): CollectibleDef[] {
  const custom = config.courses[courseId];
  let set = config.default.map((d) => ({ ...d }));
  if (!custom) return set;
  if (custom.remove) set = set.filter((d) => !custom.remove!.includes(d.id));
  if (custom.override) {
    set = set.map((d) => (custom.override![d.id] ? { ...d, ...custom.override![d.id], id: d.id } as CollectibleDef : d));
  }
  if (custom.add) set = [...set, ...custom.add.filter((a) => !set.some((d) => d.id === a.id))];
  return set;
}

export interface ItemState {
  def: CollectibleDef;
  earned: boolean;
  earnedOn?: string;
  roundId?: string;
  progress?: { current: number; target: number };
}

export interface CourseCollection {
  courseId: string;
  played: boolean;
  tier: EarnedTier | null;
  items: ItemState[];
  earnedCount: number;
  complete: boolean;
}

/**
 * Collection state for one real course. Only completed `course` rounds count —
 * sim rounds never earn real-course collectibles.
 */
export function courseCollection(course: Course, summaries: RoundSummary[], tiers: TierDef[], defs: CollectibleDef[]): CourseCollection {
  const rounds = summaries
    .filter((s) => s.kind === 'course' && s.courseId === course.id && s.isComplete)
    .sort(byDate);
  const hardest = course.holes.find((h) => h.handicap === 1)?.number;
  const onHole = (s: RoundSummary, hole: number | undefined, test: (toPar: number) => boolean) =>
    s.results.some((r) => r.hole.number === hole && test(r.toPar));

  const items = defs.map((def): ItemState => {
    const rule = def.rule;
    const firstMatch = (test: (s: RoundSummary, i: number) => boolean): ItemState => {
      const i = rounds.findIndex(test);
      return i >= 0 ? { def, earned: true, earnedOn: rounds[i].date, roundId: rounds[i].roundId } : { def, earned: false };
    };
    switch (rule.type) {
      case 'roundsAtCourse': {
        const target = rule.count;
        const progress = { current: Math.min(rounds.length, target), target };
        if (rounds.length >= target) {
          const r = rounds[target - 1];
          return { def, earned: true, earnedOn: r.date, roundId: r.roundId, progress };
        }
        return { def, earned: false, progress };
      }
      case 'birdieAtCourse':
        return firstMatch((s) => s.birdies + s.eagles > 0);
      case 'birdieOnHole':
        return firstMatch((s) => onHole(s, rule.hole, (t) => t <= -1));
      case 'birdieOnParFive':
        return firstMatch((s) => s.results.some((r) => r.hole.par === 5 && r.toPar <= -1));
      case 'parOrBetterOnHole':
        return firstMatch((s) => onHole(s, rule.hole, (t) => t <= 0));
      case 'parOrBetterOnHardestHole':
        return firstMatch((s) => onHole(s, hardest, (t) => t <= 0));
      case 'scoreBelowAtCourse':
        return firstMatch((s) => s.isFull18 && s.strokes < rule.score);
      case 'tierAtCourse':
        return firstMatch((_, i) => {
          const t = courseTier(rounds.slice(0, i + 1), tiers);
          return !!t && tierRank(t.tier) >= tierRank(rule.tier);
        });
    }
  });

  const earnedCount = items.filter((s) => s.earned).length;
  return {
    courseId: course.id,
    played: rounds.length > 0,
    tier: courseTier(rounds, tiers),
    items,
    earnedCount,
    complete: items.length > 0 && earnedCount === items.length,
  };
}
