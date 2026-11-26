import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ProfileView } from '@/components/profile-view';
import { Avatar } from '@/components/social';
import { Card, Empty } from '@/components/ui';
import { Tap } from '@/components/motion';
import { roundOwner } from '@/domain/types';
import { oneDecimal } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData, type PlayerData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

/** A friend's profile, with a head-to-head comparison against you. */
export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const pd = data.playerData(id);
  if (!pd) return <Empty title="Player not found" body="" />;
  return (
    <ProfileView pd={pd}>
      <HeadToHead them={pd} />
    </ProfileView>
  );
}

function HeadToHead({ them }: { them: PlayerData }) {
  const data = useAppData();
  const me = data.meData;
  const together = data.roundsByDate.filter((r) => r.status === 'complete' && r.playerIds.includes(them.player.id)).length;
  const best = (pd: PlayerData, courseId: string) => {
    const s = pd.rounds
      .filter((r) => r.kind === 'course' && r.courseId === courseId && roundOwner(r) === pd.player.id)
      .map((r) => data.summaries.get(r.id))
      .filter((x) => x?.isFull18)
      .map((x) => x!.strokes);
    return s.length ? Math.min(...s) : null;
  };
  const shared = data.courses
    .filter((c) => me.collections.get(c.id)?.played && them.collections.get(c.id)?.played)
    .map((c) => ({ c, mine: best(me, c.id), theirs: best(them, c.id) }))
    .filter((x) => x.mine !== null && x.theirs !== null);
  const first = them.player.name.split(' ')[0];

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.side}>
          <Avatar player={data.me} size={36} />
          <Text style={styles.sideName}>You</Text>
        </View>
        <Text style={styles.vs}>HEAD TO HEAD</Text>
        <View style={styles.side}>
          <Avatar player={them.player} size={36} />
          <Text style={styles.sideName}>{first}</Text>
        </View>
      </View>
      <Row label="Handicap" a={me.handicap?.toFixed(1) ?? '—'} b={them.handicap?.toFixed(1) ?? '—'} lowerWins aNum={me.handicap} bNum={them.handicap} />
      <Row label="Avg score" a={oneDecimal(me.courseStats.avgScore)} b={oneDecimal(them.courseStats.avgScore)} lowerWins aNum={me.courseStats.avgScore} bNum={them.courseStats.avgScore} />
      <Row label="Courses played" a={String(me.coursesPlayed)} b={String(them.coursesPlayed)} aNum={me.coursesPlayed} bNum={them.coursesPlayed} />
      <Row label="Collectibles" a={String(me.collectiblesEarned)} b={String(them.collectiblesEarned)} aNum={me.collectiblesEarned} bNum={them.collectiblesEarned} />
      <Text style={styles.together}>{together ? `You've played ${together} ${together === 1 ? 'round' : 'rounds'} together.` : `You haven't played together yet.`}</Text>

      {shared.length ? (
        <View style={styles.shared}>
          <Text style={styles.sharedTitle}>BEST SCORE ON SHARED COURSES</Text>
          {shared.map(({ c, mine, theirs }) => (
            <Tap key={c.id} onPress={() => router.push(`/course/${c.id}`)} scaleTo={0.985} accessibilityRole="button" style={styles.sharedRow}>
              <Text style={[styles.sharedScore, mine! < theirs! && styles.win]}>{mine}</Text>
              <Text style={styles.sharedCourse} numberOfLines={1}>{shortCourseName(c.name)}</Text>
              <Text style={[styles.sharedScore, theirs! < mine! && styles.win]}>{theirs}</Text>
            </Tap>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function Row({ label, a, b, aNum, bNum, lowerWins = false }: { label: string; a: string; b: string; aNum: number | null; bNum: number | null; lowerWins?: boolean }) {
  const aWin = aNum !== null && bNum !== null && aNum !== bNum && (lowerWins ? aNum < bNum : aNum > bNum);
  const bWin = aNum !== null && bNum !== null && aNum !== bNum && !aWin;
  return (
    <View style={styles.row}>
      <Text style={[styles.value, aWin && styles.win]}>{a}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { textAlign: 'right' }, bWin && styles.win]}>{b}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs },
  side: { alignItems: 'center', gap: 4, width: 64 },
  sideName: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink },
  vs: { ...type.label, fontSize: 10, color: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  value: { width: 64, fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  label: { flex: 1, textAlign: 'center', ...type.caption, color: colors.inkMuted },
  win: { color: colors.ink, fontFamily: fonts.bodyBold },
  together: { ...type.caption, color: colors.inkMuted, textAlign: 'center', marginTop: space.xs },
  shared: { gap: 4, marginTop: space.sm, backgroundColor: colors.cream, borderRadius: radius.md, padding: space.md },
  sharedTitle: { ...type.label, fontSize: 9, color: colors.inkMuted, textAlign: 'center', marginBottom: 4 },
  sharedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  sharedScore: { width: 34, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.inkMuted, textAlign: 'center', fontVariant: ['tabular-nums'] },
  sharedCourse: { flex: 1, fontFamily: fonts.display, fontSize: 14, color: colors.ink, textAlign: 'center' },
});
