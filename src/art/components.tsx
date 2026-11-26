import { useId } from 'react';
import { Image, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Image as SvgImage, Path, Text as SvgText, TextPath } from 'react-native-svg';

import type { CollectibleItem, Tier } from '@/domain/types';
import { fonts } from '@/theme';

import badgeLayouts from './badges.json';
import frames from './frames.json';
import { artKeys, courseEngravingKeys, courseHeroKeys, firstArt, getArt } from './index';
import { BadgeArt, CollectibleArt, EmblemMark, EngravingStrip, Landscape, ringPaths, TreeMark } from './placeholders';

export { courseEngravingKeys, courseHeroKeys };

/** Landscape: first painted PNG found in `artKeys` (e.g. course override → region), else the vector scene. */
export function SceneImage({ artKeys: keys, seed, style }: { artKeys?: string | string[]; seed: string; style?: ViewStyle }) {
  const hit = keys ? firstArt(Array.isArray(keys) ? keys : [keys]) : undefined;
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      {hit ? <Image source={hit.src} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Landscape seed={seed} />}
    </View>
  );
}

/** Hero/thumbnail for a course: destination override → region hero → vector placeholder (seeded by region). */
export function CourseScene({ course, style }: { course: { id: string; region: string }; style?: ViewStyle }) {
  return <SceneImage artKeys={courseHeroKeys(course)} seed={course.region} style={style} />;
}

// ── Collectibles ────────────────────────────────────────────────────────────

type FrameLayout = {
  window: { type: 'circle'; cx: number; cy: number; r: number } | { type: 'path'; d: string; box: number[] } | null;
  label:
    | { type?: 'lines'; x: number; y: number; maxWidth: number; maxFontSize: number; lines: number; lineHeight?: number; color: string; font: string }
    | { type: 'ring'; cx: number; cy: number; rTop: number; rBottom: number; maxFontSize: number; subMaxFontSize: number; maxArc: number; color: string; colorByTier?: Partial<Record<Tier, string>>; font: string }
    | null;
};
const FRAMES = frames.frames as Record<CollectibleItem, FrameLayout>;
const CANVAS = frames.canvas;

/** Font size that fits `t` within `maxWidth` (approx. glyph width 0.72em for Playfair bold caps). */
const fitSize = (t: string, maxWidth: number, max: number) => Math.min(max, maxWidth / (Math.max(t.length, 1) * 0.72));

function splitLines(text: string, lines: number): string[] {
  const words = text.split(' ');
  if (lines < 2 || words.length < 2) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}

/**
 * A course collectible, composed from shared layers. Only ball markers are tiered:
 *   1. region vignette clipped into the frame's window
 *   2. the standard frame PNG for this kind (+ tier rim for ball markers)
 *   3. the course name drawn as text in the frame's label area
 * A one-off image at courses/<id>/collectibles/<itemId> replaces the whole thing.
 * Any missing layer falls back to the vector placeholder.
 */
export function Collectible({ courseId, region, kind, id = kind, tier, label, sublabel, size = 120, dim = false }: {
  courseId: string; region: string; kind: CollectibleItem; id?: string; tier?: Tier | null; label: string; sublabel?: string; size?: number; dim?: boolean;
}) {
  const clipId = `cw${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const opacity = dim ? 0.28 : 1;
  // Only ball markers are tiered (by best score at the course); other collectibles have one fixed look.
  if (kind !== 'ball-marker') tier = null;

  const custom = getArt(artKeys.courseCollectible(courseId, id));
  if (custom) return <Image source={custom} style={{ width: size, height: size, opacity }} resizeMode="contain" />;

  const frame = kind === 'ball-marker'
    ? firstArt([artKeys.frame(kind, tier), artKeys.frame(kind)])?.src
    : getArt(artKeys.frame(kind));
  if (!frame) return <CollectibleArt courseId={region} item={kind} tier={tier ?? 'base'} label={label} sublabel={sublabel} size={size} dim={dim} vignette={getArt(artKeys.regionVignette(region))} />;

  const layout = FRAMES[kind];
  const vignette = getArt(artKeys.regionVignette(region));
  const text = label.toUpperCase();
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`} opacity={opacity}>
      {layout.window ? (
        <>
          <Defs>
            <ClipPath id={clipId}>
              {layout.window.type === 'circle'
                ? <Circle cx={layout.window.cx} cy={layout.window.cy} r={layout.window.r + 6} />
                : <Path d={layout.window.d} />}
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${clipId})`}>
            {vignette ? <WindowImage src={vignette} layout={layout} /> : <WindowScene region={region} layout={layout} />}
          </G>
        </>
      ) : null}
      <SvgImage href={frame} x={0} y={0} width={CANVAS} height={CANVAS} preserveAspectRatio="xMidYMid meet" />
      {layout.label?.type === 'ring'
        ? <RingLabel id={clipId} text={text} sub={sublabel?.toUpperCase()} tier={tier} layout={layout.label} />
        : layout.label ? <FrameLabel text={text} layout={layout.label} /> : null}
    </Svg>
  );
}

function windowBox(layout: FrameLayout): [number, number, number, number] {
  const w = layout.window!;
  if (w.type === 'circle') return [w.cx - w.r, w.cy - w.r, w.r * 2, w.r * 2];
  const [x0, y0, x1, y1] = w.box;
  return [x0, y0, x1 - x0, y1 - y0];
}

function WindowImage({ src, layout }: { src: ImageSourcePropType; layout: FrameLayout }) {
  const [x, y, w, h] = windowBox(layout);
  return <SvgImage href={src} x={x - 8} y={y - 8} width={w + 16} height={h + 16} preserveAspectRatio="xMidYMid slice" />;
}

function WindowScene({ region, layout }: { region: string; layout: FrameLayout }) {
  const [x, y, w, h] = windowBox(layout);
  const s = Math.max(w / 300, h / 200);
  return (
    <G transform={`translate(${x + w / 2 - 150 * s} ${y + h / 2 - 100 * s}) scale(${s})`}>
      <Landscape seed={region} inline />
    </G>
  );
}

/** Poker-chip ring text: name over the top, town · state under the bottom. */
function RingLabel({ id, text, sub, tier, layout }: { id: string; text: string; sub?: string; tier?: Tier | null; layout: Extract<NonNullable<FrameLayout['label']>, { type: 'ring' }> }) {
  const color = (tier && layout.colorByTier?.[tier]) || layout.color;
  const paths = ringPaths(layout.cx, layout.cy, layout.rTop, layout.rBottom);
  const family = layout.font === 'display' ? fonts.displayBold : fonts.bodyBold;
  return (
    <>
      <Defs>
        <Path id={`${id}rt`} d={paths.top} />
        <Path id={`${id}rb`} d={paths.bottom} />
      </Defs>
      <SvgText fontSize={fitSize(text, layout.maxArc, layout.maxFontSize)} fontFamily={family} fill={color} letterSpacing={6} textAnchor="middle">
        <TextPath href={`#${id}rt`} startOffset="50%">{text}</TextPath>
      </SvgText>
      {sub ? (
        <SvgText fontSize={fitSize(sub, layout.maxArc, layout.subMaxFontSize)} fontFamily={fonts.bodySemibold} fill={color} letterSpacing={5} textAnchor="middle">
          <TextPath href={`#${id}rb`} startOffset="50%">{sub}</TextPath>
        </SvgText>
      ) : null}
    </>
  );
}

