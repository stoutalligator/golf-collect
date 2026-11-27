/**
 * Scramble teams and head-to-head status (pure). A multi-team scramble is one round per team in the same group;
 * teams are numbered by when their card was created (the setup screen staggers createdAt so the order is stable on
 * every phone).
 */
import type { HoleScore, Round } from './types';

export const isScramble = (r: Pick<Round, 'format'>) => r.format === 'scramble';

/** Team number (1-based) for each scramble card in a group, by creation order. */
export function teamNumbers(group: Round[]): Map<string, number> {
  const teams = group.filter(isScramble).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return new Map(teams.map((r, i) => [r.id, i + 1]));
}

/** Running score to par over the holes entered. */
export function toParThru(scores: (HoleScore | null)[], pars: number[]): { toPar: number; thru: number } {
  let toPar = 0;
  let thru = 0;
  scores.forEach((s, i) => {
    if (s && pars[i] !== undefined) {
      toPar += s.strokes - pars[i];
      thru++;
    }
  });
  return { toPar, thru };
}

/**
 * Match play between two cards over the holes both have entered: holes up for A (negative = B up), holes compared,
 * and whether it's decided (up by more than holes left).
 */
export function matchStatus(a: (HoleScore | null)[], b: (HoleScore | null)[], holes: number): { aUp: number; thru: number; decided: boolean; left: number } {
  let aUp = 0;
  let thru = 0;
  for (let i = 0; i < holes; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) continue;
    thru++;
    if (x.strokes < y.strokes) aUp++;
    else if (y.strokes < x.strokes) aUp--;
  }
  const left = holes - thru;
  return { aUp, thru, left, decided: Math.abs(aUp) > left };
}

/** "Team 1 is 2 up thru 7", "You’re 1 up thru 4", "All square thru 3", "Team 2 wins 3 & 2", "Halved". */
export function matchLine(m: ReturnType<typeof matchStatus>, nameA: string, nameB: string): string {
  if (!m.thru) return 'All square';
  const lead = Math.abs(m.aUp);
  const who = m.aUp > 0 ? nameA : nameB;
  const win = who === 'You' ? 'win' : 'wins';
  if (m.left === 0) return m.aUp === 0 ? 'Halved' : `${who} ${win} ${lead} up`;
  if (m.decided) return `${who} ${win} ${lead} & ${m.left}`;
  return m.aUp === 0 ? `All square thru ${m.thru}` : `${who === 'You' ? 'You’re' : `${who} is`} ${lead} up thru ${m.thru}`;
}
