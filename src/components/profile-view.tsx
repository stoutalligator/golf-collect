import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeHeroKeys } from '@/art';
import { Badge, Collectible, SceneImage } from '@/art/components';
import { Animated, enterItem, Tap } from '@/components/motion';
import type { IconName } from '@/components/icons';
import { RoundRow } from '@/components/round-card';
import { Avatar } from '@/components/social';
import { Group, IconButton, ListRow, SectionHeader, StatStrip, usePullToRefresh } from '@/components/ui';
import { tierRank } from '@/domain/collection';
import { formatMonthYear, oneDecimal } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData, type PlayerData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

/** Profile layout shared by your own profile and a friend's. */
export function ProfileView({ pd, headerRight, children }: { pd: PlayerData; headerRight?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const pull = usePullToRefresh();
  const p = pd.player;
  const isMe = p.id === data.me.id;
  const home = p.homeCourseId ? data.courseById(p.homeCourseId) ?? data.courseSummary(p.homeCourseId) : undefined;

  const markers = data.courses
    .map((c) => ({ c, col: pd.collections.get(c.id) }))
    .filter((x) => x.col?.played)
    .sort((a, b) => (b.col!.tier ? tierRank(b.col!.tier.tier) : -1) - (a.col!.tier ? tierRank(a.col!.tier.tier) : -1))
    .slice(0, 5);
  const badges = pd.achievements.filter((a) => a.earned).sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? '')).slice(0, 4);
  const recent = pd.rounds.filter((r) => r.status === 'complete').slice(0, 3);

  return (
    <View style={styles.root}>
      <ScrollView refreshControl={pull} contentContainerStyle={{ paddingTop: insets.top + space.xs, paddingBottom: space.xxl * 3 }}>
        <View style={styles.topRow}>
          <IconButton name="chevron-left" label="Back" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{isMe ? 'Profile' : 'Friend'}</Text>
          <View style={{ width: 40, alignItems: 'flex-end' }}>{headerRight}</View>
        </View>

        <View style={styles.body}>
          <View>
            <View style={styles.cover}>
              <SceneImage artKeys={homeHeroKeys()} seed={`profile-${p.id}`} style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.avatarWrap}>
              <Avatar player={p} size={88} />
            </View>
          </View>

          <View style={styles.identity}>
            <Text style={styles.name}>{p.name}</Text>
            {p.username ? <Text style={styles.since}>@{p.username}</Text> : null}
            {p.tagline ? <Text style={styles.tagline}>{p.tagline}</Text> : null}
            <Text style={styles.since}>
              {p.memberSince ? `Member since ${formatMonthYear(p.memberSince)}` : ''}
              {home ? `  ·  Home: ${shortCourseName(home.name)}` : ''}
            </Text>
          </View>

          <Animated.View entering={enterItem(0)}>
            <StatStrip
              compact
              items={[
                { label: 'Handicap', value: pd.handicap === null ? '—' : pd.handicap.toFixed(1) },
                { label: 'Avg score', value: oneDecimal(pd.courseStats.avgScore) },
                { label: 'Courses', value: String(pd.coursesPlayed) },
                { label: 'Collected', value: String(pd.collectiblesEarned) },
              ]}
            />
          </Animated.View>

          {children}

          <View style={{ gap: space.md }}>
            <SectionHeader title="Trophy Case" action={isMe ? 'Trophy Room' : undefined} onAction={isMe ? () => router.navigate('/collection') : undefined} />
            <View style={styles.case}>
              <View style={styles.caseRow}>
                {markers.length ? markers.map(({ c, col }) => (
                  <Tap key={c.id} onPress={() => router.push(`/course/${c.id}`)} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={`${c.name} ball marker`}>
                    <Collectible courseId={c.id} region={c.region} kind="ball-marker" tier={col!.tier?.tier} label={shortCourseName(c.name)} size={56} />
                  </Tap>
                )) : <Text style={styles.caseEmpty}>No courses played yet.</Text>}
              </View>
              {badges.length ? (
                <>
                  <View style={styles.caseLedge} />
                  <View style={styles.caseRow}>
                    {badges.map((b) => (
                      <Tap key={b.def.id} onPress={() => router.push(`/achievement/${b.def.id}`)} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={b.def.name} style={styles.badgeCell}>
                        <Badge id={b.def.id} name={b.def.name} sim={b.def.track === 'sim'} size={60} />
                        <Text style={styles.badgeName} numberOfLines={1}>{b.def.name}</Text>
                      </Tap>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          </View>

          <View style={{ gap: space.md }}>
            <SectionHeader title="Recent Rounds" action={isMe ? 'See All' : undefined} onAction={isMe ? () => router.navigate('/stats?view=rounds') : undefined} />
            {recent.length ? (
              <Group inset={space.md}>
                {recent.map((r) => <RoundRow key={r.id} round={r} summary={data.summaries.get(r.id)} name={data.roundCourseName(r)} />)}
              </Group>
            ) : <Text style={styles.caseEmpty}>No rounds yet.</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Row for profile links (friends, stats, badges); kept as a named export for existing callers. */
export function ProfileLink({ icon, label, sub, onPress, right }: { icon: IconName; label: string; sub?: string; onPress: () => void; right?: ReactNode }) {
  return <ListRow icon={icon} label={label} sub={sub} onPress={onPress} right={right} />;
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.md },
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  body: { paddingHorizontal: space.lg, gap: space.xl },
  cover: { height: 150, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.paper },
  avatarWrap: { alignSelf: 'center', marginTop: -48, padding: 4, borderRadius: 52, backgroundColor: colors.cream, ...shadow.control },
  identity: { alignItems: 'center', gap: 2, marginTop: -space.md },
  name: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.fairway, textAlign: 'center' },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 16, color: colors.ink, textAlign: 'center' },
  since: { ...type.caption, fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginTop: 4 },
  case: { backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.lg, gap: space.md, ...shadow.card },
  caseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'center' },
  caseLedge: { height: StyleSheet.hairlineWidth, backgroundColor: colors.rule },
  caseEmpty: { ...type.caption, fontSize: 13, color: colors.inkMuted, textAlign: 'center', paddingVertical: space.sm },
  badgeCell: { alignItems: 'center', width: 72, gap: 2 },
  badgeName: { ...type.caption, fontSize: 11, color: colors.ink, textAlign: 'center' },
}));
