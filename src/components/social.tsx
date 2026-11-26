/**
 * Friends & feed building blocks: avatars, the hole-by-hole "round strip", reactions and the feed card.
 */
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Collectible } from '@/art/components';
import { hashString } from '@/art/placeholders';
import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { formatToPar, type HoleResult, type RoundSummary } from '@/domain/stats';
import { REACTIONS, type Player, type Reaction, type ReactionEmoji } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData, type FeedPost } from '@/state/app-data';
import { avatarTones, chart, colors, fonts, radius, shadow, space, type } from '@/theme';

// ── Avatars ────────────────────────────────────────────────────────────────

export function Avatar({ player, size = 40, ring = false }: { player: Pick<Player, 'id' | 'initials'>; size?: number; ring?: boolean }) {
  const bg = player.id === 'me' ? colors.fairway : avatarTones[hashString(player.id) % avatarTones.length];
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ring && { borderWidth: 2, borderColor: colors.gold },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{player.initials}</Text>
    </View>
  );
}

/** Overlapping avatars (played with …). */
export function AvatarStack({ players, size = 22 }: { players: Player[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {players.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i ? -size * 0.3 : 0, borderRadius: size, borderWidth: 1.5, borderColor: colors.creamLight }}>
          <Avatar player={p} size={size} />
        </View>
      ))}
    </View>
  );
}

// ── Round strip ────────────────────────────────────────────────────────────

const toParColor = (t: number) => (t <= -2 ? chart.eagle : t === -1 ? chart.birdie : t === 0 ? chart.par : t === 1 ? chart.bogey : chart.double);

/** One block per hole, colored on the diverging to-par scale (gold under, gray par, slate over). */
export function RoundStrip({ results, height = 10 }: { results: HoleResult[]; height?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`Hole by hole: ${results.map((r) => formatToPar(r.toPar)).join(', ')}`}>
      {results.map((r) => (
        <View key={r.hole.number} style={{ flex: 1, height, borderRadius: 2, backgroundColor: toParColor(r.toPar) }} />
      ))}
    </View>
  );
}

