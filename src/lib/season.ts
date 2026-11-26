export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Northern-hemisphere meteorological seasons: Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter. */
export function seasonFor(date = new Date()): Season {
  const m = date.getMonth(); // 0 = Jan
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
}
