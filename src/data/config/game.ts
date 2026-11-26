/**
 * Game rules — all placeholders, tune after play-testing.
 * Everything that decides what a player earns lives here, not in screens.
 */
import type { AchievementDef } from '@/domain/achievements';
import { collectiblesFor, type CollectiblesConfig, type TierDef } from '@/domain/collection';

import collectiblesJson from './collectibles.json';

/** Course tiers, earned by your best 18 at a course. A round over 100 still earns the ball marker, just untiered. */
export const TIERS: TierDef[] = [
  { tier: 'bronze', name: 'Bronze', label: 'Break 100', rule: { type: 'scoreBelow', score: 100 } },
  { tier: 'silver', name: 'Silver', label: 'Break 90', rule: { type: 'scoreBelow', score: 90 } },
  { tier: 'gold', name: 'Gold', label: 'Break 80', rule: { type: 'scoreBelow', score: 80 } },
  { tier: 'platinum', name: 'Platinum', label: 'Even par or better', rule: { type: 'toParAtMost', value: 0 } },
];

/** Default + per-course collectible sets (shared with the art scripts). */
export const COLLECTIBLES = collectiblesJson as unknown as CollectiblesConfig;
export const collectiblesForCourse = (courseId: string) => collectiblesFor(courseId, COLLECTIBLES);

export const CATEGORY_LABELS = { 'bag-tags': 'Bag Tags', markers: 'Markers', patches: 'Patches', pins: 'Pins' } as const;

export const ACHIEVEMENTS: AchievementDef[] = [
  // Game
  { id: 'break-100', name: 'Break 100', description: 'Shoot a round under 100.', category: 'game', track: 'course', rule: { type: 'roundUnder', score: 100 } },
  { id: 'break-90', name: 'Break 90', description: 'Shoot a round under 90.', category: 'game', track: 'course', rule: { type: 'roundUnder', score: 90 } },
  { id: 'break-80', name: 'Break 80', description: 'Shoot a round under 80.', category: 'game', track: 'course', rule: { type: 'roundUnder', score: 80 } },
  { id: 'first-birdie', name: 'First Birdie', description: 'Make your first birdie.', category: 'game', track: 'course', rule: { type: 'careerBirdies', count: 1 } },
  { id: '100-birdies', name: '100 Birdies', description: 'Record 100 birdies.', category: 'game', track: 'course', rule: { type: 'careerBirdies', count: 100 } },
  // Courses
  { id: 'course-explorer', name: 'Course Explorer', description: 'Play 25 unique courses.', category: 'courses', track: 'course', rule: { type: 'uniqueCourses', count: 25 } },
  { id: 'state-traveler', name: 'State Traveler', description: 'Play courses in 5 states.', category: 'courses', track: 'course', rule: { type: 'statesPlayed', count: 5 } },
  { id: 'golf-traveler', name: 'Golf Traveler', description: 'Play courses in 10 states.', category: 'courses', track: 'course', rule: { type: 'statesPlayed', count: 10 } },
  { id: 'parks-and-links', name: 'Parks & Links', description: 'Play 5 courses in National Parks.', category: 'courses', track: 'course', rule: { type: 'taggedCourses', tag: 'national-park', count: 5 } },
  // Collection
  { id: 'course-collector', name: 'Course Collector', description: 'Complete a full course collection (all items).', category: 'collection', track: 'course', rule: { type: 'completeCollections', count: 1 } },
  { id: 'keepsake-50', name: 'Keepsake Keeper', description: 'Earn 50 course collectibles.', category: 'collection', track: 'course', rule: { type: 'collectiblesEarned', count: 50 } },
  // Sim (separate track)
  { id: 'sim-break-80', name: 'Sim Break 80', description: 'Shoot under 80 in a sim round.', category: 'sim', track: 'sim', rule: { type: 'roundUnder', score: 80 } },
  { id: 'sim-explorer', name: 'Sim Explorer', description: 'Play 10 different sim courses.', category: 'sim', track: 'sim', rule: { type: 'uniqueCourses', count: 10 } },
];
