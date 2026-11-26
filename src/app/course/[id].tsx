import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collectible, CourseScene, Tree } from '@/art/components';
import { Icon } from '@/components/icons';
import { RoundRow } from '@/components/round-card';
import { Empty, ListRow, SectionHeader } from '@/components/ui';
import { TIERS } from '@/data/config/game';
import { formatToPar } from '@/domain/stats';
import { ACCESS_LABEL } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

export default function CourseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const course = data.courseById(id);
  if (!course) return <Empty title="Course not found" body="It may have been removed from the sample data." />;

  const col = data.collections.get(course.id);
  const saved = data.wishlist.includes(course.id);
  const rounds = data.roundsByDate.filter((r) => r.kind === 'course' && r.courseId === course.id);
  const best = rounds.map((r) => data.summaries.get(r.id)).filter((s) => s?.isFull18).sort((a, b) => a!.strokes - b!.strokes)[0];
  const par = course.holes.reduce((s, h) => s + h.par, 0);
  const tierName = col?.tier ? TIERS.find((t) => t.tier === col.tier!.tier)?.name : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 2 }}>
        <View style={styles.hero}>
          <CourseScene course={course} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroButtons, { top: insets.top + space.sm }]}>
            <RoundButton icon="chevron-left" label="Back" onPress={() => router.back()} />
            <RoundButton icon={saved ? 'bookmark-filled' : 'bookmark'} label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onPress={() => data.toggleWishlist(course.id)} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>{course.name}</Text>
              <View style={styles.inline}>
                <Icon name="pin" size={15} color={colors.inkMuted} />
                <Text style={styles.meta}>{course.city}, {course.state} · {ACCESS_LABEL[course.access]}</Text>
              </View>
            </View>
            <Tree size={64} />
          </View>
          <Text style={styles.description}>{course.description}</Text>

          <View style={styles.facts}>
            <Fact label="Par" value={String(par)} />
            <Fact label="Tees" value={String(course.tees.length)} />
            <Fact label="Played" value={String(rounds.length)} />
            <Fact label="Best" value={best ? `${best.strokes}` : '—'} sub={best ? formatToPar(best.toPar) : undefined} />
          </View>

          <View>
            <ListRow icon="flag" label="Log a Round" onPress={() => router.push(`/round/new?courseId=${course.id}`)} />
            <ListRow icon="book" label="View Scorecards" onPress={() => router.navigate(`/rounds?courseId=${course.id}`)} />
          </View>

          <SectionHeader title="Course Collectibles" action={tierName ? `Ball marker: ${tierName}` : undefined} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingVertical: space.xs }}>
            {(col?.items ?? []).map(({ def, earned }) => (
              <Pressable key={def.id} onPress={() => router.push(`/collectible/${course.id}/${def.id}`)} style={styles.collectible} accessibilityRole="button" accessibilityLabel={`${def.name}${earned ? ', earned' : ', locked'}`}>
                <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={def.kind} id={def.id} tier={col?.tier?.tier} label={shortCourseName(course.name)} size={78} dim={!earned} />
                <Text style={styles.collectibleLabel} numberOfLines={2}>{def.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.collectNote}>{col?.earnedCount ?? 0} of {col?.items.length ?? 0} collected</Text>

          {rounds.length > 0 ? (
            <>
              <SectionHeader title="Your Rounds Here" />
              {rounds.slice(0, 3).map((r) => <RoundRow key={r.id} round={r} summary={data.summaries.get(r.id)} name={course.name} />)}
            </>
          ) : null}

          <Text style={styles.source}>
            Data: {course.verification.sources.map((s) => s.name).join(' · ')} · {course.verification.status}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function RoundButton({ icon, label, onPress }: { icon: 'chevron-left' | 'bookmark' | 'bookmark-filled'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.roundButton}>
      <Icon name={icon} size={20} color={colors.cream} />
    </Pressable>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}{sub ? <Text style={styles.factSub}> {sub}</Text> : null}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: { height: 280, backgroundColor: colors.fairway },
  heroButtons: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(31,61,47,0.7)', alignItems: 'center', justifyContent: 'center' },
  sheet: { marginTop: -24, backgroundColor: colors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, gap: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { ...type.displayL, color: colors.ink },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  description: { ...type.body, color: colors.ink },
  facts: { flexDirection: 'row', backgroundColor: colors.creamLight, borderRadius: radius.md, paddingVertical: space.md, ...shadow.card },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factValue: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.ink },
  factSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
  factLabel: { ...type.caption, color: colors.inkMuted },
  collectible: { alignItems: 'center', gap: 4, width: 86 },
  collectibleLabel: { ...type.caption, color: colors.ink, textAlign: 'center' },
  collectNote: { ...type.caption, color: colors.inkMuted, marginTop: -space.sm },
  source: { ...type.caption, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
});
