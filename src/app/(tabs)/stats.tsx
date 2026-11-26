import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChartCard, LineChart, MeterRow, Ring, SegmentedBar, Sparkline } from '@/components/charts';
import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { RoundRow } from '@/components/round-card';
import { Chips, Empty, Group, SheetScreen, StatStrip } from '@/components/ui';
import { analytics, recentRounds, trendDelta, type Analytics } from '@/domain/analytics';
import { formatToPar, type RoundSummary } from '@/domain/stats';
import { formatDate, oneDecimal, pct } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { chart, colors, fonts, radius, shadow, space, type } from '@/theme';

type View_ = 'overview' | 'rounds' | 'sim';
type Range = 10 | 20 | 'all';

export default function Stats() {
  const params = useLocalSearchParams<{ courseId?: string; view?: View_ }>();
  // The tab stays mounted, so a new deep link (e.g. a course's "View Scorecards") resets the picked view.
  const linked: View_ = params.view ?? (params.courseId ? 'rounds' : 'overview');
  const sig = `${params.view ?? ''}|${params.courseId ?? ''}`;
  const [picked, setPicked] = useState<{ sig: string; view: View_ }>({ sig, view: linked });
  const view = picked.sig === sig ? picked.view : linked;
  const setView = (v: View_) => setPicked({ sig, view: v });
  const [range, setRange] = useState<Range>(20);

  return (
    <SheetScreen title="Stats">
      <Chips
        value={view}
        onChange={setView}
        options={[{ value: 'overview', label: 'Overview' }, { value: 'rounds', label: 'Rounds' }, { value: 'sim', label: 'Sim' }]}
      />
      {view === 'rounds' ? (
        <RoundsList courseId={params.courseId} />
      ) : (
        <Overview track={view === 'sim' ? 'sim' : 'course'} range={range} setRange={setRange} key={view} />
      )}
    </SheetScreen>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────

function Overview({ track, range, setRange }: { track: 'course' | 'sim'; range: Range; setRange: (r: Range) => void }) {
  const data = useAppData();
  const all = useMemo(
    () => data.roundsByDate.map((r) => data.summaries.get(r.id)).filter((s): s is RoundSummary => !!s && s.kind === track && s.isComplete),
    [data.roundsByDate, data.summaries, track],
  );
  const scoped = recentRounds(all, range === 'all' ? undefined : range);
  const a = analytics(scoped);
  const nameOf = (id: string) => {
    const r = data.roundById(id);
    return r ? shortCourseName(data.roundCourseName(r)) : '';
  };

  if (all.length === 0) {
    return <Empty title={track === 'sim' ? 'No sim rounds yet' : 'No rounds yet'} body="Log a round with + and your stats build from there." />;
  }

  const trendPoints = a.trend.map((t) => ({ value: t.strokes, label: formatDate(t.date), detail: nameOf(t.roundId) }));
  const diffs = [...data.meData.differentials.entries()].filter(([id]) => scoped.some((s) => s.roundId === id)).map(([, d]) => d);
  const scoreDelta = trendDelta(a.trend.map((t) => t.strokes));

  return (
    <>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>{track === 'sim' ? 'Sim rounds · separate track' : 'Course rounds'}</Text>
        <View style={styles.rangeChips}>
          {([10, 20, 'all'] as Range[]).map((r) => (
            <Tap key={String(r)} haptic={range === r ? 'none' : 'select'} scaleTo={0.94} onPress={() => setRange(r)} accessibilityRole="tab" accessibilityState={{ selected: range === r }} style={[styles.rangeChip, range === r && styles.rangeChipOn]}>
              <Text style={[styles.rangeText, range === r && styles.rangeTextOn]}>{r === 'all' ? 'All' : `Last ${r}`}</Text>
            </Tap>
          ))}
        </View>
      </View>

      {/* Headline */}
      <Animated.View entering={enterItem(0)} style={styles.hero}>
        {track === 'course' ? (
          <View style={styles.heroMain}>
            <Text style={styles.heroLabel}>HANDICAP INDEX</Text>
            <Text style={styles.heroValue}>{data.handicap === null ? '—' : data.handicap.toFixed(1)}</Text>
            <Text style={styles.heroNote}>Estimated from your last {Math.min(20, data.meData.differentials.size)} rated rounds</Text>
          </View>
        ) : (
          <View style={styles.heroMain}>
            <Text style={styles.heroLabel}>SIM AVERAGE</Text>
            <Text style={styles.heroValue}>{oneDecimal(a.avgScore)}</Text>
            <Text style={styles.heroNote}>{a.full18} full sim rounds</Text>
          </View>
        )}
        <View style={styles.heroSide}>
          <SideStat label="Avg score" value={oneDecimal(a.avgScore)} sub={a.avgToPar === null ? undefined : formatToPar(Math.round(a.avgToPar))} />
          <SideStat label="Best" value={a.best ? String(a.best.strokes) : '—'} sub={a.best ? formatToPar(a.best.toPar) : undefined} />
          <SideStat label="Rounds" value={String(a.rounds)} />
        </View>
      </Animated.View>

      <StatStrip
        compact
        items={[
          { label: 'Putts / rd', value: oneDecimal(a.putting.perRound) },
          { label: 'Birdies / 18', value: oneDecimal(a.birdiesPer18) },
          { label: 'Fairways', value: pct(a.driving.pct) },
          { label: 'GIR', value: pct(a.approach.pct) },
        ]}
      />

      <ChartCard
        title="Scoring trend"
        subtitle="Full 18-hole rounds · press and drag to inspect"
        right={scoreDelta !== null ? <Delta value={scoreDelta} /> : undefined}>
        <LineChart points={trendPoints} />
        {track === 'course' && diffs.length > 1 ? (
          <View style={styles.inline}>
            <Text style={styles.inlineLabel}>Differentials</Text>
            <Sparkline values={diffs} width={120} height={20} />
            <Text style={styles.inlineValue}>{diffs[diffs.length - 1].toFixed(1)}</Text>
          </View>
        ) : null}
      </ChartCard>

      <ChartCard title="Scoring" subtitle={`${a.scoring.holes} holes`}>
        <ScoringBar a={a} />
        <View style={styles.twoUp}>
          <MiniFigure label="Birdies or better / 18" value={oneDecimal(a.birdiesPer18)} />
          <MiniFigure label="Doubles or worse / 18" value={oneDecimal(a.doublesPer18)} />
        </View>
      </ChartCard>

      <ChartCard title="By par" subtitle="Average strokes per hole">
        {a.parTypes.map((p) => (
          <MeterRow
            key={p.par}
            label={`Par ${p.par}s`}
            value={p.avgStrokes === null ? '—' : p.avgStrokes.toFixed(2)}
            note={p.avgToPar === null ? undefined : `${p.avgToPar >= 0 ? '+' : ''}${p.avgToPar.toFixed(2)}`}
            fraction={p.avgToPar === null ? null : Math.min(1, Math.max(0, p.avgToPar) / 1.5)}
          />
        ))}
        <Text style={styles.foot}>Bar shows strokes over par (full bar = +1.5).</Text>
      </ChartCard>

      <ChartCard title="Off the tee" subtitle={a.driving.entered ? `${a.driving.entered} par 4s and 5s tracked` : 'Not tracked yet'}>
        {a.driving.entered ? (
          <>
            <SegmentedBar
              segments={[
                { key: 'left', label: 'Left', value: a.driving.left, color: chart.bogey, ink: colors.white },
                { key: 'hit', label: 'Fairway', value: a.driving.hit, color: chart.line, ink: colors.cream },
                { key: 'right', label: 'Right', value: a.driving.right, color: chart.double, ink: colors.white },
                { key: 'short', label: 'Short', value: a.driving.short, color: chart.par, ink: colors.ink },
              ]}
            />
            <Text style={styles.foot}>{missNote(a)}</Text>
          </>
        ) : <Text style={styles.foot}>Record fairway results during a round to see your miss pattern.</Text>}
      </ChartCard>

      <ChartCard title="Approach, short game & putting">
        <View style={styles.rings}>
          <Ring value={a.approach.pct} label="Greens in reg." sub={a.approach.entered ? `${a.approach.hit}/${a.approach.entered}` : undefined} />
          <Ring value={a.scrambling.pct} label="Scrambling" sub={a.scrambling.chances ? `${a.scrambling.saves}/${a.scrambling.chances}` : undefined} />
          <Ring value={a.putting.onePuttPct} label="One-putts" sub={a.putting.entered ? `${a.putting.entered} holes` : undefined} />
        </View>
        <View style={styles.divider} />
        <View style={styles.twoUp}>
          <MiniFigure label="Putts / round" value={oneDecimal(a.putting.perRound)} />
          <MiniFigure label="Putts / GIR" value={a.putting.perGir === null ? '—' : a.putting.perGir.toFixed(2)} />
          <MiniFigure label="3-putts / 18" value={oneDecimal(a.putting.threePuttsPer18)} />
        </View>
        <View style={styles.divider} />
        <View style={styles.twoUp}>
          <MiniFigure label="Front 9 to par" value={signed(a.frontNine)} />
          <MiniFigure label="Back 9 to par" value={signed(a.backNine)} />
          <MiniFigure label="Penalties / 18" value={oneDecimal(a.penaltiesPer18)} />
        </View>
      </ChartCard>

      {track === 'course' ? <CourseAverages rounds={scoped} /> : null}
    </>
  );
}

const signed = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}`);

function missNote(a: Analytics) {
  const { left, right } = a.driving;
  if (left === right) return 'Misses are evenly split.';
  const side = left > right ? 'left' : 'right';
  const share = Math.round((Math.max(left, right) / Math.max(1, left + right)) * 100);
  return `${share}% of your misses go ${side}.`;
}

function ScoringBar({ a }: { a: Analytics }) {
  const s = a.scoring;
  return (
    <SegmentedBar
      segments={[
        { key: 'eagle', label: 'Eagle+', value: s.eagles, color: chart.eagle, ink: colors.white },
        { key: 'birdie', label: 'Birdie', value: s.birdies, color: chart.birdie, ink: colors.ink },
        { key: 'par', label: 'Par', value: s.pars, color: chart.par, ink: colors.ink },
        { key: 'bogey', label: 'Bogey', value: s.bogeys, color: chart.bogey, ink: colors.white },
        { key: 'double', label: 'Double+', value: s.doublesPlus, color: chart.double, ink: colors.white },
      ]}
    />
  );
}

function CourseAverages({ rounds }: { rounds: RoundSummary[] }) {
  const data = useAppData();
  const byCourse = new Map<string, RoundSummary[]>();
  rounds.filter((s) => s.isFull18).forEach((s) => byCourse.set(s.courseId, [...(byCourse.get(s.courseId) ?? []), s]));
  const rows = [...byCourse.entries()]
    .map(([id, ss]) => ({ id, n: ss.length, avg: ss.reduce((a, s) => a + s.strokes, 0) / ss.length, best: Math.min(...ss.map((s) => s.strokes)) }))
    .sort((x, y) => x.avg - y.avg);
  if (!rows.length) return null;
  return (
    <ChartCard title="By course" subtitle="Full rounds, lowest average first">
      {rows.map((r, i) => {
        const c = data.courseById(r.id);
        return (
          <Tap key={r.id} onPress={() => router.push(`/course/${r.id}`)} scaleTo={0.985} accessibilityRole="button" style={[styles.courseRow, i > 0 && styles.courseRowRule]}>
            <Text style={styles.courseName} numberOfLines={1}>{c ? shortCourseName(c.name) : r.id}</Text>
            <Text style={styles.courseMeta}>{r.n} {r.n === 1 ? 'round' : 'rounds'}</Text>
            <Text style={styles.courseAvg}>{r.avg.toFixed(1)}</Text>
            <Text style={styles.courseBest}>best {r.best}</Text>
          </Tap>
        );
      })}
    </ChartCard>
  );
}

function SideStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.sideStat}>
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={styles.sideValue}>{value}{sub ? <Text style={styles.sideSub}> {sub}</Text> : null}</Text>
    </View>
  );
}

function MiniFigure({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

/** Newer half vs older half of the trend; lower is better for scores. */
function Delta({ value }: { value: number }) {
  const better = value < 0;
  const flat = Math.abs(value) < 0.5;
  return (
    <View style={[styles.delta, !flat && (better ? styles.deltaGood : styles.deltaBad)]}>
      <Icon name="trend" size={13} color={colors.ink} />
      <Text style={styles.deltaText}>{flat ? 'Steady' : `${better ? '' : '+'}${value.toFixed(1)} strokes`}</Text>
    </View>
  );
}

// ── Rounds ─────────────────────────────────────────────────────────────────

function RoundsList({ courseId }: { courseId?: string }) {
  const data = useAppData();
  const course = courseId ? data.courseById(courseId) : undefined;
  const rounds = data.roundsByDate.filter((r) => !course || (r.kind === 'course' && r.courseId === course.id));
  return (
    <>
      {course ? (
        <Tap scaleTo={0.94} style={styles.filterPill} onPress={() => router.setParams({ courseId: undefined })} accessibilityRole="button" accessibilityLabel="Clear course filter">
          <Text style={styles.filterText} numberOfLines={1}>{course.name}</Text>
          <Icon name="x" size={14} color={colors.cream} />
        </Tap>
      ) : null}
      {rounds.length === 0 ? (
        <Empty title="No rounds" body="Tap + to log a round." />
      ) : (
        <Animated.View entering={enterItem(0)}>
          <Group inset={space.md}>
            {rounds.map((r) => (
              <RoundRow key={r.id} round={r} summary={data.summaries.get(r.id)} name={data.roundCourseName(r)} />
            ))}
          </Group>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -space.xs },
  rangeLabel: { ...type.caption, color: colors.inkMuted },
  rangeChips: { flexDirection: 'row', gap: 4 },
  rangeChip: { paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.paper },
  rangeChipOn: { backgroundColor: colors.fairway },
  rangeText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  rangeTextOn: { color: colors.cream },
  hero: { flexDirection: 'row', backgroundColor: colors.fairway, borderRadius: radius.xl, padding: space.xl, gap: space.lg, ...shadow.card },
  heroMain: { flex: 1.25, justifyContent: 'center' },
  heroLabel: { ...type.label, fontSize: 10, color: colors.goldSoft },
  heroValue: { fontFamily: fonts.displayBold, fontSize: 56, lineHeight: 64, color: colors.cream },
  heroNote: { ...type.caption, fontSize: 11, color: 'rgba(246,239,227,0.72)' },
  heroSide: { flex: 1, gap: space.sm, justifyContent: 'center', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(246,239,227,0.25)', paddingLeft: space.lg },
  sideStat: { gap: 0 },
  sideLabel: { ...type.caption, fontSize: 11, color: 'rgba(246,239,227,0.72)' },
  sideValue: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.cream },
  sideSub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(246,239,227,0.72)' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule, paddingTop: space.md },
  inlineLabel: { ...type.caption, color: colors.inkMuted, flex: 1 },
  inlineValue: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, fontVariant: ['tabular-nums'] },
  twoUp: { flexDirection: 'row', gap: space.md },
  miniValue: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  miniLabel: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.rule },
  foot: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  rings: { flexDirection: 'row', justifyContent: 'space-between' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.paper },
  deltaGood: { backgroundColor: colors.goldSoft },
  deltaBad: { backgroundColor: colors.paper },
  deltaText: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.ink },
  courseRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, paddingVertical: 10 },
  courseRowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  courseName: { flex: 1, fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  courseMeta: { ...type.caption, color: colors.inkMuted },
  courseAvg: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  courseBest: { ...type.caption, color: colors.inkMuted, minWidth: 48, textAlign: 'right' },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, maxWidth: '100%' },
  filterText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.cream, flexShrink: 1 },
});