function FrameLabel({ text, layout }: { text: string; layout: Extract<NonNullable<FrameLayout['label']>, { type?: 'lines' }> }) {
  const lines = splitLines(text, layout.lines);
  // One size for every line (the longest line decides), so wrapped names look evenly set.
  const size = Math.min(...lines.map((l) => fitSize(l, layout.maxWidth, layout.maxFontSize)));
  const lh = layout.lineHeight ?? layout.maxFontSize * 1.1;
  const startY = layout.y - ((lines.length - 1) * lh) / 2;
  return (
    <>
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={layout.x}
          y={startY + i * lh}
          fontSize={size}
          fontFamily={layout.font === 'display' ? fonts.displayBold : fonts.bodyBold}
          fill={layout.color}
          textAnchor="middle"
          alignmentBaseline="middle">
          {line}
        </SvgText>
      ))}
    </>
  );
}

// ── Badges & brand ─────────────────────────────────────────────────────────

const BADGE_SYMBOLS: Record<string, string> = {
  'break-100': '100', 'break-90': '90', 'break-80': '80', 'first-birdie': '−1', '100-birdies': '100',
  'state-traveler': '5', 'golf-traveler': '10', 'course-collector': '★', 'keepsake-50': '50',
  'sim-break-80': '80', 'sim-explorer': '10',
};

type RibbonLayout = { x: number; y: number; maxWidth: number; maxFontSize: number; color: string };

/** Painted badge PNG with its name written on the blank ribbon (layout measured per badge in badges.json). */
export function Badge({ id, name, sim, earned = true, size = 72 }: { id: string; name: string; sim?: boolean; earned?: boolean; size?: number }) {
  const src = getArt(artKeys.badge(id));
  if (src) {
    const l = ((badgeLayouts.badges as Record<string, RibbonLayout>)[id] ?? badgeLayouts.default) as RibbonLayout;
    const text = name.toUpperCase();
    return (
      <Svg width={size} height={size} viewBox="0 0 1024 1024" opacity={earned ? 1 : 0.45}>
        <SvgImage href={src} x={0} y={0} width={1024} height={1024} preserveAspectRatio="xMidYMid meet" />
        <SvgText
          x={l.x}
          y={l.y}
          fontSize={fitSize(text, l.maxWidth, l.maxFontSize)}
          fontFamily={fonts.displayBold}
          fill={l.color}
          textAnchor="middle"
          alignmentBaseline="middle"
          letterSpacing={2}>
          {text}
        </SvgText>
      </Svg>
    );
  }
  return <BadgeArt id={id} name={name} symbol={BADGE_SYMBOLS[id]} sim={sim} earned={earned} size={size} />;
}

/** Brand emblem (shield + laurels). On dark backgrounds uses the reversed cream/gold version when available. */
export function Emblem({ size = 40, onDark = true }: { size?: number; onDark?: boolean }) {
  const src = firstArt(onDark ? [artKeys.emblemOnDark, artKeys.emblem] : [artKeys.emblem, artKeys.emblemOnDark])?.src;
  if (src) return <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />;
  return <EmblemMark size={size} flagColor={onDark ? '#F2E6CF' : '#1F3D2F'} />;
}

export function Tree({ size = 44 }: { size?: number }) {
  const src = getArt(artKeys.scorecardTree);
  if (src) return <Image source={src} style={{ width: size, height: size * 0.8 }} resizeMode="contain" />;
  return <TreeMark size={size} />;
}

/** Full-width strip at a fixed 3:1 aspect (matches the 1200×400 asset spec): course override → region → vector. */
export function ScorecardEngraving({ course }: { course: { id: string; region: string } }) {
  const hit = firstArt(courseEngravingKeys(course));
  return (
    <View style={{ width: '100%', aspectRatio: 3 }}>
      {hit ? <Image source={hit.src} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : <EngravingStrip seed={course.region} height="100%" />}
    </View>
  );
}
