import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScorecardEngraving, Tree } from '@/art/components';
import { Empty, SheetScreen } from '@/components/ui';
import { formatToPar, type HoleResult } from '@/domain/stats';
import type { Hole } from '@/domain/types';
import { formatDate, oneDecimal, pct } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';
import { EarnedThisRound } from '@/components/earned-this-round';
import { Tap } from '@/components/motion';

export default function Scorecard() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const data = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const round = data.rounds.find((r) => r.id === id);
  const summary = round ? data.summaries.get(round.id) : undefined;
  const layout = round ? data.layoutFor(round) : undefined;
  if (!round || !summary || !layout) {
    return <SheetScreen title="Scorecard" back><Empty title="Round not found" body="It may have been deleted." /></SheetScreen>;
  }

  const name = data.roundCourseName(round);
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const tee = course?.tees.find((t) => t.id === round.teeId);
  const byHole = new Map(summary.results.map((r) => [r.hole.number, r]));
  const showPutts = summary.putts.entered > 0;
  const nines = [layout.holes.slice(0, 9), layout.holes.slice(9, 18)].filter((n) => n.some((h) => round.holeNumbers.includes(h.number)));

  return (
    <SheetScreen
      title="Scorecard"
      back
      right={round.status === 'active' ? (
        <Tap haptic="press" scaleTo={0.92} onPress={() => router.replace(`/round/play/${round.id}`)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.headerAction}>Resume</Text>
        </Tap>
      ) : undefined}>
      <View style={styles.paper}>
        <View style={styles.paperTop}>
          <Tree size={84} />
          <Text style={styles.courseName}>{name}</Text>
          <Text style={styles.caption}>
            {round.kind === 'sim' ? 'SIM ROUND' : 'COURSE SCORECARD'}  ·  {formatDate(round.date).toUpperCase()}
          </Text>
          {tee ? <Text style={styles.teeLine}>{tee.name} tees · {tee.totalYards.toLocaleString('en-US')} yds</Text> : null}
        </View>

        {nines.map((nine, i) => (
          <NineGrid key={i} holes={nine} byHole={byHole} label={i === 0 ? 'Out' : 'In'} showPutts={showPutts} />
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{summary.strokes} ({formatToPar(summary.toPar)})</Text>
        </View>
        {course ? <ScorecardEngraving course={course} /> : null}
      </View>

      <EarnedThisRound round={round} celebrate={celebrate === '1'} />

      <View style={styles.legend}>
        <Legend mark="circle" label="Birdie or better" />
        <Legend mark="square" label="Bogey or worse" />
      </View>

      <View style={styles.statsRow}>
        <MiniStat label="Putts" value={summary.putts.entered ? String(summary.putts.total) : '—'} />
        <MiniStat label="Fairways" value={summary.fairways.entered ? `${summary.fairways.hit}/${summary.fairways.entered}` : '—'} />
        <MiniStat label="GIR" value={summary.gir.entered ? pct(summary.gir.hit / summary.gir.entered) : '—'} />
        <MiniStat label="Birdies" value={String(summary.birdies + summary.eagles)} />
      </View>
      {summary.putts.entered > 0 && summary.putts.entered < summary.holesPlayed ? (
        <Text style={styles.note}>Stats use the {summary.putts.entered} {summary.putts.entered === 1 ? 'hole' : 'holes'} where they were entered ({oneDecimal(summary.putts.total / summary.putts.entered)} putts/hole).</Text>
      ) : null}

      <Tap
        haptic={confirmDelete ? 'warning' : 'tap'}
        scaleTo={0.95}
        onPress={async () => {
          if (!confirmDelete) return setConfirmDelete(true);
          await data.deleteRound(round.id);
          router.back();
        }}
        accessibilityRole="button"
        style={styles.delete}>
        <Text style={[styles.deleteText, confirmDelete && { color: '#9B2C1F' }]}>{confirmDelete ? 'Tap again to delete this round' : 'Delete round'}</Text>
      </Tap>
    </SheetScreen>
  );
}

function NineGrid({ holes, byHole, label, showPutts }: { holes: Hole[]; byHole: Map<number, HoleResult>; label: string; showPutts: boolean }) {
  const played = holes.map((h) => byHole.get(h.number));
  const total = played.every(Boolean) ? played.reduce((s, r) => s + (r?.score.strokes ?? 0), 0) : null;
  const puttsTotal = played.every((r) => r?.score.putts !== undefined) ? played.reduce((s, r) => s + (r?.score.putts ?? 0), 0) : null;
  return (
    <View style={styles.grid}>
      <Row head="Hole" cells={holes.map((h) => String(h.number))} end={label} bold />
      <Row head="Par" cells={holes.map((h) => String(h.par))} end={String(holes.reduce((s, h) => s + h.par, 0))} />
      <View style={styles.row}>
        <Text style={[styles.cell, styles.head]}>Score</Text>
        {holes.map((h) => {
          const r = byHole.get(h.number);
          return (
            <View key={h.number} style={styles.cellBox}>
              {r ? <ScoreMark toPar={r.toPar} strokes={r.score.strokes} /> : <Text style={styles.cell}>·</Text>}
            </View>
          );
        })}
        <Text style={[styles.cell, styles.end, styles.bold]}>{total ?? '—'}</Text>
      </View>
      {showPutts ? (
        <Row head="Putts" cells={played.map((r) => (r?.score.putts !== undefined ? String(r.score.putts) : ''))} end={puttsTotal !== null ? String(puttsTotal) : ''} muted />
      ) : null}
    </View>
  );
}

function Row({ head, cells, end, bold, muted }: { head: string; cells: string[]; end: string; bold?: boolean; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.head]}>{head}</Text>
      {cells.map((c, i) => (
        <Text key={i} style={[styles.cell, bold && styles.bold, muted && styles.muted]}>{c}</Text>
      ))}
      <Text style={[styles.cell, styles.end, styles.bold, muted && styles.muted]}>{end}</Text>
    </View>
  );
}

