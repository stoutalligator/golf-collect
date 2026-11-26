import type { Hole, SimCourse } from '@/domain/types';

const layout = (pars: number[], handicaps: number[]): Hole[] =>
  pars.map((par, i) => ({ number: i + 1, par, handicap: handicaps[i] }));

/** Fictional simulator courses (sample data only). */
export const SIM_COURSES: SimCourse[] = [
  {
    id: 'sim-harbor-bluff',
    name: 'Harbor Bluff Links',
    platform: 'Simulator',
    holes: layout([4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5], [7, 11, 17, 3, 1, 9, 15, 13, 5, 6, 18, 2, 10, 8, 4, 16, 14, 12]),
  },
  {
    id: 'sim-saltgrass-dunes',
    name: 'Saltgrass Dunes',
    platform: 'Simulator',
    holes: layout([5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5], [9, 3, 13, 17, 1, 7, 11, 15, 5, 4, 10, 18, 6, 2, 12, 16, 8, 14]),
  },
  {
    id: 'sim-granite-ridge',
    name: 'Granite Ridge',
    platform: 'Simulator',
    holes: layout([4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 5, 3, 4, 4, 3, 4, 5, 4], [5, 15, 3, 9, 1, 17, 11, 7, 13, 8, 4, 16, 2, 10, 18, 12, 6, 14]),
  },
];
