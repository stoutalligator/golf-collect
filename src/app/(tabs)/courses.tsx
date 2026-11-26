import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CourseScene } from '@/art/components';
import { Card, CheckCircle, Chips, Empty, SearchField, SheetScreen } from '@/components/ui';
import { COURSE_DATA_ATTRIBUTION } from '@/data/repository';
import { ACCESS_LABEL } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

type Filter = 'all' | 'played' | 'wishlist';

export default function Courses() {
  const data = useAppData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.courses
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
      .filter((c) => filter === 'all'
        || (filter === 'played' && data.collections.get(c.id)?.played)
        || (filter === 'wishlist' && data.wishlist.includes(c.id)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.courses, data.collections, data.wishlist, query, filter]);

  return (
    <SheetScreen title="Courses" headerExtra={<SearchField value={query} onChange={setQuery} placeholder="Search courses..." />}>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'All' }, { value: 'played', label: 'Played' }, { value: 'wishlist', label: 'Wishlist' }]}
      />
      {list.length === 0 ? (
        <Empty title="Nothing here yet" body={filter === 'wishlist' ? 'Bookmark a course to add it to your wishlist.' : 'No courses match your search.'} />
      ) : (
        list.map((c) => {
          const played = !!data.collections.get(c.id)?.played;
          return (
            <Card key={c.id} onPress={() => router.push(`/course/${c.id}`)} style={styles.row}>
              <CourseScene course={c} style={styles.thumb} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.meta}>{c.city}, {c.state} · {ACCESS_LABEL[c.access]}</Text>
              </View>
              <CheckCircle checked={played} />
            </Card>
          );
        })
      )}
      <Text style={styles.attribution}>Course data {COURSE_DATA_ATTRIBUTION.replace(/^©/, '©')}</Text>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, paddingRight: space.md },
  thumb: { width: 76, height: 52, borderRadius: radius.sm },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
  attribution: { ...type.caption, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
});
