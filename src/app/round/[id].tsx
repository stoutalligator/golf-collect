import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ScorecardEngraving, Tree } from '@/art/components';
import { Icon } from '@/components/icons';
import { Avatar, ReactionBar } from '@/components/social';
import { Empty, SheetScreen, StatStrip } from '@/components/ui';
import { formatToPar, type HoleResult } from '@/domain/stats';
import { roundOwner, type Hole, type Round } from '@/domain/types';
import { formatDate, oneDecimal, pct } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, type } from '@/theme';
import { EarnedThisRound } from '@/components/earned-this-round';
import { Tap } from '@/components/motion';

export default function Scorecard() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const data = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const round = data.roundById(id);
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
  const owner = data.playerById(roundOwner(round));
  const isMine = roundOwner(round) === data.me.id;
  const others = round.playerIds.filter((p) => p !== roundOwner(round)).map((p) => data.playerById(p)).filter((p) => !!p);
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
      {!isMine && owner ? (
        <Tap onPress={() => router.push(`/player/${owner.id}`)} scaleTo={0.98} accessibilityRole="button" style={styles.ownerRow}>
          <Avatar player={owner} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName}>{owner.name}’s round</Text>
            {others.length ? <Text style={styles.ownerSub}>with {others.map((p) => (p!.id === data.me.id ? 'you' : p!.name.split(' ')[0])).join(', ')}</Text> : null}
          </View>
          <Icon name="chevron-right" size={16} color={colors.inkMuted} />
        </Tap>
      ) : null}
      {round.eventRoundId ? <EventChip eventRoundId={round.eventRoundId} /> : null}
      <View style={styles.paper}>
        <View style={styles.paperTop}>
          <Tree size={52} />
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
        {course ? <View style={styles.engraving}><ScorecardEngraving course={course} /></View> : null}
      </View>

      <View style={styles.legend}>
        <Legend mark="circle" label="Birdie or better" />
        <Legend mark="square" label="Bogey or worse" />
      </View>

      <EarnedThisRound round={round} celebrate={celebrate === '1'} />

      <StatStrip
        compact
        items={[
          { label: 'Putts', value: summary.putts.entered ? String(summary.putts.total) : '—' },
          { label: 'Fairways', value: summary.fairways.entered ? `${summary.fairways.hit}/${summary.fairways.entered}` : '—' },
          { label: 'GIR', value: summary.gir.entered ? pct(summary.gir.hit / summary.gir.entered) : '—' },
          { label: 'Birdies', value: String(summary.birdies + summary.eagles) },
        ]}
      />
      {summary.putts.entered > 0 && summary.putts.entered < summary.holesPlayed ? (
        <Text style={styles.note}>Stats use the {summary.putts.entered} {summary.putts.entered === 1 ? 'hole' : 'holes'} where they were entered ({oneDecimal(summary.putts.total / summary.putts.entered)} putts/hole).</Text>
      ) : null}

      {round.status === 'complete' ? <Conversation round={round} /> : null}

      {isMine ? (
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
        <Text style={[styles.deleteText, confirmDelete && { color: colors.danger }]}>{confirmDelete ? 'Tap again to delete this round' : 'Delete round'}</Text>
      </Tap>
      ) : null}
    </SheetScreen>
  );
}

/** Reactions and comments on a completed round. */
function Conversation({ round }: { round: Round }) {
  const data = useAppData();
  const [text, setText] = useState('');
  const reactions = data.social.reactions[round.id] ?? [];
  const comments = data.social.comments[round.id] ?? [];
  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    await data.addComment(round.id, t);
  };
  return (
    <View style={styles.convo}>
      <ReactionBar roundId={round.id} reactions={reactions} comments={comments.length} />
      {comments.map((c) => {
        const p = data.playerById(c.playerId);
        return (
          <View key={c.id} style={styles.comment}>
            {p ? <Avatar player={p} size={28} /> : null}
            <View style={styles.bubble}>
              <Text style={styles.commentWho}>{p?.id === data.me.id ? 'You' : p?.name}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          </View>
        );
      })}
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Tap onPress={send} haptic="press" scaleTo={0.9} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Post comment" style={[styles.send, !text.trim() && { opacity: 0.4 }]}>
          <Icon name="chevron-right" size={18} color={colors.cream} strokeWidth={2.2} />
        </Tap>
      </View>
    </View>
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

const CELL = { flex: 1, textAlign: 'center' as const, fontFamily: fonts.body, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums' as const], paddingVertical: 5 };

const styles = StyleSheet.create({
  headerAction: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway, paddingHorizontal: space.md, paddingVertical: 10, backgroundColor: colors.paper, borderRadius: radius.pill, overflow: 'hidden' },
  paper: { backgroundColor: colors.paper, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingTop: space.lg, paddingBottom: space.sm, gap: space.md, overflow: 'hidden', ...shadow.card },
  engraving: { paddingHorizontal: space.xl, opacity: 0.85 },
  paperTop: { alignItems: 'center', gap: 4, paddingHorizontal: space.lg },
  courseName: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 32, color: colors.ink, textAlign: 'center' },
  caption: { ...type.label, fontSize: 10, color: colors.inkMuted },
  teeLine: { ...type.caption, color: colors.inkMuted },
  grid: { marginHorizontal: space.sm, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.creamLight },
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
  total: { fontFamily: fonts.displayItalic, fontSize: 32, color: colors.ink },
  legend: { flexDirection: 'row', gap: space.lg, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendMark: { width: 14, height: 14, borderWidth: 1.2 },
  legendText: { ...type.caption, color: colors.inkMuted },
  note: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  delete: { alignSelf: 'center', padding: space.sm },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ownerName: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  ownerSub: { ...type.caption, color: colors.inkMuted },
  convo: { gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  comment: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: space.md },
  commentWho: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink },
  commentText: { ...type.body, fontSize: 14, color: colors.ink },
  composer: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: { flex: 1, height: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, backgroundColor: colors.cream, paddingHorizontal: space.lg, fontFamily: fonts.body, fontSize: 14, color: colors.ink, outlineStyle: 'none' } as never,
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  deleteText: { ...type.caption, color: colors.inkMuted, textDecorationLine: 'underline' },
});

/** "Counts toward Thursday Night League · Week 3" link on an event-linked scorecard. */
function EventChip({ eventRoundId }: { eventRoundId: string }) {
  const data = useAppData();
  const er = data.eventRounds.find((r) => r.id === eventRoundId);
  const event = er ? data.events.find((e) => e.id === er.eventId) : undefined;
  if (!er || !event) return null;
  return (
    <Tap onPress={() => router.push(`/event/${event.id}/round/${er.id}`)} scaleTo={0.98} accessibilityRole="button" style={eventChip.chip}>
      <Icon name="calendar" size={14} color={colors.fairway} />
      <Text style={eventChip.text} numberOfLines={1}>{event.name} · {er.name}</Text>
      <Icon name="chevron-right" size={14} color={colors.inkMuted} />
    </Tap>
  );
}

const eventChip = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 32, borderRadius: radius.pill, backgroundColor: colors.paper },
  text: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.fairway, flexShrink: 1 },
});
