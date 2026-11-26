import { describe, expect, it } from 'vitest';

import { distanceMiles, formatMiles, nearest } from './geo';

const hartford = { lat: 41.7658, lng: -72.6734 };
const newHaven = { lat: 41.3083, lng: -72.9279 };

describe('geo', () => {
  it('measures great-circle distance in miles', () => {
    expect(distanceMiles(hartford, hartford)).toBe(0);
    // Hartford ↔ New Haven is about 34 miles as the crow flies.
    expect(distanceMiles(hartford, newHaven)).toBeGreaterThan(32);
    expect(distanceMiles(hartford, newHaven)).toBeLessThan(36);
  });

  it('returns the nearest items first, within range, skipping bad coordinates', () => {
    const items = [
      { id: 'far', location: { lat: 42.36, lng: -71.06 } }, // Boston, ~90 mi
      { id: 'nh', location: newHaven },
      { id: 'here', location: { lat: 41.77, lng: -72.68 } },
      { id: 'zero', location: { lat: 0, lng: 0 } },
      { id: 'none' },
    ];
    const got = nearest(items, hartford, { limit: 5, maxMiles: 60 });
    expect(got.map((x) => x.id)).toEqual(['here', 'nh']);
    expect(got[0].miles).toBeLessThan(1);
  });

  it('formats miles', () => {
    expect(formatMiles(0.42)).toBe('0.4 mi');
    expect(formatMiles(9.96)).toBe('10 mi');
    expect(formatMiles(18.4)).toBe('18 mi');
  });
});
