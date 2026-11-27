import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { homeHeroKeys } from '@/art';
import { Emblem, SceneImage } from '@/art/components';
import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Avatar, FeedCard } from '@/components/social';
import { roundOwner } from '@/domain/types';
import { Button, Chips, Empty, IconButton, SectionHeader, StatStrip, usePullToRefresh } from '@/components/ui';
import { recentRounds } from '@/domain/analytics';
import { formatDay, formatTeeTime, greeting, todayISO } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { useEventLists } from '@/state/events';
import { colors, currentScheme, fonts, radius, shadow, space, themed, type } from '@/theme';

/** Left-to-right fade so the greeting reads over the painting without darkening the whole scene. */
function GreetingFade() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1 1">
        <Defs>
          <LinearGradient id="homeFade" x1="0" y1="0" x2="1" y2="0.35">
            <Stop offset="0" stopColor={colors.fairwayDeep} stopOpacity="0.62" />
            <Stop offset="0.55" stopColor={colors.fairwayDeep} stopOpacity="0.12" />
            <Stop offset="1" stopColor={colors.fairwayDeep} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="1" height="1" fill="url(#homeFade)" />
      </Svg>
    </View>
  );
}

type FeedFilter = 'all' | 'friends' | 'me';
const PAGE = 10;

