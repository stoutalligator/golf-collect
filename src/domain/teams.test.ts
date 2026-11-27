import { describe, expect, it } from 'vitest';

import { matchLine, matchStatus, teamNumbers, toParThru } from './teams';
import type { Round } from './types';

const s = (n: number) => ({ strokes: n });
const card = (id: string, createdAt: string, format?: 'scramble'): Round => ({
  id, kind: 'course', courseId: 'c', date: '2026-11-26', status: 'active', holeNumbers: [1, 2, 3], playerIds: ['me'], scores: { me: [null, null, null] }, createdAt, ...(format ? { format } : {}),
});

describe('teams', () => {
  it('numbers scramble teams by creation order', () => {
    const t = teamNumbers([card('b', '2026-11-26T10:00:00.002Z', 'scramble'), card('a', '2026-11-26T10:00:00.001Z', 'scramble'), card('x', '2026-11-26T09:00:00Z')]);
    expect(t.get('a')).toBe(1);
    expect(t.get('b')).toBe(2);
    expect(t.has('x')).toBe(false);
  });

  it('tracks score to par over entered holes', () => {
    expect(toParThru([s(3), null, s(5)], [4, 4, 4])).toEqual({ toPar: 0, thru: 2 });
  });

  it('scores the match over holes both teams entered', () => {
    const a = [s(4), s(3), s(5), null];
    const b = [s(5), s(4), s(5), s(4)];
    const m = matchStatus(a, b, 18);
    expect(m).toMatchObject({ aUp: 2, thru: 3 });
    expect(matchLine(m, 'Team 1', 'Team 2')).toBe('Team 1 is 2 up thru 3');
    expect(matchLine(m, 'You', 'Mike')).toBe('You’re 2 up thru 3');
    expect(matchLine(matchStatus([s(4)], [s(4)], 18), 'Team 1', 'Team 2')).toBe('All square thru 1');
  });

  it('calls a decided match "wins N & M"', () => {
    const a = Array.from({ length: 15 }, () => s(3));
    const b = Array.from({ length: 15 }, (_, i) => s(i < 4 ? 4 : 3)); // A wins first 4, halves the rest
    const m = matchStatus(a, b, 18);
    expect(m).toMatchObject({ aUp: 4, thru: 15, left: 3, decided: true });
    expect(matchLine(m, 'Team 1', 'Team 2')).toBe('Team 1 wins 4 & 3');
  });
});
