/**
 * Vector placeholder art in the Greens Keeper palette. Shapes follow the brand boards;
 * real painted PNGs (assets/art, via getArt) replace them automatically.
 */
import { useId } from 'react';
import type { ImageSourcePropType } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Image as SvgImage, LinearGradient, Path, Rect, Stop, Text as SvgText, TextPath } from 'react-native-svg';

import type { CollectibleItem, Tier } from '@/domain/types';
import { colors, fonts } from '@/theme';

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seeded(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

const useSvgId = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

// ── Landscape scene (300×200 units) ──────────────────────────────────────────

const PAL = {
  skyTop: '#8DB0C8', skyBottom: '#EADCC0', cloud: '#F7F0E2', far: '#8FA39C', treeline: '#4E6B47',
  sea: '#486E8B', seaLight: '#7FA0B5', cliff: '#B98B57', cliffDark: '#8C6239', fairway: '#6F8F45',
  fairwayLight: '#93AE5B', green: '#A7C46A', tree: '#2E4A33', trunk: '#5A4030', fore: '#3F5E36',
  sand: '#E4D3A5',
};

export type SceneStyle = 'coastal' | 'parkland' | 'hills';

export function sceneStyleFor(seed: string): SceneStyle {
  return (['coastal', 'parkland', 'hills'] as const)[hashString(seed) % 3];
}

function SceneShapes({ seed, idp, style, detail = true }: { seed: string; idp: string; style?: SceneStyle; detail?: boolean }) {
  const r = seeded(hashString(seed));
  const s = style ?? sceneStyleFor(seed);
  const flagX = 120 + r() * 70;
  const treeX = r() < 0.5 ? 40 + r() * 50 : 210 + r() * 50;
  const clouds = [0, 1, 2].map(() => ({ x: r() * 300, y: 20 + r() * 40, w: 30 + r() * 40 }));
  return (
    <G>
      <Defs>
        <LinearGradient id={`${idp}sky`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PAL.skyTop} />
          <Stop offset="1" stopColor={PAL.skyBottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="300" height="200" fill={`url(#${idp}sky)`} />
      {clouds.map((c, i) => (
        <G key={i} opacity={0.85}>
          <Ellipse cx={c.x} cy={c.y} rx={c.w} ry={c.w * 0.22} fill={PAL.cloud} />
          <Ellipse cx={c.x + c.w * 0.3} cy={c.y - 5} rx={c.w * 0.5} ry={c.w * 0.18} fill={PAL.cloud} />
        </G>
      ))}
      {s === 'coastal' && (
        <G>
          <Rect x="0" y="100" width="300" height="50" fill={PAL.sea} />
          <Path d="M0 110 H300 M20 120 H120 M160 128 H280" stroke={PAL.seaLight} strokeWidth="1.2" opacity="0.7" />
          <Path d="M300 92 L238 96 C214 104 206 126 214 150 L300 150 Z" fill={PAL.cliff} />
          <Path d="M300 92 L238 96 C228 100 222 106 220 112 L300 108 Z" fill={PAL.fairwayLight} />
          <Path d="M232 118 C226 128 228 140 234 150" stroke={PAL.cliffDark} strokeWidth="2" fill="none" />
          {detail && (
            <G>
              <Rect x="268" y="74" width="6" height="20" fill="#F4EEE2" />
              <Rect x="266" y="70" width="10" height="5" fill={PAL.cliffDark} />
              <Path d="M266 70 L271 64 L276 70 Z" fill="#B5462E" />
            </G>
          )}
        </G>
      )}
      {s === 'parkland' && (
        <G>
          <Path d="M0 112 C40 96 80 104 120 98 C170 92 220 104 300 96 V140 H0 Z" fill={PAL.far} />
          {Array.from({ length: 14 }).map((_, i) => (
            <Ellipse key={i} cx={i * 23 + (r() * 10 - 5)} cy={118 - r() * 8} rx={14 + r() * 6} ry={12 + r() * 6} fill={PAL.treeline} />
          ))}
        </G>
      )}
      {s === 'hills' && (
        <G>
          <Path d="M0 120 L60 70 L95 98 L150 58 L210 104 L250 80 L300 112 V140 H0 Z" fill={PAL.far} />
          <Path d="M150 58 L138 72 L150 68 L162 74 Z M60 70 L52 80 L62 77 Z" fill="#E9E4D8" />
          <Path d="M0 128 C60 108 120 120 180 112 C230 106 270 116 300 112 V140 H0 Z" fill={PAL.treeline} />
        </G>
      )}
      <Path d="M0 150 C80 124 170 140 300 124 V200 H0 Z" fill={PAL.fairway} />
      <Path d="M30 200 C70 170 120 152 210 140 C240 137 270 136 300 134 V146 C240 150 180 160 140 178 C120 188 110 196 108 200 Z" fill={PAL.fairwayLight} />
      <Ellipse cx={flagX} cy={142} rx={30} ry={7} fill={PAL.green} />
      <Ellipse cx={flagX - 34} cy={146} rx={10} ry={3.5} fill={PAL.sand} />
      <Path d={`M${flagX} 142 V112`} stroke="#3A3A32" strokeWidth="1.4" />
      <Path d={`M${flagX} 112 L${flagX + 13} 116 L${flagX} 120 Z`} fill={colors.pennant} />
      <G>
        <Path d={`M${treeX} 160 C${treeX + 2} 140 ${treeX - 4} 128 ${treeX + 6} 112`} stroke={PAL.trunk} strokeWidth="3.5" fill="none" />
        <Ellipse cx={treeX + 8} cy={110} rx={30} ry={8} fill={PAL.tree} />
        <Ellipse cx={treeX - 4} cy={100} rx={22} ry={7} fill={PAL.tree} />
        <Ellipse cx={treeX + 14} cy={92} rx={18} ry={6} fill={PAL.tree} />
      </G>
      <Path d="M0 185 C50 172 90 182 140 186 C200 190 250 178 300 182 V200 H0 Z" fill={PAL.fore} />
      {detail && Array.from({ length: 22 }).map((_, i) => (
        <Circle key={i} cx={r() * 300} cy={184 + r() * 14} r={1.6 + r() * 1.4} fill={['#E0823A', '#E7A3B3', '#E8C547'][i % 3]} />
      ))}
    </G>
  );
}

/** Full-bleed landscape (fills its container, cropping as needed). */
export function Landscape({ seed, style, inline = false }: { seed: string; style?: SceneStyle; inline?: boolean }) {
  const idp = useSvgId('ls');
  if (inline) return <SceneShapes seed={seed} idp={idp} style={style} />;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
      <SceneShapes seed={seed} idp={idp} style={style} />
    </Svg>
  );
}

// ── Brand marks ──────────────────────────────────────────────────────────────

export function EmblemMark({ size = 40, flagColor = colors.cream, swoosh = colors.gold, pennant = colors.pennant }: {
  size?: number; flagColor?: string; swoosh?: string; pennant?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M52 74 V14" stroke={flagColor} strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M52 15 L78 23 L52 32 Z" fill={pennant} />
      <Path d="M8 80 C30 62 62 60 94 70 C70 66 40 70 18 84 Z" fill={swoosh} />
      <Path d="M14 86 C36 74 64 72 90 76" stroke={swoosh} strokeWidth="2" fill="none" opacity="0.6" />
    </Svg>
  );
}

/** Engraved-style lone cypress mark. */
export function TreeMark({ size = 44, color = colors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
      <G stroke={color} strokeLinecap="round" fill="none">
        <Path d="M50 76 C52 60 46 50 56 36" strokeWidth="3" />
        <Path d="M54 44 C44 40 34 42 24 46 M56 40 C66 34 78 34 88 38" strokeWidth="2" />
        <Path d="M18 44 C30 34 50 32 70 34 C80 35 90 38 94 42 C80 46 40 48 18 44 Z" strokeWidth="1.6" />
        <Path d="M28 32 C38 24 54 22 70 26 C60 30 40 32 28 32 Z" strokeWidth="1.6" />
        <Path d="M24 42 L30 38 M36 42 L42 37 M48 42 L54 37 M60 41 L66 37 M72 41 L78 38 M40 30 L45 27 M52 29 L57 26" strokeWidth="1" />
        <Path d="M10 78 C30 72 70 72 92 78" strokeWidth="1.4" />
      </G>
    </Svg>
  );
}

/** Wide engraved strip for the keepsake scorecard. */
export function EngravingStrip({ seed, height = 70 }: { seed: string; height?: number | string }) {
  const r = seeded(hashString(seed + 'eng'));
  const treeX = 60 + r() * 180;
  return (
    <Svg width="100%" height={height} viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet">
      <G transform="translate(0 24)">
      <G stroke={colors.ink} fill="none" strokeLinecap="round" opacity={0.75}>
        <Path d="M0 52 C60 44 120 50 180 46 C230 43 270 48 300 46" strokeWidth="1.2" />
        <Path d="M0 60 C80 54 160 62 300 56" strokeWidth="0.8" />
        {Array.from({ length: 40 }).map((_, i) => (
          <Path key={i} d={`M${i * 7.5} ${54 + (i % 3)} l4 -3`} strokeWidth="0.6" />
        ))}
        <Path d="M0 40 C40 30 80 36 120 32 C160 28 200 36 240 30 C260 28 280 32 300 30" strokeWidth="0.8" />
        <Path d={`M${treeX} 50 C${treeX + 2} 40 ${treeX - 2} 34 ${treeX + 5} 26`} strokeWidth="2" />
        <Path d={`M${treeX - 22} 26 C${treeX - 6} 18 ${treeX + 20} 18 ${treeX + 30} 24 C${treeX + 10} 28 ${treeX - 12} 30 ${treeX - 22} 26 Z`} strokeWidth="1" />
        <Path d={`M${treeX - 12} 18 C${treeX} 12 ${treeX + 14} 12 ${treeX + 20} 16 C${treeX + 6} 20 ${treeX - 4} 20 ${treeX - 12} 18 Z`} strokeWidth="1" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Path key={`h${i}`} d={`M${treeX - 18 + i * 5} 25 l3 -3`} strokeWidth="0.6" />
        ))}
      </G>
      </G>
    </Svg>
  );
}

