import { describe, expect, it } from 'vitest';

import { seasonFor } from './season';

describe('seasonFor', () => {
  it.each([
    ['2026-01-15', 'winter'], ['2026-02-28', 'winter'], ['2026-03-01', 'spring'], ['2026-05-31', 'spring'],
    ['2026-06-01', 'summer'], ['2026-08-31', 'summer'], ['2026-09-01', 'autumn'], ['2026-11-30', 'autumn'], ['2026-12-01', 'winter'],
  ])('%s → %s', (d, season) => {
    const [y, m, day] = d.split('-').map(Number);
    expect(seasonFor(new Date(y, m - 1, day))).toBe(season);
  });
});
