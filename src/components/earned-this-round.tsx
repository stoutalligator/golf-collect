import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ZoomIn } from 'react-native-reanimated';

import { Badge, Collectible } from '@/art/components';
import { Animated, Tap } from '@/components/motion';
import { TIERS } from '@/data/config/game';
import type { Round } from '@/domain/types';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

/**
 * Everything a round earned: new collectibles, a ball-marker tier upgrade and achievements.
 * Derived from the data (earned roundId), so it works for any round, not just the one you just finished.
 * Items spring in one after another; `celebrate` makes the entrance a little bigger.
 */
export function EarnedThisRound({ round, celebrate = false }: { round: Round; celebrate?: boolean }) {
  const data = useAppData();
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const col = course ? data.collections.get(course.id) : undefined;
  const items = col?.items.filter((i) => i.roundId === round.id) ?? [];
  const tierUp = col?.tier?.roundId === round.id ? TIERS.find((t) => t.tier === col.tier!.tier) : undefined;
  const badges = data.achievements.filter((a) => a.earnedRoundId === round.id);
  const total = items.length + badges.length + (tierUp ? 1 : 0);
  if (total === 0) return null;

  const short = course ? shortCourseName(course.name) : '';
  let n = 0;
  const enter = () => ZoomIn.delay((celebrate ? 250 : 0) + n++ * 110).springify().damping(13).stiffness(celebrate ? 170 : 220);

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>EARNED THIS ROUND</Text>
      <View style={styles.grid}>
        {tierUp && course ? (
          <Animated.View entering={enter()} style={styles.cell}>
            <Tap scaleTo={0.92} onPress={() => router.push(`/collectible/${course.id}/ball-marker`)} style={styles.tap}>
              <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind="ball-marker" tier={tierUp.tier} label={short} size={76} />
              <Text style={styles.name}>{tierUp.name} tier</Text>
              <Text style={styles.sub}>Ball marker</Text>
            </Tap>
          </Animated.View>
        ) : null}
        {course && items.filter((i) => !(tierUp && i.def.kind === 'ball-marker')).map((i) => (
          <Animated.View key={i.def.id} entering={enter()} style={styles.cell}>
            <Tap scaleTo={0.92} onPress={() => router.push(`/collectible/${course.id}/${i.def.id}`)} style={styles.tap}>
              <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={i.def.kind} id={i.def.id} tier={col?.tier?.tier} label={short} size={76} />
              <Text style={styles.name} numberOfLines={1}>{i.def.name}</Text>
              <Text style={styles.sub}>New collectible</Text>
            </Tap>
          </Animated.View>
        ))}
        {badges.map((b) => (
          <Animated.View key={b.def.id} entering={enter()} style={styles.cell}>
            <Tap scaleTo={0.92} onPress={() => router.push('/achievements')} style={styles.tap}>
              <Badge id={b.def.id} name={b.def.name} sim={b.def.track === 'sim'} size={76} />
              <Text style={styles.name} numberOfLines={1}>{b.def.name}</Text>
              <Text style={styles.sub}>Achievement</Text>
            </Tap>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.goldSoft, ...shadow.card },
  kicker: { ...type.label, color: colors.gold, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.md },
  cell: { width: 96 },
  tap: { alignItems: 'center', gap: 2 },
  name: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, textAlign: 'center' },
  sub: { ...type.caption, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
});
