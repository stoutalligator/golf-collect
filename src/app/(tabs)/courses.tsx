import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { CourseThumb } from '@/components/round-card';
import { AvatarStack } from '@/components/social';
import { Chips, Empty, Group, SearchField, SheetScreen } from '@/components/ui';
import { TIERS } from '@/data/config/game';
import { COURSE_DATA_ATTRIBUTION } from '@/data/repository';
import { ACCESS_LABEL } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, space, type } from '@/theme';

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
    <SheetScreen title="Courses" headerExtra={<SearchField value={query} onChange={setQuery} placeholder="Search courses or towns" />}>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'All' }, { value: 'played', label: 'Played' }, { value: 'wishlist', label: 'Wishlist' }]}
      />
      {list.length === 0 ? (
        <Empty title="Nothing here yet" body={filter === 'wishlist' ? 'Bookmark a course to add it to your wishlist.' : 'No courses match your search.'} />
      ) : (
        <Animated.View entering={enterItem(0)}>
          <Group inset={space.md}>
            {list.map((c) => {
              const col = data.collections.get(c.id);
              const played = !!col?.played;
              const par = c.holes.reduce((s, h) => s + h.par, 0);
              const tier = col?.tier ? TIERS.find((t) => t.tier === col.tier!.tier)?.name : null;
              const friends = data.friends.filter((f) => data.playerData(f.id)?.collections.get(c.id)?.played);
              const wish = data.wishlist.includes(c.id);
              return (
                <Tap key={c.id} onPress={() => router.push(`/course/${c.id}`)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={`${c.name}, ${c.city}${played ? ', played' : ''}`} style={styles.row}>
                  <CourseThumb course={c} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.meta} numberOfLines={1}>{c.city}  ·  {ACCESS_LABEL[c.access]}  ·  Par {par}</Text>
                    <View style={styles.status}>
                      {played ? (
                        <View style={styles.inline}>
                          <Icon name="check" size={12} color={colors.fairway} strokeWidth={2.4} />
                          <Text style={styles.played}>{tier ? `${tier}  ·  ` : 'Played  ·  '}{col!.earnedCount}/{col!.items.length} collected</Text>
                        </View>
                      ) : wish ? (
                        <View style={styles.inline}>
                          <Icon name="bookmark" size={12} color={colors.inkMuted} />
                          <Text style={styles.quiet}>Wishlist</Text>
                        </View>
                      ) : null}
                      <View style={{ flex: 1 }} />
                      {friends.length ? <AvatarStack players={friends.slice(0, 3)} size={18} /> : null}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.inkMuted} />
                </Tap>
              );
            })}
          </Group>
        </Animated.View>
      )}
      <Text style={styles.attribution}>Course data {COURSE_DATA_ATTRIBUTION}</Text>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  status: { flexDirection: 'row', alignItems: 'center', minHeight: 20, marginTop: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  played: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.fairway },
  quiet: { ...type.caption, color: colors.inkMuted },
  attribution: { ...type.caption, fontSize: 10, color: colors.inkMuted, textAlign: 'center' },
});
