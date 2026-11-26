import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { RoundRow } from '@/components/round-card';
import { Card, Chips, Empty, SheetScreen } from '@/components/ui';
import { formatToPar, type CareerStats } from '@/domain/stats';
import { oneDecimal, pct } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

type Filter = 'all' | 'course' | 'sim' | 'stats';

export default function Rounds() {
  const data = useAppData();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const [filter, setFilter] = useState<Filter>('all');
  const courseFilter = params.courseId ? data.courseById(params.courseId) : undefined;

  const rounds = data.roundsByDate.filter((r) =>
    (filter === 'all' || r.kind === filter) && (!courseFilter || (r.kind === 'course' && r.courseId === courseFilter.id)));

  return (
    <SheetScreen title="Rounds">
      <Chips
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'All' }, { value: 'course', label: 'Scorecards' }, { value: 'sim', label: 'Sim' }, { value: 'stats', label: 'Stats' }]}
      />

      {filter === 'stats' ? (
        <>
          <StatsPanel title="Course Rounds" stats={data.courseStats} />
          <StatsPanel title="Sim Rounds" stats={data.simStats} sim />
        </>
      ) : (
        <>
          {courseFilter ? (
            <Pressable style={styles.filterPill} onPress={() => router.setParams({ courseId: undefined })} accessibilityRole="button" accessibilityLabel="Clear course filter">
              <Text style={styles.filterText} numberOfLines={1}>{courseFilter.name}</Text>
              <Icon name="x" size={14} color={colors.cream} />
            </Pressable>
          ) : null}
          {rounds.length === 0 ? (
            <Empty title="No rounds" body={filter === 'sim' ? 'Sim rounds you log will show up here.' : 'Tap + to log a round.'} />
          ) : (
            rounds.map((r) => (
              <RoundRow
                key={r.id}
                round={r}
                summary={data.summaries.get(r.id)}
                name={r.status === 'active' ? `${data.roundCourseName(r)} · in progress` : data.roundCourseName(r)}
              />
            ))
          )}
        </>
      )}
    </SheetScreen>
  );
}

function StatsPanel({ title, stats, sim }: { title: string; stats: CareerStats; sim?: boolean }) {
  const s = stats.scoring;
  const holes = s.eagles + s.birdies + s.pars + s.bogeys + s.doublesPlus;
  const dist = [
    { label: 'Eagle+', n: s.eagles, color: colors.gold },
    { label: 'Birdie', n: s.birdies, color: '#C9A44A' },
    { label: 'Par', n: s.pars, color: colors.fairway },
    { label: 'Bogey', n: s.bogeys, color: colors.sage },
    { label: 'Double+', n: s.doublesPlus, color: colors.slate },
  ];
  return (
    <Card style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={styles.panelTitle}>{title}</Text>
        {sim ? <Text style={styles.simNote}>separate track</Text> : null}
      </View>
      {stats.rounds === 0 ? (
        <Text style={[type.body, { color: colors.inkMuted }]}>No rounds yet.</Text>
      ) : (
        <>
          <View style={styles.grid}>
            <Metric label="Rounds" value={String(stats.rounds)} />
            <Metric label="Avg score" value={oneDecimal(stats.avgScore)} />
            <Metric label="Best" value={stats.best ? `${stats.best.strokes}` : '—'} sub={stats.best ? formatToPar(stats.best.toPar) : undefined} />
            <Metric label="Putts / rd" value={oneDecimal(stats.puttsPerRound)} />
            <Metric label="Fairways" value={pct(stats.fairwayPct)} />
            <Metric label="GIR" value={pct(stats.girPct)} />
          </View>
          <Text style={styles.distLabel}>Scoring ({holes} holes)</Text>
          <View style={styles.bar}>
            {dist.filter((d) => d.n > 0).map((d) => <View key={d.label} style={{ flex: d.n, backgroundColor: d.color }} />)}
          </View>
          <View style={styles.legend}>
            {dist.map((d) => (
              <View key={d.label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: d.color }]} />
                <Text style={styles.legendText}>{d.label} {d.n}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}{sub ? <Text style={styles.metricSub}> {sub}</Text> : null}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, maxWidth: '100%' },
  filterText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.cream, flexShrink: 1 },
  panel: { padding: space.lg, gap: space.md },
  panelHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  panelTitle: { ...type.displayS, color: colors.ink },
  simNote: { ...type.label, fontSize: 9, color: colors.slate },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md },
  metric: { width: '33.33%', gap: 2 },
  metricValue: { fontFamily: fonts.bodySemibold, fontSize: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  metricSub: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
  metricLabel: { ...type.caption, color: colors.inkMuted },
  distLabel: { ...type.label, color: colors.inkMuted },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...type.caption, color: colors.ink },
});
