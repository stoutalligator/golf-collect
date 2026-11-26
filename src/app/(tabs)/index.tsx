import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { homeHeroKeys } from '@/art';
import { Emblem, SceneImage } from '@/art/components';
import { RoundCardLarge } from '@/components/round-card';
import { Empty, IconButton, SectionHeader, StatTile } from '@/components/ui';
import { greeting } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, space, type } from '@/theme';
import { Animated, enterItem } from '@/components/motion';

/** Soft fade from transparent to deep fairway along the bottom of the hero, so the greeting reads. */
function BottomFade() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1">
      <Defs>
        <LinearGradient id="homeFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.35" stopColor={colors.fairwayDeep} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.fairwayDeep} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="1" height="1" fill="url(#homeFade)" />
    </Svg>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const firstName = data.me.name.split(' ')[0];
  const coursesPlayed = [...data.collections.values()].filter((c) => c.played).length;
  const collectibles = [...data.collections.values()].reduce((n, c) => n + c.earnedCount, 0);
  const recent = data.roundsByDate.filter((r) => r.status === 'complete').slice(0, 3);

  return (
    <View style={styles.root}>
      {/* Solid header (board 03): covers the status bar area, painting starts cleanly below it. */}
      <View style={[styles.header, { paddingTop: insets.top + space.xs }]}>
        <Emblem size={34} />
        <Text style={styles.wordmark}>Greens Keeper</Text>
        <View style={{ flex: 1 }} />
        <IconButton name="user" label="Profile" onPress={() => router.push('/profile')} />
        <IconButton name="bell" label="Notifications" onPress={() => router.push('/achievements')} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={styles.hero}>
          <SceneImage artKeys={homeHeroKeys()} seed="home-hero" style={StyleSheet.absoluteFill} />
          <BottomFade />
          <Text style={styles.greeting}>{greeting()}, {firstName}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.tiles}>
            <StatTile value={data.courseStats.rounds} label="Rounds" />
            <StatTile value={coursesPlayed} label="Courses" />
            <StatTile value={collectibles} label="Collectibles" />
          </View>

          <SectionHeader title="Recent Rounds" action="See All" onAction={() => router.navigate('/rounds')} />
          {recent.length === 0 ? (
            <Empty title="No rounds yet" body="Tap + to log your first round." />
          ) : (
            recent.map((r, i) => (
              <Animated.View key={r.id} entering={enterItem(i + 1)}>
                <RoundCardLarge round={r} summary={data.summaries.get(r.id)} name={data.roundCourseName(r)} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    backgroundColor: colors.fairway,
    zIndex: 2,
  },
  wordmark: { fontFamily: fonts.display, fontSize: 22, color: colors.cream },
  hero: { height: 250, backgroundColor: colors.fairway, justifyContent: 'flex-end', overflow: 'hidden' },
  greeting: {
    ...type.displayL,
    color: colors.cream,
    paddingHorizontal: space.lg,
    paddingBottom: 48,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 6,
  },
  body: { paddingHorizontal: space.lg, gap: space.lg, marginTop: -32 },
  tiles: { flexDirection: 'row', gap: space.md },
});
