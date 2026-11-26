import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { courseHeroKeys, firstArt } from '@/art';
import { Collectible, CourseScene } from '@/art/components';
import { Icon } from '@/components/icons';
import { Animated, enterItem, popIn, Tap } from '@/components/motion';
import { RoundRow } from '@/components/round-card';
import { Avatar } from '@/components/social';
import { Button, Empty, Group, IconButton, Loading, SectionHeader, StatStrip } from '@/components/ui';
import { TIERS } from '@/data/config/game';
import { formatToPar } from '@/domain/stats';
import { roundOwner } from '@/domain/types';
import { ACCESS_LABEL } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData, useCourse } from '@/state/app-data';
import { colors, fonts, shadow, space, type } from '@/theme';

/** Painting fades into the cream page so the title sits on a clean surface. */
function HeroFade() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1">
        <Defs>
          <LinearGradient id="courseFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.62" stopColor={colors.cream} stopOpacity="0" />
            <Stop offset="1" stopColor={colors.cream} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#courseFade)" />
      </Svg>
    </View>
  );
}

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const { course, loading } = useCourse(id);
  if (loading) return <Loading label="Loading course…" />;
  if (!course) return <Empty title="Course not found" body="It may have been removed." />;

  const col = data.collections.get(course.id);
  const saved = data.wishlist.includes(course.id);
  const rounds = data.roundsByDate.filter((r) => r.kind === 'course' && r.courseId === course.id);
  const best = rounds.map((r) => data.summaries.get(r.id)).filter((s) => s?.isFull18).sort((a, b) => a!.strokes - b!.strokes)[0];
  const par = course.holes.reduce((s, h) => s + h.par, 0);
  const tierName = col?.tier ? TIERS.find((t) => t.tier === col.tier!.tier)?.name : null;
  // Shared regional painting (not a depiction of this course) unless a course-specific override exists.
  const regional = !firstArt(courseHeroKeys(course))?.key.startsWith('courses/');
  // Best 18 here for you and each friend who has played it.
  const board = [data.me, ...data.friends]
    .map((p) => {
      const pd = data.playerData(p.id);
      const scores = (pd?.rounds ?? [])
        .filter((r) => r.kind === 'course' && r.courseId === course.id && roundOwner(r) === p.id)
        .map((r) => data.summaries.get(r.id))
        .filter((s) => s?.isFull18);
      const top = scores.sort((a, b) => a!.strokes - b!.strokes)[0];
      return top ? { p, best: top, rounds: scores.length } : null;
    })
    .filter((x) => !!x)
    .sort((a, b) => a!.best!.strokes - b!.best!.strokes);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 3 }}>
        <View style={styles.hero}>
          <CourseScene course={course} style={StyleSheet.absoluteFill} />
          <HeroFade />
          <View style={[styles.heroButtons, { top: insets.top + space.xs }]}>
            <IconButton name="chevron-left" label="Back" onArt onPress={() => router.back()} />
            <SaveButton saved={saved} onPress={() => data.toggleWishlist(course.id)} />
          </View>
          {regional ? <Text style={styles.artNote}>Regional illustration</Text> : null}
        </View>

        <View style={styles.body}>
          <View style={{ gap: space.sm }}>
            <Text style={styles.title}>{course.name}</Text>
            <View style={styles.inline}>
              <Icon name="pin" size={15} color={colors.inkMuted} />
              <Text style={styles.meta}>{course.city}, {course.state}  ·  {ACCESS_LABEL[course.access]}{course.architect ? `  ·  ${course.architect}` : ''}</Text>
            </View>
            <Text style={styles.description}>{course.description}</Text>
          </View>

          <StatStrip
            compact
            items={[
              { label: 'Par', value: String(par) },
              { label: 'Tees', value: String(course.tees.length) },
              { label: 'Played', value: String(rounds.length) },
              { label: 'Best', value: best ? String(best.strokes) : '—', sub: best ? formatToPar(best.toPar) : undefined },
            ]}
          />

          <View style={styles.actions}>
            <Button label="Log a Round" icon="flag" onPress={() => router.push(`/round/new?courseId=${course.id}`)} style={{ flex: 1.2 }} />
            <Button label="Schedule" icon="calendar" variant="secondary" onPress={() => router.push(`/schedule?courseId=${course.id}`)} style={{ flex: 1 }} />
          </View>
          <Button label="View your scorecards here" variant="secondary" onPress={() => router.navigate(`/stats?view=rounds&courseId=${course.id}`)} />

          <View style={{ gap: space.md }}>
            <SectionHeader title="Collectibles" count={`${col?.earnedCount ?? 0}/${col?.items.length ?? 0}`} action={tierName ? `${tierName} marker` : undefined} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectRow} style={styles.collectScroll}>
              {(col?.items ?? []).map(({ def, earned }) => (
                <Tap key={def.id} scaleTo={0.94} onPress={() => router.push(`/collectible/${course.id}/${def.id}`)} style={styles.collectible} accessibilityRole="button" accessibilityLabel={`${def.name}${earned ? ', earned' : ', not yet earned'}`}>
                  <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={def.kind} id={def.id} tier={col?.tier?.tier} label={shortCourseName(course.name)} size={80} dim={!earned} />
                  <Text style={styles.collectibleLabel} numberOfLines={1}>{def.name}</Text>
                  <Text style={styles.collectibleState}>{earned ? 'Collected' : def.howToEarn}</Text>
                </Tap>
              ))}
            </ScrollView>
          </View>

          {board.length ? (
            <View style={{ gap: space.md }}>
              <SectionHeader title="Leaderboard" action="Best 18 · you & friends" />
              <Group>
                {board.map((row, i) => (
                  <Tap key={row!.p.id} scaleTo={0.985} onPress={() => (row!.p.id === data.me.id ? router.push(`/round/${row!.best!.roundId}`) : router.push(`/player/${row!.p.id}`))} accessibilityRole="button" accessibilityLabel={`${i + 1}. ${row!.p.name}, ${row!.best!.strokes}`} style={styles.boardRow}>
                    <Text style={styles.boardPos}>{i + 1}</Text>
                    <Avatar player={row!.p} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.boardName}>{row!.p.id === data.me.id ? 'You' : row!.p.name}</Text>
                      <Text style={styles.boardMeta}>{row!.rounds} {row!.rounds === 1 ? 'round' : 'rounds'} here</Text>
                    </View>
                    <Text style={styles.boardScore}>{row!.best!.strokes}</Text>
                    <Text style={styles.boardToPar}>{formatToPar(row!.best!.toPar)}</Text>
                  </Tap>
                ))}
              </Group>
            </View>
          ) : null}

          {rounds.length > 0 ? (
            <View style={{ gap: space.md }}>
              <SectionHeader title="Your Rounds Here" action={rounds.length > 3 ? 'See All' : undefined} onAction={rounds.length > 3 ? () => router.navigate(`/stats?view=rounds&courseId=${course.id}`) : undefined} />
              <Animated.View entering={enterItem(0)}>
                <Group inset={space.md}>
                  {rounds.slice(0, 3).map((r) => <RoundRow key={r.id} round={r} summary={data.summaries.get(r.id)} name={course.name} />)}
                </Group>
              </Animated.View>
            </View>
          ) : null}

          <Text style={styles.source}>
            Course data: {course.verification.sources.map((s) => s.name).join(' · ')} · {course.verification.status}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SaveButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return (
    <Tap onPress={onPress} scaleTo={0.9} haptic="press" accessibilityRole="button" accessibilityLabel={saved ? 'Remove from wishlist' : 'Add to wishlist'} accessibilityState={{ selected: saved }} style={styles.saveButton}>
      {/* Remount on toggle so the icon eases in */}
      <Animated.View key={String(saved)} entering={popIn(0, { from: 0.7, duration: 220 })}>
        <Icon name={saved ? 'bookmark-filled' : 'bookmark'} size={20} color={colors.fairway} strokeWidth={1.8} />
      </Animated.View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: { height: 300, backgroundColor: colors.paper },
  heroButtons: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(252,248,241,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow.control },
  artNote: { position: 'absolute', right: space.lg, bottom: space.lg, fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted },
  body: { paddingHorizontal: space.lg, gap: space.xl, marginTop: -space.lg },
  title: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 38, color: colors.fairway },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted, flexShrink: 1 },
  description: { ...type.body, fontSize: 16, lineHeight: 24, color: colors.ink, marginTop: space.xs },
  actions: { flexDirection: 'row', gap: space.md },
  collectScroll: { marginHorizontal: -space.lg },
  collectRow: { gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.xs },
  collectible: { alignItems: 'center', gap: 2, width: 92 },
  collectibleLabel: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, textAlign: 'center', marginTop: 4 },
  collectibleState: { ...type.caption, fontSize: 11, color: colors.inkMuted, textAlign: 'center' },
  source: { ...type.caption, fontSize: 11, color: colors.inkMuted, textAlign: 'center' },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, paddingHorizontal: space.lg },
  boardPos: { width: 16, fontFamily: fonts.displayBold, fontSize: 15, color: colors.gold, textAlign: 'center' },
  boardName: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  boardMeta: { ...type.caption, color: colors.inkMuted },
  boardScore: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  boardToPar: { ...type.caption, color: colors.inkMuted, width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
