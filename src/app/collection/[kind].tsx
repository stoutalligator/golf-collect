import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Collectible } from '@/art/components';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Chips, Empty, LockMark, ProgressBar, SheetScreen } from '@/components/ui';
import { TIERS } from '@/data/config/game';
import type { CollectibleItem } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { useShelves, type ShelfEntry } from '@/state/collection-view';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

type Filter = 'all' | 'earned' | 'locked';

/** Full case for one collectible type: everything you've earned, then what's still out there. */
export default function CollectionCase() {
  const { kind } = useLocalSearchParams<{ kind: CollectibleItem }>();
  const data = useAppData();
  const shelf = useShelves(data.meData).find((s) => s.kind === kind);
  const [filter, setFilter] = useState<Filter>('all');
  if (!shelf) return <SheetScreen title="Collection" back><Empty title="Not found" body="" /></SheetScreen>;

  const list = filter === 'earned' ? shelf.earned : filter === 'locked' ? shelf.locked : [...shelf.earned, ...shelf.locked];
  const tierCounts = kind === 'ball-marker'
    ? TIERS.map((t) => ({ name: t.name, n: shelf.earned.filter((e) => e.tier === t.tier).length })).filter((t) => t.n > 0)
    : [];

  return (
    <SheetScreen title={shelf.title} back>
      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <Text style={styles.count}>{shelf.earned.length}<Text style={styles.of}> of {shelf.total}</Text></Text>
          {tierCounts.length ? (
            <Text style={styles.tiers}>{tierCounts.map((t) => `${t.n} ${t.name}`).join(' · ')}</Text>
          ) : null}
        </View>
        <ProgressBar value={shelf.earned.length} max={shelf.total} />
        <Text style={styles.hint}>{shelf.hint}</Text>
      </View>

      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'earned', label: `Collected ${shelf.earned.length}` },
          { value: 'locked', label: `To earn ${shelf.locked.length}` },
        ]}
      />

      {list.length === 0 ? (
        <Empty title={filter === 'earned' ? 'None yet' : 'All collected'} body={filter === 'earned' ? shelf.hint : 'You have every one of these. Nice.'} />
      ) : (
        <View style={styles.grid}>
          {list.map((e, i) => (
            <Animated.View key={`${e.course.id}-${e.def.id}`} entering={enterItem(i)} style={styles.cellWrap}>
              <Cell entry={e} kind={shelf.kind} />
            </Animated.View>
          ))}
        </View>
      )}
    </SheetScreen>
  );
}

function Cell({ entry, kind }: { entry: ShelfEntry; kind: CollectibleItem }) {
  const { course, def, state, tier } = entry;
  const short = shortCourseName(course.name);
  const locked = !state.earned;
  return (
    <Tap onPress={() => router.push(`/collectible/${course.id}/${def.id}`)} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={`${short} ${def.name}${locked ? ', not yet earned' : ''}`} style={[styles.cell, locked && styles.cellLocked]}>
      <View>
        <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={kind} id={def.id} tier={tier} label={short} size={96} dim={locked} />
        {locked ? <View style={styles.lock}><LockMark /></View> : null}
      </View>
      <Text style={styles.name} numberOfLines={1}>{short}</Text>
      {locked ? (
        state.progress ? (
          <View style={styles.progress}>
            <ProgressBar value={state.progress.current} max={state.progress.target} />
            <Text style={styles.meta}>{state.progress.current}/{state.progress.target} rounds</Text>
          </View>
        ) : (
          <Text style={styles.meta} numberOfLines={2}>{def.howToEarn}</Text>
        )
      ) : (
        <Text style={styles.meta}>{kind === 'ball-marker' && tier ? `${tier[0].toUpperCase()}${tier.slice(1)} · ` : ''}{state.earnedOn ? formatDate(state.earnedOn) : ''}</Text>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  summary: { gap: space.sm },
  summaryTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  count: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.fairway },
  of: { fontFamily: fonts.body, fontSize: 15, color: colors.inkMuted },
  tiers: { ...type.caption, color: colors.inkMuted },
  hint: { ...type.caption, color: colors.inkMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md, marginTop: -space.sm },
  cellWrap: { width: '31.5%' },
  cell: { alignItems: 'center', gap: 3, paddingVertical: space.md, paddingHorizontal: 6, backgroundColor: colors.creamLight, borderRadius: radius.lg, minHeight: 182, ...shadow.card },
  cellLocked: { backgroundColor: colors.paper, shadowOpacity: 0, elevation: 0 },
  name: { fontFamily: fonts.display, fontSize: 14, lineHeight: 18, color: colors.ink, textAlign: 'center' },
  meta: { ...type.caption, fontSize: 10, lineHeight: 13, color: colors.inkMuted, textAlign: 'center' },
  progress: { alignSelf: 'stretch', gap: 3, paddingHorizontal: 4 },
  lock: { position: 'absolute', right: 0, bottom: 0 },
});
