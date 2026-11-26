/**
 * Playable layouts. A 9-hole course is stored as its real 9 holes; to play 18 you go around twice.
 * `playLayout` expands it to 18 virtual holes (10–18 repeat 1–9) with stroke indexes split the standard way:
 * the nine's difficulty order r = 1..9 becomes SI 2r−1 on the first loop and 2r on the second.
 * Everything downstream (scorecards, stats, front/back nine, handicaps, events) then works unchanged.
 */
import type { Hole, Tee, TeeRating } from './types';

export const isNineHole = (layout: { holes: Hole[] }) => layout.holes.length === 9;

export function playLayout<T extends { holes: Hole[] }>(layout: T): T {
  if (!isNineHole(layout)) return layout;
  const order = [...layout.holes].sort((a, b) => a.handicap - b.handicap).map((h) => h.number);
  const rank = new Map(order.map((n, i) => [n, i + 1]));
  const front = layout.holes.map((h) => ({ ...h, handicap: 2 * rank.get(h.number)! - 1 }));
  const back = layout.holes.map((h) => ({ ...h, number: h.number + 9, handicap: 2 * rank.get(h.number)! }));
  return { ...layout, holes: [...front, ...back] };
}

/** The real hole (1–9) for a virtual hole number on a 9-hole course played twice. */
export const realHoleNumber = (layout: { holes: Hole[] }, n: number) => (isNineHole(layout) && n > 9 ? n - 9 : n);

/**
 * Course rating, slope and par for the holes actually played (9 or 18), from a tee whose rating may be for 9 holes
 * or for 18. Ratings scale linearly (WHS combines two nines by adding ratings; slope is the average, so it's kept).
 */
export function ratingFor(tee: Pick<Tee, 'par' | 'ratings' | 'ratedHoles'>, holesPlayed: number, courseHoles: number): (TeeRating & { par: number }) | undefined {
  const r = tee.ratings.men ?? tee.ratings.women;
  if (!r) return undefined;
  const basis = courseHoles === 9 ? tee.ratedHoles ?? 18 : 18;
  // Tee par is for the real holes; scale it to the holes played.
  const par = tee.par * (holesPlayed / courseHoles);
  return { rating: r.rating * (holesPlayed / basis), slope: r.slope, par };
}
