import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/theme';

/** Thin, single-weight line icons (1.5 stroke, rounded caps) per brand guidelines. */
export type IconName =
  | 'home' | 'flag' | 'pin' | 'layers' | 'bell' | 'plus' | 'chart'
  | 'bookmark' | 'bookmark-filled' | 'chevron-right' | 'chevron-left' | 'search' | 'user' | 'trophy'
  | 'check' | 'book' | 'minus' | 'x' | 'settings' | 'users' | 'message' | 'grid' | 'trend' | 'lock' | 'calendar' | 'share'
  | 'more' | 'trash';

const paths: Record<IconName, string[]> = {
  home: ['M4 11.5 12 5l8 6.5', 'M6 10v9h4.5v-5h3v5H18v-9'],
  more: ['M5 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0', 'M10.8 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0', 'M16.6 12a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0'],
  trash: ['M5 7h14', 'M10 4h4', 'M7 7l1 12.5h8L17 7', 'M10.5 10.5v6', 'M13.5 10.5v6'],
  flag: ['M6 21V4', 'M6 4.5h10.5l-2.5 3.5 2.5 3.5H6'],
  pin: ['M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z'],
  layers: ['M12 4 3.5 8.5 12 13l8.5-4.5L12 4Z', 'm3.5 12.5 8.5 4.5 8.5-4.5', 'm3.5 16.5 8.5 4.5 8.5-4.5'],
  bell: ['M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5l1.5-1.5Z', 'M10 20.5a2.2 2.2 0 0 0 4 0'],
  plus: ['M12 5v14', 'M5 12h14'],
  chart: ['M5 20V13', 'M10 20V8', 'M15 20v-9', 'M20 20V5'],
  bookmark: ['M7 4h10v16l-5-3.5L7 20V4Z'],
  'bookmark-filled': ['M7 4h10v16l-5-3.5L7 20V4Z', 'M9 6h6v10.2l-3-2.1-3 2.1V6Z', 'M10 8h4M10 10h4M10 12h4'],
  check: ['m5.5 12.5 4 4 9-9'],
  book: ['M4 5.5c2.5-1 5.5-1 8 .8v13c-2.5-1.8-5.5-1.8-8-.8v-13Z', 'M20 5.5c-2.5-1-5.5-1-8 .8v13c2.5-1.8 5.5-1.8 8-.8v-13Z'],
  minus: ['M5 12h14'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  settings: ['M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6'],
  users: ['M3 19.5c.8-3 3.2-4.5 6-4.5s5.2 1.5 6 4.5', 'M15.5 14.8c2.4.2 4.3 1.6 5 4.2', 'M15 4.8a3.3 3.3 0 0 1 0 6.4'],
  message: ['M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z'],
  grid: ['M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z'],
  trend: ['M4 17l5-5 3.5 3.5L20 8', 'M15 8h5v5'],
  lock: ['M6.5 11h11v9h-11z', 'M9 11V8a3 3 0 0 1 6 0v3'],
  calendar: ['M5 6.5h14v13H5z', 'M5 10.5h14', 'M9 4.5v4', 'M15 4.5v4'],
  share: ['M12 15V4', 'm8 8 4-4 4 4', 'M6 12v7h12v-7'],
  'chevron-right': ['m9.5 6 6 6-6 6'],
  'chevron-left': ['m14.5 6-6 6 6 6'],
  search: ['m20 20-4.2-4.2'],
  user: ['M4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0V4Z', 'M8 6H5v1.5A3 3 0 0 0 8 10.5', 'M16 6h3v1.5a3 3 0 0 1-3 3', 'M12 13v4', 'M8.5 20h7', 'M10 17h4v3h-4z'],
};

const circles: Partial<Record<IconName, { cx: number; cy: number; r: number }>> = {
  pin: { cx: 12, cy: 10, r: 2.3 },
  search: { cx: 10.5, cy: 10.5, r: 6 },
  user: { cx: 12, cy: 8.5, r: 3.8 },
  settings: { cx: 12, cy: 12, r: 3.6 },
  users: { cx: 9, cy: 8, r: 3.5 },
};

export function Icon({ name, size = 22, color = colors.fairway, strokeWidth = 1.6 }: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const c = circles[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name].map((d) => <Path key={d} d={d} />)}
      {c && <Circle cx={c.cx} cy={c.cy} r={c.r} />}
    </Svg>
  );
}
