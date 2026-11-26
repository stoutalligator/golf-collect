import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/art/components';
import { Icon } from '@/components/icons';
import { Animated, popIn, Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Card, Empty, IconButton, ProgressBar } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

const CATEGORY = { game: 'Scoring', courses: 'Travel', collection: 'Collecting', sim: 'Simulator' } as const;

export default function AchievementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const a = data.achievements.find((x) => x.def.id === id);
  if (!a) return <Empty title="Badge not found" body="" />;
  const round = a.earnedRoundId ? data.roundById(a.earnedRoundId) : undefined;
  const friends = data.friends.map((f) => ({ f, s: data.playerData(f.id)?.achievements.find((x) => x.def.id === id) }));

  return (
    <View style={styles.root}>
      <View style={[styles.stage, { paddingTop: insets.top + space.sm }]}>
        <View style={[styles.topRow, { top: insets.top + space.sm }]}>
          <IconButton name="chevron-left" label="Back" onPress={() => router.back()} />
        </View>
        <View style={styles.glow} />
        <Animated.View entering={popIn(0, { from: 0.9, duration: 420 })}>
          <Badge id={a.def.id} name={a.def.name} sim={a.def.track === 'sim'} earned={a.earned} size={200} />
        </Animated.View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        <Text style={styles.title}>{a.def.name}</Text>
        <Text style={styles.subtitle}>{CATEGORY[a.def.category]} badge{a.def.track === 'sim' ? ' · sim track' : ''}</Text>
        <Text style={styles.body}>{a.def.description}</Text>

        {a.earned ? (
          <Card style={styles.earned} onPress={round ? () => router.push(`/round/${round.id}`) : undefined}>
            <Icon name="check" size={18} color={colors.fairway} strokeWidth={2.2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.earnedText}>Earned {a.earnedOn ? formatDate(a.earnedOn) : ''}</Text>
              {round ? <Text style={styles.earnedSub}>{data.roundCourseName(round)}</Text> : null}
            </View>
            {round ? <Icon name="chevron-right" size={16} color={colors.inkMuted} /> : null}
          </Card>
        ) : (
          <Card style={styles.progress}>
            <View style={styles.progressHead}>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressValue}>{a.current} / {a.target}</Text>
            </View>
            <ProgressBar value={a.current} max={a.target} />
          </Card>
        )}

        <Text style={styles.section}>Friends</Text>
        <Card style={{ paddingHorizontal: space.lg }}>
          {friends.map(({ f, s }, i) => (
            <Tap key={f.id} onPress={() => router.push(`/player/${f.id}`)} scaleTo={0.985} accessibilityRole="button" style={[styles.friendRow, i > 0 && styles.friendRule]}>
              <Avatar player={f} size={32} />
              <Text style={styles.friendName}>{f.name}</Text>
              {s?.earned ? (
                <Text style={styles.friendHave}>Earned {s.earnedOn ? formatDate(s.earnedOn) : ''}</Text>
              ) : (
                <Text style={styles.friendProgress}>{s ? `${s.current}/${s.target}` : '—'}</Text>
              )}
            </Tap>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  stage: { height: 320, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  topRow: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', zIndex: 2 },
  glow: { position: 'absolute', width: 236, height: 236, borderRadius: 118, backgroundColor: colors.paper, bottom: 30 },
  sheet: { flex: 1, backgroundColor: colors.cream },
  sheetContent: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  title: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.fairway, textAlign: 'center' },
  subtitle: { ...type.caption, fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginTop: -space.sm },
  body: { ...type.body, color: colors.ink, textAlign: 'center' },
  earned: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md },
  earnedText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  earnedSub: { ...type.caption, color: colors.inkMuted },
  progress: { padding: space.lg, gap: space.sm },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...type.label, fontSize: 10, color: colors.gold },
  progressValue: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
  section: { ...type.displayS, color: colors.ink, marginTop: space.sm },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, borderRadius: radius.sm },
  friendRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  friendName: { flex: 1, ...type.body, color: colors.ink },
  friendHave: { ...type.caption, color: colors.fairway, fontFamily: fonts.bodySemibold },
  friendProgress: { ...type.caption, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
});