// ── Collectibles ────────────────────────────────────────────────────────────

/** Rim look per ball-marker tier; 'base' = earned but untiered (plain pewter). */
export type RimTier = Tier | 'base';
/** Poker-chip ball marker look per tier: body, edge inserts, ring band, ring text. Tiers differ by more than color (ring trim, star). */
const CHIPS: Record<RimTier, { body: string; insert: string; band: string; text: string }> = {
  base: { body: '#1F3D2F', insert: '#F2E6CF', band: '#2C5240', text: '#F2E6CF' },
  bronze: { body: '#7A4A24', insert: '#F2E6CF', band: '#5E3819', text: '#F2E6CF' },
  silver: { body: '#8E989D', insert: '#FFFFFF', band: '#6F797E', text: '#FFFFFF' },
  gold: { body: '#B8902F', insert: '#1F3D2F', band: '#8E6B1E', text: '#FFF4D6' },
  platinum: { body: '#DDE4E7', insert: '#1F3D2F', band: '#B5C1C6', text: '#1F3D2F' },
};

/** Ring text on a circle: top arc reads left→right over the top; bottom arc reads upright under the bottom. */
export function ringPaths(cx: number, cy: number, rTop: number, rBottom: number) {
  return {
    top: `M ${cx - rTop} ${cy} A ${rTop} ${rTop} 0 0 1 ${cx + rTop} ${cy}`,
    bottom: `M ${cx - rBottom} ${cy} A ${rBottom} ${rBottom} 0 0 0 ${cx + rBottom} ${cy}`,
  };
}

