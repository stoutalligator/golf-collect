import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collectible, SceneImage } from '@/art/components';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/social';
import { Button, Chips, IconButton, SearchField } from '@/components/ui';
import type { Round, RoundKind } from '@/domain/types';
import { todayISO } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';
import { Tap } from '@/components/motion';

type Holes = '18' | 'front' | 'back';

export default function NewRound() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const [kind, setKind] = useState<RoundKind>('course');
  const [courseId, setCourseId] = useState<string | undefined>(params.courseId);
  const [teeId, setTeeId] = useState<string | undefined>();
  const [holes, setHoles] = useState<Holes>('18');
  const [query, setQuery] = useState('');
  const [withIds, setWithIds] = useState<string[]>([]);
  const toggleWith = (id: string) => setWithIds((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = kind === 'course'
      ? data.courses.map((c) => ({ id: c.id, name: c.name, sub: `${c.city}, ${c.state}` }))
      : data.simCourses.map((c) => ({ id: c.id, name: c.name, sub: c.platform ?? 'Simulator' }));
    return list.filter((o) => !q || o.name.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q));
  }, [kind, data.courses, data.simCourses, query]);

  const course = kind === 'course' && courseId ? data.courseById(courseId) : undefined;
  const sim = kind === 'sim' && courseId ? data.simCourseById(courseId) : undefined;
  const layout = course ?? sim;
  const selectedTee = course ? (teeId ?? course.tees[Math.min(1, course.tees.length - 1)]?.id) : undefined;

  const start = async () => {
    if (!layout) return;
    const all = layout.holes.map((h) => h.number);
    const holeNumbers = holes === '18' ? all : holes === 'front' ? all.slice(0, 9) : all.slice(9, 18);
    const now = new Date().toISOString();
    const round: Round = {
      id: uuid(),
      kind,
      courseId: layout.id,
      teeId: selectedTee,
      date: todayISO(),
      status: 'active',
      holeNumbers,
      playerIds: [data.me.id, ...withIds],
      scores: { [data.me.id]: holeNumbers.map(() => null) },
      createdAt: now,
    };
    await data.saveRound(round);
    router.replace(`/round/play/${round.id}`);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top || space.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Log a Round</Text>
        <IconButton name="x" label="Close" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Chips
          value={kind}
          onChange={(k) => { setKind(k); setCourseId(undefined); setTeeId(undefined); }}
          options={[{ value: 'course', label: 'On the course' }, { value: 'sim', label: 'Simulator' }]}
        />
        {kind === 'sim' ? <Text style={styles.note}>Sim rounds count toward sim stats and sim badges only, never real-course collectibles.</Text> : null}

        {layout ? (
          <Tap haptic="select" scaleTo={0.98} style={styles.selected} onPress={() => setCourseId(undefined)} accessibilityRole="button" accessibilityLabel="Change course">
            {course ? (
              <Collectible courseId={course.id} region={course.region} kind="ball-marker" tier={data.collections.get(course.id)?.tier?.tier} label={shortCourseName(course.name)} size={52} />
            ) : <SceneImage seed={layout.id} style={styles.selectedThumb} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{layout.name}</Text>
              <Text style={styles.sub}>Par {layout.holes.reduce((s, h) => s + h.par, 0)} · tap to change</Text>
            </View>
            <Icon name="check" size={20} color={colors.fairway} />
          </Tap>
        ) : (
          <>
            <SearchField value={query} onChange={setQuery} placeholder={kind === 'course' ? 'Search courses...' : 'Search sim courses...'} />
            {options.map((o) => (
              <Tap key={o.id} haptic="select" scaleTo={0.985} dim onPress={() => setCourseId(o.id)} style={styles.option} accessibilityRole="button">
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionName}>{o.name}</Text>
                  <Text style={styles.sub}>{o.sub}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.inkMuted} />
              </Tap>
            ))}
          </>
        )}

        {course ? (
          <>
            <Text style={styles.label}>Tees</Text>
            <View style={styles.tees}>
              {course.tees.map((t) => {
                const active = t.id === selectedTee;
                return (
                  <Tap key={t.id} haptic={active ? 'none' : 'select'} scaleTo={0.94} onPress={() => setTeeId(t.id)} style={[styles.tee, active && styles.teeActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                    <Text style={[styles.teeName, active && { color: colors.cream }]}>{t.name}</Text>
                    <Text style={[styles.teeYards, active && { color: colors.goldSoft }]}>{t.totalYards.toLocaleString('en-US')}</Text>
                  </Tap>
                );
              })}
            </View>
          </>
        ) : null}

        {layout ? (
          <>
            <Text style={styles.label}>Holes</Text>
            <Chips value={holes} onChange={setHoles} options={[{ value: '18', label: '18 holes' }, { value: 'front', label: 'Front 9' }, { value: 'back', label: 'Back 9' }]} />

            <Text style={styles.label}>Playing with</Text>
            <View style={styles.friends}>
              {data.friends.map((f) => {
                const on = withIds.includes(f.id);
                return (
                  <Tap key={f.id} haptic="select" scaleTo={0.94} onPress={() => toggleWith(f.id)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={f.name} style={[styles.friend, on && styles.friendOn]}>
                    <Avatar player={f} size={26} />
                    <Text style={[styles.friendName, on && { color: colors.cream }]}>{f.name.split(' ')[0]}</Text>
                    {on ? <Icon name="check" size={14} color={colors.cream} strokeWidth={2.4} /> : null}
                  </Tap>
                );
              })}
            </View>
            <Text style={styles.note}>Tagged friends see the round in their feed. You keep score for yourself.</Text>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label="Tee Off" icon="flag" onPress={start} disabled={!layout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  title: { ...type.displayL, color: colors.fairway },
  content: { paddingHorizontal: space.lg, gap: space.md, paddingBottom: space.xxl },
  note: { ...type.caption, color: colors.slate },
  selected: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.sm, borderWidth: 1.5, borderColor: colors.fairway },
  selectedThumb: { width: 72, height: 50, borderRadius: radius.sm },
  selectedName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  sub: { ...type.caption, color: colors.inkMuted },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: space.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  optionName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  label: { ...type.label, color: colors.inkMuted, marginTop: space.sm },
  tees: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tee: { borderWidth: 1.5, borderColor: colors.fairway, borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  teeActive: { backgroundColor: colors.fairway },
  teeName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  teeYards: { ...type.caption, color: colors.inkMuted },
  friends: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, height: 36, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.rule, backgroundColor: colors.creamLight },
  friendOn: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  friendName: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  startButton: { backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  startText: { fontFamily: fonts.bodySemibold, fontSize: 17, color: colors.cream },
});
