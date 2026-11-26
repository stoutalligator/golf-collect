/**
 * Small SVG chart kit for the Stats dashboard (react-native-svg, no chart library).
 * Specs: 2px lines, hairline solid grid, ≥8px end dots with a 2px surface ring, 2px surface gaps between
 * segments, text in ink tokens (never the series color), selective labels, touch-to-inspect on line charts.
 */
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { haptics } from '@/lib/haptics';
import { chart, colors, fonts, radius, shadow, space, type } from '@/theme';

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

const niceStep = (span: number, ticks: number) => {
  const raw = span / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

// ── Line chart ─────────────────────────────────────────────────────────────

export interface LinePoint {
  value: number;
  /** Short x label for the tooltip (e.g. "Nov 22"). */
  label: string;
  /** Extra tooltip line (e.g. course name). */
  detail?: string;
}

/** Rolling mean over the previous `n` values (fewer at the start). */
const rolling = (vals: number[], n: number) => vals.map((_, i) => {
  const w = vals.slice(Math.max(0, i - n + 1), i + 1);
  return w.reduce((a, b) => a + b, 0) / w.length;
});

/**
 * Rounds over time: each round a muted dot, with a rolling-average line on top (the trend to read).
 * The best round is marked in gold. Press and drag to inspect any round.
 */
export function LineChart({ points, height = 176, window = 5, format = (v) => String(v), lowerIsBetter = true, valueName = 'Score' }: {
  points: LinePoint[];
  height?: number;
  /** Rounds in the rolling average. */
  window?: number;
  format?: (v: number) => string;
  lowerIsBetter?: boolean;
  valueName?: string;
}) {
  const [width, onLayout] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const padL = 30;
  const padR = 36;
  const padT = 12;
  const padB = 8;

  if (points.length < 2) {
    return <Text style={styles.emptyChart}>Log a couple more rounds to see a trend.</Text>;
  }

  const values = points.map((p) => p.value);
  const avg = rolling(values, window);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = niceStep(Math.max(hi - lo, 1), 3);
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.max(Math.ceil(hi / step) * step, yMin + step);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);

  const innerW = Math.max(1, width - padL - padR);
  const innerH = height - padT - padB;
  const x = (i: number) => padL + (i / (points.length - 1)) * innerW;
  const y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const path = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const bestIdx = values.indexOf(lowerIsBetter ? Math.min(...values) : Math.max(...values));
  const last = points.length - 1;

  const pick = (e: GestureResponderEvent) => {
    const lx = e.nativeEvent.locationX;
    const i = Math.max(0, Math.min(last, Math.round(((lx - padL) / innerW) * last)));
    if (i !== active) {
      haptics.select();
      setActive(i);
    }
  };

  const shown = active;
  const tipLeft = shown === null ? 0 : Math.max(0, Math.min(width - 148, x(shown) - 74));
  const dotR = points.length > 24 ? 3 : 4;

  return (
    <View style={{ gap: space.sm }}>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {ticks.map((t) => (
                <Line key={t} x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={chart.grid} strokeWidth={1} />
              ))}
              {shown !== null ? <Line x1={x(shown)} x2={x(shown)} y1={padT} y2={padT + innerH} stroke={colors.inkMuted} strokeWidth={1} /> : null}
              {values.map((v, i) => (
                <Circle key={i} cx={x(i)} cy={y(v)} r={i === shown ? dotR + 1.5 : dotR} fill={i === bestIdx ? chart.birdie : chart.muted} stroke={colors.creamLight} strokeWidth={1.5} />
              ))}
              <Path d={path(avg)} stroke={chart.line} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
              <Circle cx={x(last)} cy={y(avg[last])} r={4.5} fill={chart.line} stroke={colors.creamLight} strokeWidth={2} />
            </Svg>
            {ticks.map((t) => (
              <Text key={t} style={[styles.tick, { top: y(t) - 7, left: 0, width: padL - 6 }]}>{format(t)}</Text>
            ))}
            <Text style={[styles.endLabel, { top: y(avg[last]) - 8, left: width - padR + 6 }]}>{avg[last].toFixed(1)}</Text>
            {shown !== null ? (
              <View pointerEvents="none" style={[styles.tooltip, { left: tipLeft, top: 0 }]}>
                <Text style={styles.tipValue}>{valueName} {format(values[shown])}<Text style={styles.tipAvg}>  ·  avg {avg[shown].toFixed(1)}</Text></Text>
                <Text style={styles.tipLabel} numberOfLines={1}>{points[shown].label}{points[shown].detail ? ` · ${points[shown].detail}` : ''}</Text>
              </View>
            ) : null}
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={pick}
              onResponderMove={pick}
              onResponderRelease={() => setActive(null)}
              onResponderTerminate={() => setActive(null)}
              accessibilityRole="image"
              accessibilityLabel={`${points.length} rounds. Latest ${format(values[last])}, ${window}-round average ${avg[last].toFixed(1)}, best ${format(values[bestIdx])}`}
            />
          </>
        ) : null}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: chart.muted }]} />
          <Text style={styles.legendText}>Round</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: chart.line }]} />
          <Text style={styles.legendText}>{window}-round average</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: chart.birdie }]} />
          <Text style={styles.legendText}>Best</Text>
        </View>
      </View>
    </View>
  );
}

