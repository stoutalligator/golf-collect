import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Collectible } from '@/art/components';
import { Animated, CountUp, enterItem, Tap } from '@/components/motion';
import { LockMark, ProgressBar, SectionHeader, SheetScreen } from '@/components/ui';
import { TIERS } from '@/data/config/game';
import type { CollectibleItem } from '@/domain/types';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { useShelves, type ShelfEntry } from '@/state/collection-view';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

/** Trophy Room: one shelf per collectible type plus a badge shelf; each opens its full case. */
export default function Collection() {
  const data = useAppData();
  const shelves = useShelves(data.meData);
  const total = shelves.reduce((n, s) => n + s.total, 0);
  const owned = shelves.reduce((n, s) => n + s.earned.length, 0);
  const complete = [...data.collections.values()].filter((c) => c.complete).length;
  const badges = data.achievements;
  const badgesEarned = badges.filter((b) => b.earned).sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''));

  return (
    <SheetScreen title="Trophy Room">
      <Animated.View entering={enterItem(0)} style={styles.summary}>
        <View style={styles.summaryTop}>
          <Text style={styles.summaryValue}>
            <CountUp value={owned} style={styles.summaryValue} />
            <Text style={styles.summaryOf}> of {total} collected</Text>
          </Text>
        </View>
        <ProgressBar value={owned} max={total} />
        <Text style={styles.summaryLine}>
          {data.meData.coursesPlayed} courses played  ·  {complete} full {complete === 1 ? 'set' : 'sets'}  ·  {badgesEarned.length} badges
        </Text>
      </Animated.View>

      {shelves.map((s, i) => (
        <Animated.View key={s.kind} entering={enterItem(i + 1)}>
          <Shelf
            title={s.title}
            count={`${s.earned.length}/${s.total}`}
            onOpen={() => router.push(`/collection/${s.kind}`)}
            empty={s.earned.length === 0 ? s.hint : undefined}>
            {s.earned.map((e) => <ShelfItem key={`${e.course.id}-${e.def.id}`} entry={e} kind={s.kind} />)}
            {s.locked.slice(0, Math.max(1, 3 - s.earned.length)).map((e) => <ShelfItem key={`${e.course.id}-${e.def.id}`} entry={e} kind={s.kind} locked />)}
          </Shelf>
        </Animated.View>
      ))}

      <Animated.View entering={enterItem(shelves.length + 1)}>
        <Shelf title="Badges" count={`${badgesEarned.length}/${badges.length}`} onOpen={() => router.push('/achievements')}>
          {badgesEarned.map((b) => (
            <Tap key={b.def.id} onPress={() => router.push(`/achievement/${b.def.id}`)} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={b.def.name} style={styles.item}>
              <Badge id={b.def.id} name={b.def.name} sim={b.def.track === 'sim'} size={84} />
              <Text style={styles.itemName} numberOfLines={1}>{b.def.name}</Text>
            </Tap>
          ))}
        </Shelf>
      </Animated.View>
    </SheetScreen>
  );
}

/** A section with a horizontal row of items standing on a soft ledge (no card around it). */
function Shelf({ title, count, onOpen, empty, children }: { title: string; count: string; onOpen: () => void; empty?: string; children: ReactNode }) {
  return (
    <View style={styles.shelf}>
      <SectionHeader title={title} count={count} action="View all" onAction={onOpen} />
      <View>
        <View style={styles.ledge} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shelfRow} style={styles.shelfScroll}>
          {children}
        </ScrollView>
      </View>
      {empty ? <Text style={styles.shelfEmpty}>{empty}</Text> : null}
    </View>
  );
}

function ShelfItem({ entry, kind, locked }: { entry: ShelfEntry; kind: CollectibleItem; locked?: boolean }) {
  const { course, def, tier } = entry;
  const short = shortCourseName(course.name);
  const tierName = kind === 'ball-marker' && tier ? TIERS.find((t) => t.tier === tier)?.name : undefined;
  return (
    <Tap onPress={() => router.push(`/collectible/${course.id}/${def.id}`)} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={`${short} ${def.name}${tierName ? `, ${tierName}` : ''}${locked ? ', not yet earned' : ''}`} style={styles.item}>
      <View>
        <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={kind} id={def.id} tier={tier} label={short} size={84} dim={locked} />
        {locked ? <View style={styles.lock}><LockMark /></View> : null}
      </View>
      <Text style={[styles.itemName, locked && { color: colors.inkMuted }]} numberOfLines={2}>{short}</Text>
      {tierName && !locked ? <Text style={styles.itemTier}>{tierName}</Text> : null}
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  summary: { backgroundColor: colors.creamLight, borderRadius: radius.xl, padding: space.lg, gap: space.sm, ...shadow.card },
  summaryTop: { flexDirection: 'row', alignItems: 'baseline' },
  summaryValue: { fontFamily: fonts.displayBold, fontSize: 36, lineHeight: 42, color: colors.fairway },
  summaryOf: { fontFamily: fonts.body, fontSize: 16, color: colors.inkMuted },
  summaryLine: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  shelf: { gap: space.md },
  shelfScroll: { marginHorizontal: -space.lg },
  shelfRow: { gap: space.md, paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xs },
  ledge: { position: 'absolute', left: 0, right: 0, top: 70, height: 26, borderRadius: radius.md, backgroundColor: colors.paper },
  shelfEmpty: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  item: { width: 92, alignItems: 'center', gap: 2 },
  itemName: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 15, color: colors.ink, textAlign: 'center', marginTop: 4 },
  itemTier: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  lock: { position: 'absolute', right: 2, bottom: 2 },
}));