export function RoundStripLegend() {
  const items = [
    { c: chart.eagle, l: 'Eagle' }, { c: chart.birdie, l: 'Birdie' }, { c: chart.par, l: 'Par' }, { c: chart.bogey, l: 'Bogey' }, { c: chart.double, l: 'Double+' },
  ];
  return (
    <View style={styles.stripLegend}>
      {items.map((i) => (
        <View key={i.l} style={styles.stripLegendItem}>
          <View style={[styles.stripSwatch, { backgroundColor: i.c }]} />
          <Text style={styles.stripLegendText}>{i.l}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Reactions ──────────────────────────────────────────────────────────────

/** Emoji counts + your own reaction toggle. */
export function ReactionBar({ roundId, reactions, comments, onComment }: { roundId: string; reactions: Reaction[]; comments: number; onComment?: () => void }) {
  const data = useAppData();
  const mine = reactions.find((r) => r.playerId === data.me.id)?.emoji;
  const counts = new Map<ReactionEmoji, number>();
  reactions.forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));
  return (
    <View style={styles.reactRow}>
      {REACTIONS.map((e) => {
        const n = counts.get(e) ?? 0;
        const on = mine === e;
        return (
          <Tap
            key={e}
            haptic="select"
            scaleTo={0.9}
            onPress={() => data.react(roundId, e)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`React ${e}${n ? `, ${n}` : ''}`}
            style={[styles.reactChip, on && styles.reactChipOn]}>
            <Text style={styles.reactEmoji}>{e}</Text>
            {n ? <Text style={[styles.reactCount, on && styles.reactCountOn]}>{n}</Text> : null}
          </Tap>
        );
      })}
      <View style={{ flex: 1 }} />
      {onComment ? (
        <Tap haptic="tap" scaleTo={0.92} onPress={onComment} accessibilityRole="button" accessibilityLabel={`${comments} comments`} style={styles.commentBtn}>
          <Icon name="message" size={17} color={colors.inkMuted} />
          <Text style={styles.reactCount}>{comments || ''}</Text>
        </Tap>
      ) : null}
    </View>
  );
}

// ── Feed card ──────────────────────────────────────────────────────────────

/** Score in a soft paper box: strokes in serif numerals over to-par (mockup "78 (+7)"). */
export function ScoreBox({ strokes, toPar, note, size = 'md' }: { strokes: number; toPar: number; note?: string; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <View style={[styles.scoreBox, lg && styles.scoreBoxLg]} accessible accessibilityLabel={`${strokes}, ${formatToPar(toPar)} to par`}>
      <Text style={[styles.scoreBoxValue, lg && styles.scoreBoxValueLg]}>{strokes}</Text>
      <Text style={styles.scoreBoxToPar}>({formatToPar(toPar)}){note ? ` ${note}` : ''}</Text>
    </View>
  );
}

/** Inline stats separated by hairlines (no boxes). */
function InlineStats({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.inlineStats}>
      {items.map((q, i) => (
        <View key={q.label} style={[styles.inlineStat, i > 0 && styles.inlineStatRule]}>
          <Text style={styles.inlineValue}>{q.value}</Text>
          <Text style={styles.inlineLabel}>{q.label}</Text>
        </View>
      ))}
    </View>
  );
}

const pctOf = (hit: number, entered: number) => (entered ? `${Math.round((hit / entered) * 100)}%` : null);

function quickStats(s: RoundSummary) {
  const out: { label: string; value: string }[] = [];
  if (s.putts.entered === s.holesPlayed && s.putts.entered) out.push({ label: 'Putts', value: String(s.putts.total) });
  const fir = pctOf(s.fairways.hit, s.fairways.entered);
  if (fir) out.push({ label: 'FIR', value: fir });
  const gir = pctOf(s.gir.hit, s.gir.entered);
  if (gir) out.push({ label: 'GIR', value: gir });
  const birdies = s.birdies + s.eagles;
  if (birdies) out.push({ label: birdies === 1 ? 'Birdie' : 'Birdies', value: String(birdies) });
  return out.slice(0, 4);
}

export function FeedCard({ post }: { post: FeedPost }) {
  const data = useAppData();
  const { round, owner, summary, earned } = post;
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const courseName = data.roundCourseName(round);
  const isMe = owner.id === data.me.id;
  const open = () => router.push(`/round/${round.id}`);
  const nine = summary.holesPlanned === 9;

  return (
    <View style={styles.card}>
      <Tap onPress={() => router.push(isMe ? '/profile' : `/player/${owner.id}`)} scaleTo={0.98} dim accessibilityRole="button" accessibilityLabel={`${owner.name} profile`} style={styles.head}>
        <Avatar player={owner} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.who} numberOfLines={1}>{isMe ? 'You' : owner.name}</Text>
          <Text style={styles.when} numberOfLines={1}>{formatDate(round.date)} · {course ? `${course.city}, ${course.state}` : 'Simulator'}</Text>
        </View>
        {round.kind === 'sim' ? <Text style={styles.simTag}>SIM</Text> : null}
      </Tap>
      <Tap onPress={open} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${owner.name} shot ${summary.strokes} at ${courseName}`} style={{ gap: space.md }}>

        <View style={styles.scoreRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.course} numberOfLines={2}>{courseName}</Text>
            {post.with.length ? (
              <View style={styles.withRow}>
                <AvatarStack players={post.with} size={20} />
                <Text style={styles.withText} numberOfLines={1}>with {post.with.map((p) => (p.id === data.me.id ? 'you' : p.name.split(' ')[0])).join(', ')}</Text>
              </View>
            ) : null}
          </View>
          <ScoreBox strokes={summary.strokes} toPar={summary.toPar} note={nine ? '· 9' : undefined} />
        </View>

        <RoundStrip results={summary.results} />

        {quickStats(summary).length ? <InlineStats items={quickStats(summary)} /> : null}

        {earned.total > 0 && course ? (
          <View style={styles.earned}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {earned.tier ? <Collectible courseId={course.id} region={course.region} kind="ball-marker" tier={earned.tier.tier} label={shortCourseName(course.name)} size={40} /> : null}
              {earned.items.slice(0, 3).map((i) => (
                <Collectible key={i.def.id} courseId={course.id} region={course.region} kind={i.def.kind} id={i.def.id} label={shortCourseName(course.name)} size={40} />
              ))}
              {earned.badges.slice(0, 2).map((b) => <Badge key={b.def.id} id={b.def.id} name={b.def.name} size={40} />)}
            </View>
            <Text style={styles.earnedText} numberOfLines={2}>
              <Text style={styles.earnedLead}>{isMe ? 'You earned ' : 'Earned '}</Text>
              {[
                earned.tier ? `${earned.tier.tier[0].toUpperCase()}${earned.tier.tier.slice(1)} marker` : null,
                ...earned.items.map((i) => i.def.name),
                ...earned.badges.map((b) => b.def.name),
              ].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}
      </Tap>

      <View style={styles.rule} />
      <ReactionBar roundId={round.id} reactions={post.reactions} comments={post.comments.length} onComment={open} />
      {post.comments.length ? (
        <Tap onPress={open} scaleTo={0.99} accessibilityRole="button" style={styles.commentPreview}>
          <Text style={styles.commentText} numberOfLines={2}>
            <Text style={styles.commentWho}>{data.playerById(post.comments[post.comments.length - 1].playerId)?.name.split(' ')[0] ?? ''} </Text>
            {post.comments[post.comments.length - 1].text}
          </Text>
          {post.comments.length > 1 ? <Text style={styles.moreComments}>View all {post.comments.length} comments</Text> : null}
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodySemibold, color: colors.cream, letterSpacing: 0.5 },
  stripLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  stripLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stripSwatch: { width: 10, height: 10, borderRadius: 2 },
  stripLegendText: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  reactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reactChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 30, borderRadius: radius.pill, backgroundColor: colors.paper },
  reactChipOn: { backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: colors.gold },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  reactCountOn: { color: colors.ink },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, height: 30 },
  card: { backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.card },
  scoreBox: { minWidth: 64, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, backgroundColor: colors.paper, alignItems: 'center' },
  scoreBoxLg: { minWidth: 76, paddingVertical: 8 },
  scoreBoxValue: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.ink },
  scoreBoxValueLg: { fontSize: 34, lineHeight: 40 },
  scoreBoxToPar: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  inlineStats: { flexDirection: 'row' },
  inlineStat: { flex: 1, alignItems: 'center', gap: 1 },
  inlineStatRule: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.rule },
  inlineValue: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink, fontVariant: ['tabular-nums'] },
  inlineLabel: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  earnedLead: { fontFamily: fonts.bodySemibold, color: colors.fairway },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  who: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  when: { ...type.caption, color: colors.inkMuted },
  simTag: { ...type.label, fontSize: 9, color: colors.slate, borderWidth: 1, borderColor: colors.slate, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  course: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25, color: colors.ink },
  withRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  withText: { ...type.caption, color: colors.inkMuted, flexShrink: 1 },
  earned: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  earnedText: { flex: 1, ...type.caption, fontSize: 13, color: colors.ink },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.rule },
  commentPreview: { gap: 2 },
  commentWho: { fontFamily: fonts.bodySemibold, color: colors.ink },
  commentText: { ...type.caption, fontSize: 13, color: colors.ink },
  moreComments: { ...type.caption, color: colors.inkMuted },
});