export default function Home() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const pull = usePullToRefresh();
  // Gold icons on the forest quick buttons; on the pale-green dark-mode buttons, match the text instead.
  const quickIcon = currentScheme() === 'dark' ? colors.cream : colors.gold;
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [limit, setLimit] = useState(PAGE);
  const firstName = data.me.name.split(' ')[0];

  const mine = recentRounds([...data.roundsByDate].map((r) => data.summaries.get(r.id)!).filter((s) => s?.kind === 'course' && s.isFull18));
  const last5 = mine.slice(-5).map((s) => s.strokes);
  const avg5 = last5.length ? last5.reduce((a, b) => a + b, 0) / last5.length : null;
  const active = data.roundsByDate.find((r) => r.status === 'active');
  // Scramble team cards you're on but someone else owns (any teammate can enter the team's scores).
  const teamCards = data.friendRounds.filter((r) =>
    r.status === 'active' && r.format === 'scramble' && r.date === todayISO() && r.playerIds.includes(data.me.id));
  // Friends out on the course right now who tagged you and you haven't joined: join to keep your own score live.
  const liveInvites = data.friendRounds.filter((r) =>
    r.status === 'active' && r.kind === 'course' && r.format !== 'scramble' && r.date === todayISO() && r.scoredBy !== data.me.id
    && r.playerIds.includes(data.me.id) && !data.roundGroup(r).some((x) => roundOwner(x) === data.me.id));
  const { invitations, upcoming } = useEventLists();
  const nextEvent = upcoming[0];

  const posts = data.feed.filter((p) => (filter === 'all' ? true : filter === 'me' ? p.owner.id === data.me.id : p.owner.id !== data.me.id));

  return (
    <View style={styles.root}>
      <ScrollView refreshControl={pull} contentContainerStyle={{ paddingTop: insets.top + space.xs, paddingBottom: space.xxl * 3 }}>
        <View style={styles.header}>
          <Emblem size={40} onDark={false} />
          <Text style={styles.wordmark}>Greens Keeper</Text>
          <View style={{ flex: 1 }} />
          <IconButton name="calendar" label="Leagues and events" onPress={() => router.push('/events')} />
          <IconButton name="users" label="Friends" onPress={() => router.push('/friends')} />
          <Tap onPress={() => router.push('/profile')} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Your profile">
            <Avatar player={data.me} size={40} />
          </Tap>
        </View>

        <View style={styles.body}>
          <View>
            <View style={styles.hero}>
              <SceneImage artKeys={homeHeroKeys()} seed="home-hero" style={StyleSheet.absoluteFill} />
              <GreetingFade />
              <Text style={styles.kicker}>{greeting().toUpperCase()},</Text>
              <Text style={styles.greeting}>{firstName}</Text>
              <View style={styles.swash} />
            </View>
            <StatStrip
              style={styles.kpis}
              items={[
                { icon: 'flag', label: 'Handicap', value: data.handicap === null ? '—' : data.handicap.toFixed(1), onPress: () => router.navigate('/stats') },
                { icon: 'chart', label: 'Last 5 Avg', value: avg5 === null ? '—' : avg5.toFixed(1), onPress: () => router.navigate('/stats') },
                { icon: 'layers', label: 'Collectibles', value: data.meData.collectiblesEarned, onPress: () => router.navigate('/collection') },
              ]}
            />
          </View>

          {active ? (
            <Tap onPress={() => router.push(`/round/play/${active.id}`)} haptic="press" scaleTo={0.98} accessibilityRole="button" style={styles.active}>
              <View style={styles.liveDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activeTitle}>Round in progress</Text>
                <Text style={styles.activeSub} numberOfLines={1}>{data.roundCourseName(active)}</Text>
              </View>
              <Text style={styles.activeCta}>Resume</Text>
              <Icon name="chevron-right" size={16} color={colors.cream} />
            </Tap>
          ) : null}

          {teamCards.slice(0, 2).map((r) => {
            const who = data.playerById(r.scoredBy ?? roundOwner(r));
            return (
              <Tap key={r.id} onPress={() => router.push(`/round/play/${r.id}`)} haptic="press" scaleTo={0.98} swish accessibilityRole="button" accessibilityLabel={`Scramble at ${data.roundCourseName(r)}. Open your team's card`} style={styles.liveInvite}>
                {who ? <Avatar player={who} size={38} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveTitle} numberOfLines={1}>{who ? `${who.name.split(' ')[0]} started a scramble` : 'Scramble in progress'}</Text>
                  <Text style={styles.liveSub} numberOfLines={1}>{data.roundCourseName(r)} · you’re on this team’s card</Text>
                </View>
                <View style={styles.liveJoin}><Text style={styles.liveJoinText}>Open</Text></View>
              </Tap>
            );
          })}
          {liveInvites.slice(0, 2).map((r) => {
            const who = data.playerById(roundOwner(r));
            return who ? (
              <Tap key={r.id} onPress={() => router.push(`/round/new?join=${r.id}`)} haptic="press" scaleTo={0.98} swish accessibilityRole="button" accessibilityLabel={`${who.name} teed off with you at ${data.roundCourseName(r)}. Join`} style={styles.liveInvite}>
                <Avatar player={who} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveTitle} numberOfLines={1}>{who.name.split(' ')[0]} teed off with you</Text>
                  <Text style={styles.liveSub} numberOfLines={1}>{data.roundCourseName(r)} · keep your score, see theirs live</Text>
                </View>
                <View style={styles.liveJoin}><Text style={styles.liveJoinText}>Join</Text></View>
              </Tap>
            ) : null;
          })}

          <View style={styles.quick}>
            <Tap onPress={() => router.push('/schedule')} scaleTo={0.97} swish accessibilityRole="button" style={styles.quickBtn}>
              <Icon name="calendar" size={16} color={quickIcon} />
              <Text style={styles.quickText}>Schedule a round</Text>
            </Tap>
            <Tap onPress={() => router.push('/events')} scaleTo={0.97} swish accessibilityRole="button" style={styles.quickBtn}>
              <Icon name="trophy" size={16} color={quickIcon} />
              <Text style={styles.quickText}>Leagues & events</Text>
            </Tap>
          </View>

          {nextEvent || invitations.length ? (
            <Tap onPress={() => router.push(nextEvent ? `/event/${nextEvent.event.id}/round/${nextEvent.round.id}` : '/events')} scaleTo={0.98} accessibilityRole="button" style={styles.upNext}>
              <View style={styles.upNextIcon}><Icon name="calendar" size={18} color={colors.fairway} /></View>
              <View style={{ flex: 1 }}>
                {nextEvent ? (
                  <>
                    <Text style={styles.upNextTitle} numberOfLines={1}>{nextEvent.round.scheduledOn === todayISO() ? 'Today' : formatDay(nextEvent.round.scheduledOn)}{nextEvent.round.teeTime ? ` · ${formatTeeTime(nextEvent.round.teeTime)}` : ''} · {nextEvent.event.name}</Text>
                    <Text style={styles.upNextSub} numberOfLines={1}>{nextEvent.round.name} at {nextEvent.courseName}</Text>
                  </>
                ) : null}
                {invitations.length ? <Text style={styles.upNextInvite}>{invitations.length} event {invitations.length === 1 ? 'invitation' : 'invitations'} waiting</Text> : null}
              </View>
              <Icon name="chevron-right" size={16} color={colors.inkMuted} />
            </Tap>
          ) : null}

          <View style={{ gap: space.lg }}>
            <SectionHeader title="Feed" action={`${data.friends.length} Friends`} onAction={() => router.push('/friends')} />
            <Chips
              value={filter}
              onChange={(v) => { setFilter(v); setLimit(PAGE); }}
              options={[{ value: 'all', label: 'Everyone' }, { value: 'friends', label: 'Friends' }, { value: 'me', label: 'You' }]}
            />
            {posts.length === 0 ? (
              <Empty title="Nothing here yet" body={filter === 'me' ? 'Tap + to log your first round.' : 'Rounds your friends log will show up here.'} />
            ) : (
              posts.slice(0, limit).map((p, i) => (
                <Animated.View key={p.round.id} entering={enterItem(i)}>
                  <FeedCard post={p} />
                </Animated.View>
              ))
            )}
            {posts.length > limit ? <Button variant="secondary" label="Show more" onPress={() => setLimit((l) => l + PAGE)} /> : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.md },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.fairway, marginLeft: 2 },
  body: { paddingHorizontal: space.lg, gap: space.xl },
  hero: { height: 230, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.fairway, justifyContent: 'center', paddingHorizontal: space.xl, paddingBottom: 40 },
  kicker: { fontFamily: fonts.bodySemibold, fontSize: 13, letterSpacing: 2, color: colors.onDark, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  greeting: { fontFamily: fonts.displayItalic, fontSize: 54, lineHeight: 64, color: colors.onDark, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 8 },
  swash: { width: 64, height: 3, borderRadius: 2, backgroundColor: colors.gold, marginTop: 2, transform: [{ rotate: '-4deg' }] },
  kpis: { marginTop: -44, marginHorizontal: space.sm },
  active: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.fairway, borderRadius: radius.xl, padding: space.lg, ...shadow.card },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  activeTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.cream },
  activeSub: { ...type.caption, color: colors.onFillMuted },
  liveInvite: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.tint, borderRadius: radius.xl, padding: space.md },
  liveTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  liveSub: { ...type.caption, color: colors.inkMuted },
  liveJoin: { paddingHorizontal: 16, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.fairway, justifyContent: 'center' },
  liveJoinText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.cream },
  quick: { flexDirection: 'row', gap: space.sm, marginTop: -space.sm },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.fairway, ...shadow.card },
  quickText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  upNext: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.md, ...shadow.card },
  upNextIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  upNextTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  upNextSub: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  upNextInvite: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.fairway, marginTop: 2 },
  activeCta: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.cream },
}));
