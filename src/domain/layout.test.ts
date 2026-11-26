import { describe, expect, it } from 'vitest';

import { playLayout, ratingFor, realHoleNumber } from './layout';

const nine = { holes: [4, 4, 3, 5, 4, 3, 4, 4, 5].map((par, i) => ({ number: i + 1, par, handicap: [7, 13, 17, 9, 15, 11, 5, 3, 1][i] })) };

describe('9-hole courses', () => {
  it('expands to 18 holes: same pars, odd SI on the first loop and even on the second', () => {
    const l = playLayout(nine);
    expect(l.holes).toHaveLength(18);
    expect(l.holes.slice(9).map((h) => h.par)).toEqual(nine.holes.map((h) => h.par));
    expect(l.holes.map((h) => h.handicap).sort((a, b) => a - b)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    // Hardest hole (SI 1 → hole 9) is SI 1 going out and SI 2 coming back.
    expect(l.holes.find((h) => h.number === 9)!.handicap).toBe(1);
    expect(l.holes.find((h) => h.number === 18)!.handicap).toBe(2);
    expect(realHoleNumber(nine, 14)).toBe(5);
  });

  it('leaves 18-hole layouts alone', () => {
    const eighteen = { holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4, handicap: i + 1 })) };
    expect(playLayout(eighteen)).toBe(eighteen);
  });

  it('scales ratings by basis', () => {
    const nineRated = { par: 35, ratings: { men: { rating: 34.2, slope: 120 } }, ratedHoles: 9 as const };
    expect(ratingFor(nineRated, 18, 9)).toEqual({ rating: 68.4, slope: 120, par: 70 });
    expect(ratingFor(nineRated, 9, 9)).toEqual({ rating: 34.2, slope: 120, par: 35 });
    const twiceRated = { par: 35, ratings: { men: { rating: 68, slope: 121 } }, ratedHoles: 18 as const };
    expect(ratingFor(twiceRated, 18, 9)).toEqual({ rating: 68, slope: 121, par: 70 });
    expect(ratingFor({ par: 72, ratings: { men: { rating: 71.2, slope: 129 } } }, 18, 18)).toEqual({ rating: 71.2, slope: 129, par: 72 });
    expect(ratingFor({ par: 72, ratings: {} }, 18, 18)).toBeUndefined();
  });
});
