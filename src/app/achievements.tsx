import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/art/components';
import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { ProgressBar, SheetScreen } from '@/components/ui';
import type { AchievementCategory, AchievementState } from '@/domain/achievements';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

const SECTIONS: { id: AchievementCategory; title: string; blurb: string }[] = [
  { id: 'game', title: 'Scoring', blurb: 'Milestones for how you play.' },
  { id: 'courses', title: 'Travel', blurb: 'Where your game has taken you.' },
  { id: 'collection', title: 'Collecting', blurb: 'Rewards for filling the Trophy Room.' },
  { id: 'sim', title: 'Simulator', blurb: 'A separate track for sim rounds.' },
];

/** Badge wall: "Next up" (closest to done), then a grid per category. */
export default function Achievements() {
  const data = useAppData();
  const all = data.achievements;
  const earned = all.filter((a) => a.earned).length;
  const next = all
    .filter((a) => !a.earned && a.current > 0)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 3);

  return (
    <SheetScreen title="Badges" back>
      <View style={styles.summary}>
        <Text style={styles.summaryValue}>{earned}<Text style={styles.summaryOf}> of {all.length} earned</Text></Text>
        <ProgressBar value={earned} max={all.length} />
      </View>

      {next.length ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.sectionTitle}>Next up</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
            {next.map((a, i) => (
              <Animated.View key={a.def.id} entering={enterItem(i)}>
                <Tap onPress={() => router.push(`/achievement/${a.def.id}`)} scaleTo={0.96} accessibilityRole="button" style={styles.nextCard}>
                  <Badge id={a.def.id} name={a.def.name} sim={a.def.track === 'sim'} earned={false} size={60} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.nextName} numberOfLines={1}>{a.def.name}</Text>
                    <Text style={styles.nextDesc} numberOfLines={2}>{a.def.description}</Text>
                    <ProgressBar value={a.current} max={a.target} />
                    <Text style={styles.nextCount}>{a.current} / {a.target}</Text>
                  </View>
                </Tap>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {SECTIONS.map((s) => {
        const list = all.filter((a) => a.def.category === s.id).sort((a, b) => Number(b.earned) - Number(a.earned));
        if (!list.length) return null;
        return (
          <View key={s.id} style={{ gap: space.sm }}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionCount}>{list.filter((a) => a.earned).length}/{list.length}</Text>
            </View>
            <Text style={styles.blurb}>{s.blurb}</Text>
            <View style={styles.grid}>
              {list.map((a) => <BadgeCell key={a.def.id} a={a} />)}
            </View>
          </View>
        );
      })}
    </SheetScreen>
  );
}

function BadgeCell({ a }: { a: AchievementState }) {
  return (
    <Tap onPress={() => router.push(`/achievement/${a.def.id}`)} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={`${a.def.name}${a.earned ? '' : `, ${a.current} of ${a.target}`}`} style={styles.cell}>
      <View>
        <Badge id={a.def.id} name={a.def.name} sim={a.def.track === 'sim'} earned={a.earned} size={80} />
        {a.earned ? <View style={styles.check}><Icon name="check" size={11} color={colors.cream} strokeWidth={2.6} /></View> : null}
      </View>
      <Text style={[styles.cellName, !a.earned && { color: colors.inkMuted }]} numberOfLines={2}>{a.def.name}</Text>
      {!a.earned ? (
        <View style={styles.cellProgress}>
          <ProgressBar value={a.current} max={a.target} />
        </View>
      ) : null}
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  summary: { gap: space.sm },
  summaryValue: { fontFamily: fonts.bodySemibold, fontSize: 28, color: colors.ink },
  summaryOf: { fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.fairway },
  sectionCount: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  blurb: { ...type.caption, color: colors.inkMuted, marginTop: -6 },
  nextCard: { width: 268, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.md, marginVertical: space.sm, ...shadow.card },
  nextName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  nextDesc: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  nextCount: { ...type.caption, fontSize: 11, color: colors.ink, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: 104, alignItems: 'center', gap: 4, paddingVertical: space.sm },
  cellName: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, textAlign: 'center' },
  cellProgress: { width: 64 },
  check: { position: 'absolute', right: 4, bottom: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.cream },
}));
