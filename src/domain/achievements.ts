import { courseCollection, type CollectibleDef, type TierDef } from './collection';
import type { RoundSummary } from './stats';
import type { Course, RoundKind, SimCourse } from './types';

export type AchievementCategory = 'game' | 'courses' | 'collection' | 'sim';

export type AchievementRule =
  | { type: 'roundUnder'; score: number } // full 18, strokes < score
  | { type: 'careerBirdies'; count: number } // birdie or better
  | { type: 'careerRounds'; count: number }
  | { type: 'uniqueCourses'; count: number }
  | { type: 'statesPlayed'; count: number }
  | { type: 'taggedCourses'; tag: string; count: number }
  | { type: 'completeCollections'; count: number }
  | { type: 'collectiblesEarned'; count: number };

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  /** Which rounds the rule sees: real-course rounds or sim rounds — never both. */
  track: RoundKind;
  rule: AchievementRule;
}

export interface AchievementState {
  def: AchievementDef;
  current: number;
  target: number;
  earned: boolean;
  earnedOn?: string;
  /** The round that completed it. */
  earnedRoundId?: string;
}

export interface AchievementContext {
  courses: Course[];
  simCourses: SimCourse[];
  tiers: TierDef[];
  /** Resolved collectible set per course. */
  setFor: (courseId: string) => CollectibleDef[];
}

function progress(rule: AchievementRule, rounds: RoundSummary[], ctx: AchievementContext): { current: number; target: number } {
  const complete = rounds.filter((s) => s.isComplete);
  const uniqueIds = [...new Set(complete.map((s) => s.courseId))];
  const courseById = new Map(ctx.courses.map((c) => [c.id, c]));
  switch (rule.type) {
    case 'roundUnder':
      return { current: complete.some((s) => s.isFull18 && s.strokes < rule.score) ? 1 : 0, target: 1 };
    case 'careerBirdies':
      return { current: complete.reduce((a, s) => a + s.birdies + s.eagles, 0), target: rule.count };
    case 'careerRounds':
      return { current: complete.length, target: rule.count };
    case 'uniqueCourses':
      return { current: uniqueIds.length, target: rule.count };
    case 'statesPlayed': {
      const states = new Set(uniqueIds.map((id) => courseById.get(id)?.state).filter(Boolean));
      return { current: states.size, target: rule.count };
    }
    case 'taggedCourses':
      return { current: uniqueIds.filter((id) => courseById.get(id)?.tags?.includes(rule.tag)).length, target: rule.count };
    case 'completeCollections':
    case 'collectiblesEarned': {
      const cols = ctx.courses.map((c) => courseCollection(c, rounds, ctx.tiers, ctx.setFor(c.id)));
      const current = rule.type === 'completeCollections'
        ? cols.filter((c) => c.complete).length
        : cols.reduce((a, c) => a + c.earnedCount, 0);
      return { current, target: rule.count };
    }
  }
}

/**
 * Evaluates every achievement. Earned date = date of the round that first
 * pushed progress to the target (rounds are replayed chronologically).
 */
export function evaluateAchievements(defs: AchievementDef[], summaries: RoundSummary[], ctx: AchievementContext): AchievementState[] {
  const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date) || a.roundId.localeCompare(b.roundId));
  return defs.map((def) => {
    const rounds = sorted.filter((s) => s.kind === def.track);
    const final = progress(def.rule, rounds, ctx);
    const earned = final.current >= final.target;
    let earnedOn: string | undefined;
    let earnedRoundId: string | undefined;
    if (earned) {
      for (let i = 0; i < rounds.length; i++) {
        const p = progress(def.rule, rounds.slice(0, i + 1), ctx);
        if (p.current >= p.target) { earnedOn = rounds[i].date; earnedRoundId = rounds[i].roundId; break; }
      }
    }
    return { def, current: Math.min(final.current, final.target), target: final.target, earned, earnedOn, earnedRoundId };
  });
}