/** Fixed finish for non-tiered collectibles (patch, pitch marker, bag tag, pin). */
const BRASS: [string, string, string] = ['#80602A', '#C7A35C', '#ECD7A2'];
const RIMS: Record<RimTier, [string, string, string]> = {
  base: ['#5F625D', '#A6A9A2', '#D4D6CF'],
  bronze: ['#7E5226', '#C99558', '#E8C28A'],
  silver: ['#7C8790', '#D7DFE4', '#F5F8FA'],
  gold: ['#9C6C12', '#E2B649', '#F8E3A0'],
  platinum: ['#6F7F8A', '#E4ECF0', '#FFFFFF'],
};

/** Vector collectible. If a painted region `vignette` is given, it fills the window instead of the vector scene. */
export function CollectibleArt({ item, tier = 'base', courseId, label, sublabel, size = 120, dim = false, vignette }: {
  item: CollectibleItem; tier?: RimTier; courseId: string; label: string; sublabel?: string; size?: number; dim?: boolean; vignette?: ImageSourcePropType;
}) {
  const idp = useSvgId('co');
  // Only the ball marker is tiered; everything else keeps one fixed brass finish.
  const [d, m, l] = item === 'ball-marker' ? RIMS[tier] : BRASS;
  const text = label.toUpperCase();
  const words = text.split(' ');
  const line1 = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(' ') : text;
  const line2 = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(' ') : '';
  /** Font size that fits `t` within `maxWidth` viewBox units (approx. glyph width 0.76em for Playfair bold caps). */
  const fit = (t: string, maxWidth: number, max: number) => Math.min(max, maxWidth / (Math.max(t.length, 1) * 0.76));
  const rim = (
    <LinearGradient id={`${idp}rim`} x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor={l} />
      <Stop offset="0.5" stopColor={m} />
      <Stop offset="1" stopColor={d} />
    </LinearGradient>
  );
  /** Window content: painted vignette (square, covers `box`) or the vector scene. */
  const scene = (clip: string, x: number, y: number, w: number, box: [number, number, number, number]) => (
    <G clipPath={`url(#${clip})`}>
      {vignette ? (
        <SvgImage href={vignette} x={box[0]} y={box[1]} width={box[2]} height={box[3]} preserveAspectRatio="xMidYMid slice" />
      ) : (
        <G transform={`translate(${x} ${y}) scale(${w / 300})`}>
          <SceneShapes seed={courseId} idp={`${idp}s`} detail={false} />
        </G>
      )}
    </G>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" opacity={dim ? 0.28 : 1}>
      <Defs>
        {rim}
        <ClipPath id={`${idp}c`}>
          {item === 'ball-marker' && <Circle cx="60" cy="60" r="31.5" />}
          {item === 'patch' && <Path d="M60 14 L98 28 L100 72 C96 92 80 104 60 108 C40 104 24 92 20 72 L22 28 Z" />}
          {item === 'pitch-marker' && <Circle cx="60" cy="38" r="21" />}
          {item === 'bag-tag' && <Rect x="0" y="0" width="0" height="0" />}
          {item === 'pin' && <Rect x="0" y="0" width="0" height="0" />}
        </ClipPath>
      </Defs>

      {item === 'ball-marker' && (() => {
        const c = CHIPS[tier];
        const ring = ringPaths(60, 60, 34.2, 39.6);
        const circ = 2 * Math.PI * 47;
        return (
          <G>
            <Defs>
              <Path id={`${idp}rt`} d={ring.top} />
              <Path id={`${idp}rb`} d={ring.bottom} />
            </Defs>
            <Circle cx="60" cy="62" r="53" fill="#000" opacity="0.14" />
            <Circle cx="60" cy="60" r="53" fill={c.body} />
            {/* edge inserts, like a casino chip */}
            <Circle cx="60" cy="60" r="47" stroke={c.insert} strokeWidth="10" strokeDasharray={`${circ / 16} ${circ / 16}`} fill="none" opacity="0.95" />
            <Circle cx="60" cy="60" r="53" stroke="#000" strokeOpacity="0.18" strokeWidth="1" fill="none" />
            <Circle cx="60" cy="60" r="42" fill={c.band} />
            {tier !== 'base' && <Circle cx="60" cy="60" r="41.2" stroke={c.insert} strokeWidth="0.8" fill="none" />}
            {(tier === 'gold' || tier === 'platinum') && <Circle cx="60" cy="60" r="32.6" stroke={c.insert} strokeWidth="0.8" fill="none" />}
            {scene(`${idp}c`, 0, 32, 120, [27, 27, 66, 66])}
            <Circle cx="60" cy="60" r="31.5" stroke={c.band} strokeWidth="1.4" fill="none" />
            <SvgText fontSize={fit(text, 58, 5.6)} fontFamily={fonts.bodyBold} fill={c.text} letterSpacing={0.6} textAnchor="middle">
              <TextPath href={`#${idp}rt`} startOffset="50%">{text}</TextPath>
            </SvgText>
            {sublabel ? (
              <SvgText fontSize={fit(sublabel, 58, 4.6)} fontFamily={fonts.bodySemibold} fill={c.text} letterSpacing={0.5} textAnchor="middle">
                <TextPath href={`#${idp}rb`} startOffset="50%">{sublabel.toUpperCase()}</TextPath>
              </SvgText>
            ) : null}
            {tier === 'platinum' && <Path d="M60 9.5 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4Z" fill="#1F3D2F" />}
          </G>
        );
      })()}

      {item === 'patch' && (
        <G>
          <Path d="M60 10 L102 25 L104 72 C100 96 82 109 60 113 C38 109 20 96 16 72 L18 25 Z" fill={colors.fairway} />
          <Path d="M60 10 L102 25 L104 72 C100 96 82 109 60 113 C38 109 20 96 16 72 L18 25 Z" stroke={`url(#${idp}rim)`} strokeWidth="4" fill="none" />
          {scene(`${idp}c`, -20, 10, 160, [18, 12, 84, 98])}
          <Path d="M60 14 L98 28 L100 72 C96 92 80 104 60 108 C40 104 24 92 20 72 L22 28 Z" stroke={m} strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <Path d="M14 80 C40 92 80 92 106 80 L104 98 C80 108 40 108 16 98 Z" fill={colors.fairway} stroke={m} strokeWidth="1.5" />
          <SvgText x="60" y="96" fontSize={fit(text, 78, 9)} fontFamily={fonts.displayBold} fill={colors.cream} textAnchor="middle">{text}</SvgText>
        </G>
      )}

      {item === 'bag-tag' && (
        <G>
          <Rect x="46" y="4" width="28" height="22" rx="6" fill="#7A4E2D" />
          <Rect x="53" y="9" width="14" height="10" rx="4" fill="#F2E6CF" opacity="0.9" />
          <Rect x="24" y="22" width="72" height="92" rx="14" fill="#000" opacity="0.12" />
          <Rect x="22" y="20" width="76" height="92" rx="14" fill={colors.fairway} />
          <Rect x="27" y="25" width="66" height="82" rx="10" stroke={m} strokeWidth="1.2" strokeDasharray="3 2.5" fill="none" />
          <Circle cx="60" cy="31" r="4" fill="#F2E6CF" stroke={m} strokeWidth="1.5" />
          <G transform="translate(42 40) scale(0.36)">
            <Path d="M52 74 V14" stroke={l} strokeWidth="4" strokeLinecap="round" />
            <Path d="M52 15 L78 23 L52 32 Z" fill={m} />
            <Path d="M8 80 C30 62 62 60 94 70 C70 66 40 70 18 84 Z" fill={m} />
          </G>
          <SvgText x="60" y={line2 ? 86 : 92} fontSize={fit(line1, 60, 11)} fontFamily={fonts.displayBold} fill={l} textAnchor="middle">{line1}</SvgText>
          {line2 ? <SvgText x="60" y="98" fontSize={fit(line2, 60, 11)} fontFamily={fonts.displayBold} fill={l} textAnchor="middle">{line2}</SvgText> : null}
        </G>
      )}

      {item === 'pin' && (
        <G>
          <Ellipse cx="60" cy="82" rx="46" ry="20" fill="#000" opacity="0.12" />
          <Ellipse cx="60" cy="78" rx="46" ry="20" fill={`url(#${idp}rim)`} />
          <Ellipse cx="60" cy="76" rx="42" ry="17" fill={PAL.fairway} />
          <Ellipse cx="62" cy="74" rx="28" ry="10" fill={PAL.green} />
          <Ellipse cx="32" cy="80" rx="10" ry="4" fill={PAL.sand} />
          <Path d="M64 74 V24" stroke="#E8E2D2" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M64 25 L90 33 L64 42 Z" fill={colors.pennant} />
          <Ellipse cx="64" cy="74" rx="3" ry="1.4" fill="#2A2A24" />
        </G>
      )}

      {item === 'pitch-marker' && (
        <G>
          <Path d="M48 56 L44 110 L52 110 L56 62 L64 62 L68 110 L76 110 L72 56 Z" fill={`url(#${idp}rim)`} />
          <Circle cx="60" cy="38" r="26" fill={`url(#${idp}rim)`} />
          <Circle cx="60" cy="38" r="22" fill={d} />
          {scene(`${idp}c`, 39, 22, 42, [38, 16, 44, 44])}
          <Circle cx="60" cy="38" r="21" stroke={d} strokeWidth="1.2" fill="none" />
        </G>
      )}
    </Svg>
  );
}

