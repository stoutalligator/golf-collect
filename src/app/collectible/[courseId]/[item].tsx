import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collectible } from '@/art/components';
import { Icon } from '@/components/icons';
import { Card, Empty, IconButton, Loading, ProgressBar } from '@/components/ui';
import { collectiblesForCourse, TIERS } from '@/data/config/game';
import { tierRank } from '@/domain/collection';
import type { CollectibleItem } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData, useCourse } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';
import { Animated, popIn } from '@/components/motion';

const KIND_LABEL: Record<CollectibleItem, string> = {
  'ball-marker': 'Ball Marker', 'bag-tag': 'Bag Tag', 'pitch-marker': 'Pitch Marker', patch: 'Patch', pin: 'Pin',
};

export default function CollectibleDetail() {
  const { courseId, item } = useLocalSearchParams<{ courseId: string; item: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const { course, loading } = useCourse(courseId);
  const col = course ? data.collections.get(course.id) : undefined;
  const state = col?.items.find((i) => i.def.id === item);
  const def = state?.def ?? (course ? collectiblesForCourse(course.id).find((d) => d.id === item) : undefined);
  if (loading) return <Loading />;
  if (!course || !def) return <Empty title="Collectible not found" body="" />;

  const tier = col?.tier;
  const short = shortCourseName(course.name);
  const isMarker = def.kind === 'ball-marker';
  const nextTier = TIERS.find((t) => !tier || tierRank(t.tier) > tierRank(tier.tier));

  return (
    <View style={styles.root}>
      <View style={[styles.stage, { paddingTop: insets.top + space.sm }]}>
        <View style={[styles.topRow, { top: insets.top + space.sm }]}>
          <IconButton name="chevron-left" label="Back" onPress={() => router.back()} />
        </View>
        <View style={styles.glow} />
        <Animated.View style={styles.hero} entering={popIn(0, { from: 0.9, duration: 420 })}>
          <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={def.kind} id={def.id} tier={tier?.tier} label={short} size={230} dim={!state?.earned} />
        </Animated.View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <Text style={styles.title}>{def.name.startsWith(short) ? def.name : `${short} ${def.name}`}</Text>
        <Text style={styles.subtitle}>{isMarker ? 'Course Collectible' : 'Course Achievement'}  ·  {KIND_LABEL[def.kind]}</Text>
        <Text style={styles.body}>{def.howToEarn.replace(/ here$/, '')} at {course.name}.</Text>

        {state?.earned ? (
          <Card style={styles.earned} onPress={state.roundId ? () => router.push(`/round/${state.roundId}`) : undefined}>
            <Icon name="check" size={18} color={colors.fairway} strokeWidth={2.2} />
            <Text style={styles.earnedText}>Earned {state.earnedOn ? formatDate(state.earnedOn) : ''}</Text>
            {state.roundId ? <Icon name="chevron-right" size={16} color={colors.inkMuted} /> : null}
          </Card>
        ) : (
          <Card style={styles.locked}>
            <Text style={styles.lockedTitle}>Not yet earned</Text>
            {state?.progress ? (
              <View style={{ gap: 6 }}>
                <ProgressBar value={state.progress.current} max={state.progress.target} />
                <Text style={styles.progressText}>{state.progress.current} / {state.progress.target}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {isMarker ? (
        <>
        <Text style={styles.section}>Your Tier</Text>
        <Text style={styles.tierStatus}>
          {tier ? `${TIERS.find((t) => t.tier === tier.tier)?.name} since ${formatDate(tier.earnedOn)}` : col?.played ? 'No tier yet' : 'Play here to start'}
          {nextTier ? `  ·  Next: ${nextTier.name} (${nextTier.label.toLowerCase()})` : '  ·  Top tier reached'}
        </Text>
        <View style={styles.tiers}>
          {TIERS.map((t) => {
            const reached = !!tier && tierRank(tier.tier) >= tierRank(t.tier);
            const current = tier?.tier === t.tier;
            return (
              <View key={t.tier} style={[styles.tier, current && styles.tierCurrent]}>
                <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind="ball-marker" tier={t.tier} label={short} size={58} dim={!reached} />
                <Text style={styles.tierName}>{t.name}</Text>
                <Text style={styles.tierRule}>{t.label}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.tierNote}>The ball marker’s finish is set by your best 18 here.</Text>
        </>
        ) : (
          <Text style={styles.tierNote}>Course achievements have one finish; only the ball marker is tiered by your score.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  stage: { height: 340, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  topRow: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', zIndex: 2 },
  hero: { position: 'relative', zIndex: 1 },
  glow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: colors.paper, bottom: 36 },
  sheet: { flex: 1, backgroundColor: colors.cream },
  sheetContent: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  title: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.fairway, textAlign: 'center' },
  subtitle: { ...type.caption, fontSize: 13, color: colors.inkMuted, textAlign: 'center' },
  body: { ...type.body, color: colors.ink, textAlign: 'center' },
  earned: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md },
  earnedText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway, flex: 1 },
  locked: { padding: space.lg, gap: space.sm },
  lockedTitle: { ...type.label, color: colors.gold, textAlign: 'center' },
  progressText: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  section: { ...type.displayS, color: colors.ink, marginTop: space.sm },
  tierStatus: { ...type.caption, fontSize: 13, color: colors.inkMuted, marginTop: -space.sm },
  tiers: { flexDirection: 'row', gap: space.xs },
  tier: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
  tierCurrent: { backgroundColor: colors.goldSoft + '88', borderColor: colors.gold },
  tierName: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  tierRule: { ...type.caption, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
  tierNote: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
}));
