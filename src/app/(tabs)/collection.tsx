import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Collectible } from '@/art/components';
import { Chips, Empty, IconButton, SearchField, SheetScreen } from '@/components/ui';
import { KIND_CATEGORY } from '@/domain/collection';
import type { CollectibleCategory } from '@/domain/types';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

type Filter = 'all' | CollectibleCategory;

export default function Collection() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const earned = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.courses.flatMap((course) => {
      const col = data.collections.get(course.id);
      if (!col) return [];
      return col.items
        .filter((i) => i.earned)
        .map((i) => ({ course, state: i, def: i.def, tier: col.tier?.tier }))
        .filter((x) => filter === 'all' || KIND_CATEGORY[x.def.kind] === filter)
        .filter((x) => !q || x.course.name.toLowerCase().includes(q));
    }).sort((a, b) => (b.state.earnedOn ?? '').localeCompare(a.state.earnedOn ?? ''));
  }, [data.courses, data.collections, filter, query]);

  const total = [...data.collections.values()].reduce((n, c) => n + c.items.length, 0);
  const owned = [...data.collections.values()].reduce((n, c) => n + c.earnedCount, 0);
  const complete = [...data.collections.values()].filter((c) => c.complete).length;

  return (
    <SheetScreen
      title="My Collection"
      right={
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <IconButton name="trophy" label="Achievements" onPress={() => router.push('/achievements')} />
          <IconButton name="search" label="Search collection" onPress={() => setSearching((s) => !s)} />
        </View>
      }
      headerExtra={searching ? <SearchField value={query} onChange={setQuery} placeholder="Search by course..." /> : undefined}>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'bag-tags', label: 'Bag Tags' },
          { value: 'markers', label: 'Markers' },
          { value: 'patches', label: 'Patches' },
          { value: 'pins', label: 'Pins' },
        ]}
      />
      <Text style={styles.summary}>{owned} of {total} collected · {complete} full course {complete === 1 ? 'set' : 'sets'}</Text>

      {earned.length === 0 ? (
        <Empty title="Nothing collected yet" body="Play a course to earn its ball marker. Bag tags, pitch markers, patches and pins follow." />
      ) : (
        <View style={styles.grid}>
          {earned.map(({ course, state, def, tier }) => (
            <Pressable
              key={`${course.id}-${def.id}`}
              onPress={() => router.push(`/collectible/${course.id}/${def.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${shortCourseName(course.name)} ${def.name}`}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}>
              <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={def.kind} id={def.id} tier={tier} label={shortCourseName(course.name)} size={118} />
              <Text style={styles.tileName} numberOfLines={1}>{shortCourseName(course.name)}</Text>
              <Text style={styles.tileMeta}>{def.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  summary: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  tile: { width: '48%', backgroundColor: colors.creamLight, borderRadius: radius.lg, alignItems: 'center', paddingVertical: space.lg, paddingHorizontal: space.sm, gap: 4, borderWidth: 1, borderColor: colors.rule, ...shadow.card },
  tileName: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  tileMeta: { ...type.caption, color: colors.inkMuted },
});