// ── Segmented bar (part-to-whole) ──────────────────────────────────────────

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Text color inside the block (white or ink, by the fill's luminance). */
  ink: string;
}

/** Tall segmented bar: each part a block with its share printed inside when it fits; legend names the parts. */
export function SegmentedBar({ segments, height = 28, legend = true, format }: {
  segments: Segment[];
  height?: number;
  legend?: boolean;
  format?: (s: Segment, share: number) => string;
}) {
  const [width, onLayout] = useWidth();
  const total = segments.reduce((a, s) => a + s.value, 0);
  const parts = segments.filter((s) => s.value > 0);
  const gap = 2;
  const usable = Math.max(0, width - gap * (parts.length - 1));
  return (
    <View style={{ gap: space.sm }}>
      <View onLayout={onLayout} style={{ height, flexDirection: 'row', gap }}>
        {width > 0 && total > 0
          ? parts.map((s) => {
              const w = (s.value / total) * usable;
              const share = s.value / total;
              const text = format ? format(s, share) : `${Math.round(share * 100)}%`;
              const fits = w >= text.length * 7 + 10;
              return (
                <View key={s.key} style={{ width: w, height, backgroundColor: s.color, borderRadius: 4, justifyContent: 'center', paddingLeft: 6 }}>
                  {fits ? <Text style={[styles.segText, { color: s.ink }]}>{text}</Text> : null}
                </View>
              );
            })
          : null}
      </View>
      {legend ? (
        <View style={styles.legend}>
          {segments.map((s) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
              <Text style={styles.legendValue}>{s.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Ring meter ─────────────────────────────────────────────────────────────

/** Single-value percentage ring (FIR, GIR, scrambling). */
export function Ring({ value, size = 84, stroke = 8, label, sub }: { value: number | null; size?: number; stroke?: number; label: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(1, value));
  return (
    <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={chart.track} strokeWidth={stroke} fill="none" />
          {value !== null ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={chart.line}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${c * v} ${c}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null}
        </Svg>
        <Text style={styles.ringValue}>{value === null ? '—' : `${Math.round(v * 100)}%`}</Text>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      {sub ? <Text style={styles.ringSub}>{sub}</Text> : null}
    </View>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────

/** Tiny trend for stat tiles: de-emphasised line, latest point in the accent. */
export function Sparkline({ values, width = 64, height = 22 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => 3 + (i / (values.length - 1)) * (width - 6);
  const y = (v: number) => 3 + (1 - (v - lo) / span) * (height - 6);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={chart.muted} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={x(last)} cy={y(values[last])} r={3} fill={chart.line} stroke={colors.creamLight} strokeWidth={1.5} />
    </Svg>
  );
}

// ── Meter row ──────────────────────────────────────────────────────────────

/** Labelled horizontal meter: value text on the right, fill proportional to value/max. */
export function MeterRow({ label, value, fraction, note }: { label: string; value: string; fraction: number | null; note?: string }) {
  const [width, onLayout] = useWidth();
  const f = fraction === null ? 0 : Math.max(0, Math.min(1, fraction));
  return (
    <View style={styles.meterRow}>
      <View style={styles.meterHead}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterValue}>{value}{note ? <Text style={styles.meterNote}>  {note}</Text> : null}</Text>
      </View>
      <View onLayout={onLayout} style={styles.meterTrack}>
        {width > 0 && fraction !== null ? (
          <Svg width={width} height={8}>
            <Rect x={0} y={0} width={Math.max(8, f * width)} height={8} rx={4} fill={chart.line} />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────

/** Card with a title, optional subtitle and right-side accessory, for one chart. */
export function ChartCard({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSub}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyChart: { ...type.caption, color: colors.inkMuted, paddingVertical: space.lg, textAlign: 'center' },
  tick: { position: 'absolute', textAlign: 'right', fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  endLabel: { position: 'absolute', fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums'] },
  tooltip: { position: 'absolute', width: 148, backgroundColor: colors.fairwayDeep, borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: 8 },
  tipValue: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.cream },
  tipAvg: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(242,230,207,0.8)' },
  tipLabel: { fontFamily: fonts.body, fontSize: 11, color: 'rgba(242,230,207,0.8)' },
  segText: { fontFamily: fonts.bodySemibold, fontSize: 11 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLine: { width: 14, height: 2, borderRadius: 1 },
  legendText: { ...type.caption, color: colors.inkMuted },
  legendValue: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums'] },
  ringValue: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.ink },
  ringLabel: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink },
  ringSub: { ...type.caption, fontSize: 11, color: colors.inkMuted, marginTop: -4 },
  meterRow: { gap: 6 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  meterLabel: { ...type.body, fontSize: 14, color: colors.ink },
  meterValue: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
  meterNote: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: chart.track, overflow: 'hidden' },
  card: { backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  cardSub: { ...type.caption, color: colors.inkMuted, marginTop: 2 },
});
