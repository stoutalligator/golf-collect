/**
 * Deterministic sample reactions and comments on recent rounds, so the feed feels lived-in.
 */
import { REACTIONS, roundOwner, type Comment, type Reaction, type Round, type SocialState } from '@/domain/types';

import { FRIENDS, ME } from './generate';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LINES = [
  'Nice round!',
  'That back nine though 👀',
  'Great day for it.',
  'We need a rematch.',
  'Solid scoring out there.',
  'How was the course playing?',
  'Greens were quick last week, nice putting.',
  'Next time I’m bringing my A game.',
  'Love that course in the fall.',
  'Count me in next weekend.',
];

/** Reactions and comments on rounds played in the last ~10 weeks. */
export function generateSocial(rounds: Round[], since = '2026-09-15', seed = 7): SocialState {
  const r = rng(seed);
  const everyone = [ME.id, ...FRIENDS.map((f) => f.id)];
  const reactions: Record<string, Reaction[]> = {};
  const comments: Record<string, Comment[]> = {};

  for (const round of rounds.filter((x) => x.status === 'complete' && x.date >= since && x.kind === 'course')) {
    const owner = roundOwner(round);
    const others = everyone.filter((id) => id !== owner);
    const rx: Reaction[] = [];
    for (const id of others) {
      if (r() < 0.45) rx.push({ playerId: id, emoji: REACTIONS[Math.floor(r() * REACTIONS.length)] });
    }
    if (rx.length) reactions[round.id] = rx;

    const n = r() < 0.5 ? 0 : r() < 0.7 ? 1 : 2;
    const list: Comment[] = [];
    for (let i = 0; i < n; i++) {
      const by = others[Math.floor(r() * others.length)];
      list.push({ id: `${round.id}-c${i}`, playerId: by, text: LINES[Math.floor(r() * LINES.length)], at: `${round.date}T${19 + i}:1${i}:00.000Z` });
    }
    if (list.length) comments[round.id] = list;
  }
  return { reactions, comments };
}
