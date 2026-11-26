import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeHeroKeys } from '@/art';
import { Badge, Emblem, SceneImage } from '@/art/components';
import { Icon } from '@/components/icons';
import { Button, Card, IconButton, SectionHeader, StatTile } from '@/components/ui';
import { formatToPar } from '@/domain/stats';
import { formatDate, formatMonthYear, oneDecimal, pct } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const [devOpen, setDevOpen] = useState(false);
  const cols = [...data.collections.values()];
  const recent = data.achievements.filter((a) => a.earned).sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''))[0];
  const s = data.courseStats;
  const counties = new Set(data.courses.filter((c) => data.collections.get(c.id)?.played).map((c) => c.county));

  return (
    <View style={styles.root}>
      {/* Solid header like Home: covers the status bar; the painting starts cleanly below. */}
      <View style={[styles.topRow, { paddingTop: insets.top + space.xs }]}>
        <IconButton name="chevron-left" label="Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Profile</Text>
        <IconButton name="settings" label="Developer options" onPress={() => setDevOpen((o) => !o)} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl * 2 }}>
        <View style={styles.hero}>
          <SceneImage artKeys={homeHeroKeys()} seed="profile-hills" style={StyleSheet.absoluteFill} />
        </View>
        <View style={styles.avatar}>
          <Emblem size={86} onDark={false} />
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{data.me.name}</Text>
          {data.me.memberSince ? <Text style={styles.since}>Member Since {formatMonthYear(data.me.memberSince)}</Text> : null}

          <View style={styles.tiles}>
            <StatTile value={s.rounds} label="Rounds" />
            <StatTile value={cols.filter((c) => c.played).length} label="Courses" />
            <StatTile value={cols.reduce((n, c) => n + c.earnedCount, 0)} label="Collectibles" />
          </View>

          {recent ? (
            <>
              <SectionHeader title="Recent Achievement" action="All" onAction={() => router.push('/achievements')} />
              <Card style={styles.recent} onPress={() => router.push('/achievements')}>
                <Badge id={recent.def.id} name={recent.def.name} sim={recent.def.track === 'sim'} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{recent.def.name}</Text>
                  <Text style={styles.recentDesc}>{recent.def.description}</Text>
                  {recent.earnedOn ? <Text style={styles.recentDate}>{formatDate(recent.earnedOn)}</Text> : null}
                </View>
                <Icon name="chevron-right" size={18} color={colors.inkMuted} />
              </Card>
            </>
          ) : null}

          <SectionHeader title="Your Game" />
          <Card style={styles.game}>
            <Row label="Average score (18)" value={oneDecimal(s.avgScore)} />
            <Row label="Best round" value={s.best ? `${s.best.strokes} (${formatToPar(s.best.toPar)})` : '—'} />
            <Row label="Putts per round" value={oneDecimal(s.puttsPerRound)} />
            <Row label="Fairways hit" value={pct(s.fairwayPct)} />
            <Row label="Greens in regulation" value={pct(s.girPct)} />
            <Row label="Career birdies" value={String(s.birdies + s.eagles)} />
            <Row label="CT counties played" value={`${counties.size} of 8`} last />
          </Card>

          {devOpen ? (
            <Card style={styles.dev}>
              <Text style={styles.devTitle}>Developer</Text>
              <DevButton label="Reset to sample data" onPress={data.resetToSample} />
              <DevButton label="Clear all rounds (first-run state)" onPress={data.clearRounds} />
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowRule]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function DevButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button variant="secondary" label={label} onPress={onPress} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  hero: { height: 170, backgroundColor: colors.fairway, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.sm, backgroundColor: colors.fairway, zIndex: 2 },
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.cream },
  avatar: { alignSelf: 'center', marginTop: -52, width: 104, height: 104, borderRadius: 52, backgroundColor: colors.creamLight, borderWidth: 4, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.lg, gap: space.lg, marginTop: space.sm },
  name: { ...type.displayL, color: colors.ink, textAlign: 'center' },
  since: { ...type.caption, fontSize: 13, color: colors.inkMuted, textAlign: 'center', marginTop: -space.md },
  tiles: { flexDirection: 'row', gap: space.md },
  recent: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  recentTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  recentDesc: { ...type.caption, color: colors.inkMuted },
  recentDate: { ...type.caption, fontSize: 11, color: colors.inkMuted, marginTop: 2 },
  game: { paddingHorizontal: space.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  rowLabel: { ...type.body, color: colors.ink },
  rowValue: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  dev: { padding: space.lg, gap: space.sm },
  devTitle: { ...type.label, color: colors.gold },
  devButton: { borderWidth: 1.5, borderColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center' },
  devButtonText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
});