// ── Achievement badges ─────────────────────────────────────────────────────

const SHIELD = 'M60 6 C80 6 98 12 104 18 L104 62 C104 88 84 104 60 114 C36 104 16 88 16 62 L16 18 C22 12 40 6 60 6 Z';

export function BadgeArt({ id, name, symbol, sim = false, earned = true, size = 72 }: {
  id: string; name: string; symbol?: string; sim?: boolean; earned?: boolean; size?: number;
}) {
  const idp = useSvgId('bd');
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" opacity={earned ? 1 : 0.45}>
      <Defs>
        <LinearGradient id={`${idp}rim`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F3DC9A" />
          <Stop offset="0.5" stopColor={colors.gold} />
          <Stop offset="1" stopColor="#8A6215" />
        </LinearGradient>
        <ClipPath id={`${idp}c`}>
          <Path d="M60 12 C78 12 93 17 98 22 L98 62 C98 84 81 98 60 107 C39 98 22 84 22 62 L22 22 C27 17 42 12 60 12 Z" />
        </ClipPath>
      </Defs>
      <Path d={SHIELD} fill={`url(#${idp}rim)`} />
      <G clipPath={`url(#${idp}c)`}>
        <G transform="translate(-30 10) scale(0.6)">
          <SceneShapes seed={id} idp={`${idp}s`} detail={false} style={sim ? 'hills' : undefined} />
        </G>
      </G>
      {symbol ? (
        <G>
          <Circle cx="60" cy="50" r="17" fill={colors.cream} opacity="0.92" stroke={colors.gold} strokeWidth="1.5" />
          <SvgText x="60" y={symbol.length > 2 ? 54 : 56} fontSize={symbol.length > 2 ? 12 : 16} fontFamily={fonts.displayBold} fill={colors.fairway} textAnchor="middle">{symbol}</SvgText>
        </G>
      ) : null}
      <Path d="M8 76 L112 76 L106 86 L112 96 L8 96 L14 86 Z" fill={sim ? colors.slate : colors.fairway} stroke={colors.gold} strokeWidth="1.2" />
      <SvgText x="60" y="89.5" fontSize={name.length > 13 ? 7.2 : 8.5} fontFamily={fonts.bodyBold} fill={colors.cream} textAnchor="middle" letterSpacing={0.6}>
        {name.toUpperCase()}
      </SvgText>
    </Svg>
  );
}