/** Golf convention: circle = birdie (double = eagle), square = bogey (double = double bogey+). */
function ScoreMark({ toPar, strokes }: { toPar: number; strokes: number }) {
  const under = toPar < 0;
  const over = toPar > 0;
  const double = toPar <= -2 || toPar >= 2;
  return (
    <View style={[styles.mark, under && styles.markUnder, over && styles.markOver]}>
      <View style={[styles.markInner, double && (under ? styles.markUnderInner : styles.markOverInner)]}>
        <Text style={[styles.markText, under && { color: colors.fairwayDeep }]}>{strokes}</Text>
      </View>
    </View>
  );
}

function Legend({ mark, label }: { mark: 'circle' | 'square'; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendMark, mark === 'circle' ? styles.markUnder : styles.markOver]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const CELL = { flex: 1, textAlign: 'center' as const, fontFamily: fonts.body, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums' as const], paddingVertical: 5 };

const styles = StyleSheet.create({
  headerAction: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.cream },
  paper: { backgroundColor: colors.paper, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.rule, paddingTop: space.lg, gap: space.md, overflow: 'hidden', shadowColor: '#3B2E14', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  paperTop: { alignItems: 'center', gap: 4, paddingHorizontal: space.lg },
  courseName: { fontFamily: fonts.displayItalic, fontSize: 24, color: colors.ink, textAlign: 'center' },
  caption: { ...type.label, fontSize: 10, color: colors.inkMuted },
  teeLine: { ...type.caption, color: colors.inkMuted },
  grid: { marginHorizontal: space.sm, borderWidth: 1, borderColor: colors.rule, backgroundColor: '#F4EAD5' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  cell: CELL,
  cellBox: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  head: { flex: 1.5, textAlign: 'left', paddingLeft: 6, fontFamily: fonts.bodySemibold, fontSize: 11 },
  end: { flex: 1.3, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.rule },
  bold: { fontFamily: fonts.bodySemibold },
  muted: { color: colors.inkMuted, fontSize: 11 },
  mark: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: 'transparent' },
  markUnder: { borderRadius: 12, borderColor: colors.gold, backgroundColor: colors.goldSoft },
  markOver: { borderRadius: 2, borderColor: colors.inkMuted },
  markInner: { width: 19, height: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  markUnderInner: { borderRadius: 10, borderColor: colors.gold },
  markOverInner: { borderRadius: 1, borderColor: colors.inkMuted },
  markText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums'] },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline', gap: space.md, paddingHorizontal: space.lg },
  totalLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  total: { fontFamily: fonts.displayItalic, fontSize: 28, color: colors.ink },
  legend: { flexDirection: 'row', gap: space.lg, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendMark: { width: 14, height: 14, borderWidth: 1.2 },
  legendText: { ...type.caption, color: colors.inkMuted },
  statsRow: { flexDirection: 'row', backgroundColor: colors.creamLight, borderRadius: radius.md, paddingVertical: space.md },
  miniStat: { flex: 1, alignItems: 'center', gap: 2 },
  miniValue: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.ink },
  miniLabel: { ...type.caption, color: colors.inkMuted },
  note: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  delete: { alignSelf: 'center', padding: space.sm },
  deleteText: { ...type.caption, color: colors.inkMuted, textDecorationLine: 'underline' },
});
