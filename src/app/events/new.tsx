import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Button, Chips, IconButton, Loading, SearchField } from '@/components/ui';
import { defaultFormat, FORMAT_LABEL, type Basis, type EventKind, type EventRound, type Scoring } from '@/domain/competition';
import { isNineHole } from '@/domain/layout';
import { addDaysISO, formatDay, formatTeeTime, todayISO } from '@/lib/format';
import { useAppData, useCourse } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';

type Holes = EventRound['holes'];

const DEFAULT_NAME: Record<EventKind, string> = { league: 'Thursday Night League', tournament: 'Club Championship', outing: 'Saturday round' };

export default function NewEvent() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const params = useLocalSearchParams<{ kind?: EventKind; courseId?: string }>();
  const startKind: EventKind = params.kind === 'tournament' ? 'tournament' : 'league';
  const [kind, setKind] = useState<EventKind>(startKind);
  const [name, setName] = useState('');
  const [scoring, setScoring] = useState<Scoring>('stroke');
  const [basis, setBasis] = useState<Basis>('net');
  const [start, setStart] = useState(addDaysISO(todayISO(), 7));
  const [count, setCount] = useState(startKind === 'tournament' ? 2 : 1);
  const [teeTime, setTeeTime] = useState<string | undefined>('08:00');
  const [courseId, setCourseId] = useState<string | undefined>(params.courseId);
  const [teeId, setTeeId] = useState<string | undefined>();
  const [holes, setHoles] = useState<Holes>('all');
  const [query, setQuery] = useState('');
  const [invite, setInvite] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { course, loading } = useCourse(courseId);
  const tee = course ? (teeId ?? course.tees[Math.min(1, course.tees.length - 1)]?.id) : undefined;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 2 ? [] : data.courseIndex.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 8);
  }, [query, data.courseIndex]);

  // A league starts with no schedule: the organizer adds rounds to it one at a time, whenever they're set.
  const league = kind === 'league';
  const rounds = league ? 0 : Math.max(1, kind === 'outing' ? 1 : count);
  const schedule = Array.from({ length: rounds }, (_, i) => ({
    name: kind === 'tournament' ? `Round ${i + 1}` : 'Round',
    scheduledOn: addDaysISO(start, i),
  }));
  const format = { ...defaultFormat(kind, scoring, basis) };
  const finalName = name.trim() || DEFAULT_NAME[kind];

  const changeKind = (k: EventKind) => {
    setKind(k);
    setCount(k === 'tournament' ? 2 : 1);
  };

  const create = async () => {
    if ((!league && !courseId) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = await data.createEvent({
        kind,
        name: finalName,
        format,
        inviteIds: invite,
        rounds: courseId ? schedule.map((s) => ({ ...s, courseId, teeId: tee, teeTime, holes })) : [],
      });
      router.replace(`/event/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the event.');
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top || space.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{kind === 'outing' ? 'Schedule a round' : 'New event'}</Text>
        <IconButton name="x" label="Close" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Chips value={kind} onChange={changeKind} options={[{ value: 'league', label: 'League' }, { value: 'tournament', label: 'Tournament' }]} />
        <Text style={styles.help}>
          {kind === 'league' ? 'A season with a points table. Once it’s set up, schedule rounds into it whenever you play.' : kind === 'tournament' ? 'One to four rounds and a single leaderboard.' : 'Plan a round with friends. No scoring, just who’s in.'}
        </Text>

        <Label>Name</Label>
        <TextInput value={name} onChangeText={setName} placeholder={DEFAULT_NAME[kind]} placeholderTextColor={colors.inkMuted} style={styles.input} maxLength={60} accessibilityLabel="Event name" />

        {kind !== 'outing' ? (
          <>
            <Label>Format</Label>
            <Chips value={scoring} onChange={setScoring} options={[{ value: 'stroke', label: 'Stroke' }, { value: 'stableford', label: 'Stableford' }, { value: 'match', label: 'Match play' }]} />
            <Chips value={basis} onChange={setBasis} options={[{ value: 'net', label: 'Net (handicaps)' }, { value: 'gross', label: 'Gross' }]} />
            <Text style={styles.help}>
              {FORMAT_LABEL(format)}{basis === 'net' ? ` · ${format.allowance}% handicap allowance` : ''}
              {kind === 'league' && scoring !== 'match' ? ' · season points 25-18-15-12-10… by finish each round' : ''}
              {scoring === 'match' ? ' · pairings set per round' : ''}
            </Text>
          </>
        ) : null}

        {league ? null : (
        <>
        <Label>Course</Label>
        {courseId ? (
          loading ? <Loading label="Loading scorecard…" /> : (
            <Tap onPress={() => { setCourseId(undefined); setTeeId(undefined); }} haptic="select" scaleTo={0.98} accessibilityRole="button" accessibilityLabel="Change course" style={styles.selected}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{course?.name}</Text>
                <Text style={styles.help}>{course?.city}, {course?.state} · tap to change</Text>
              </View>
              <Icon name="check" size={18} color={colors.fairway} />
            </Tap>
          )
        ) : (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Search courses or towns" />
            {matches.map((c) => (
              <Tap key={c.id} onPress={() => { setCourseId(c.id); setQuery(''); }} haptic="select" scaleTo={0.985} accessibilityRole="button" style={styles.option}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionName}>{c.name}</Text>
                  <Text style={styles.help}>{c.city}, {c.state}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.inkMuted} />
              </Tap>
            ))}
          </>
        )}

        {course ? (
          <>
            <Label>Tees</Label>
            <View style={styles.wrap}>
              {course.tees.map((t) => {
                const on = t.id === tee;
                return (
                  <Tap key={t.id} onPress={() => setTeeId(t.id)} haptic={on ? 'none' : 'select'} scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.pill, on && styles.pillOn]}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{t.name}</Text>
                  </Tap>
                );
              })}
            </View>
            <Chips value={isNineHole(course) && holes === 'back' ? 'front' : holes} onChange={setHoles} options={isNineHole(course)
                ? [{ value: 'front' as const, label: '9 holes' }, { value: 'all' as const, label: '18 · twice around' }]
                : [{ value: 'all' as const, label: '18 holes' }, { value: 'front' as const, label: 'Front 9' }, { value: 'back' as const, label: 'Back 9' }]} />
          </>
        ) : null}

        <Label>{kind === 'outing' ? 'When' : 'First round'}</Label>
        <Stepper
          value={formatDay(start)}
          onMinus={() => setStart((d) => (addDaysISO(d, -1) >= todayISO() ? addDaysISO(d, -1) : d))}
          onPlus={() => setStart((d) => addDaysISO(d, 1))}
          extra={{ label: '+1 week', onPress: () => setStart((d) => addDaysISO(d, 7)) }}
        />
        <Stepper
          value={teeTime ? formatTeeTime(teeTime) : 'No tee time'}
          onMinus={() => setTeeTime((t) => shiftTime(t ?? '08:00', -10))}
          onPlus={() => setTeeTime((t) => shiftTime(t ?? '08:00', 10))}
          extra={teeTime ? { label: 'Clear', onPress: () => setTeeTime(undefined) } : undefined}
        />
        {kind !== 'outing' ? (
          <>
            <Stepper
              value={`${count} ${count === 1 ? 'round' : 'rounds'}`}
              onMinus={() => setCount((c) => Math.max(1, c - 1))}
              onPlus={() => setCount((c) => Math.min(4, c + 1))}
            />
            <Text style={styles.help}>
              Consecutive days from {formatDay(start)}. You can play at the course on that date; each player logs their own round.
            </Text>
          </>
        ) : null}
        </>
        )}

        <Label>Invite friends</Label>
        <View style={styles.wrap}>
          {data.friends.map((f) => {
            const on = invite.includes(f.id);
            return (
              <Tap key={f.id} onPress={() => setInvite((w) => (on ? w.filter((x) => x !== f.id) : [...w, f.id]))} haptic="select" scaleTo={0.94} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.friend, on && styles.pillOn]}>
                <Avatar player={f} size={26} />
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{f.name.split(' ')[0]}</Text>
                {on ? <Icon name="check" size={14} color={colors.cream} strokeWidth={2.4} /> : null}
              </Tap>
            );
          })}
        </View>
        <Text style={styles.help}>You’ll also get a join code to share with anyone else.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={busy ? 'Creating…' : `Create ${kind === 'outing' ? 'round' : kind}`} onPress={create} disabled={(!league && !courseId) || busy} />
      </View>
    </View>
  );
}

function shiftTime(t: string, minutes: number) {
  const [h, m] = t.split(':').map(Number);
  const total = Math.min(21 * 60, Math.max(5 * 60, h * 60 + m + minutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Stepper({ value, onMinus, onPlus, extra }: { value: string; onMinus: () => void; onPlus: () => void; extra?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.stepper}>
      <Tap onPress={onMinus} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel={`Decrease ${value}`} style={styles.stepBtn}>
        <Icon name="minus" size={16} color={colors.fairway} />
      </Tap>
      <Text style={styles.stepValue}>{value}</Text>
      <Tap onPress={onPlus} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel={`Increase ${value}`} style={styles.stepBtn}>
        <Icon name="plus" size={16} color={colors.fairway} />
      </Tap>
      {extra ? (
        <Tap onPress={extra.onPress} haptic="select" scaleTo={0.94} accessibilityRole="button" style={styles.stepExtra}>
          <Text style={styles.pillText}>{extra.label}</Text>
        </Tap>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.fairway },
  content: { paddingHorizontal: space.lg, gap: space.md, paddingBottom: space.xxl },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, marginTop: space.sm },
  help: { ...type.caption, fontSize: 12, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  input: { height: 48, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  selected: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.md, borderWidth: 1.5, borderColor: colors.fairway },
  selectedName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  optionName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: { paddingHorizontal: 14, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.paper, justifyContent: 'center' },
  pillOn: { backgroundColor: colors.fairway },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  pillTextOn: { color: colors.cream, fontFamily: fonts.bodySemibold },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, height: 36, borderRadius: radius.pill, backgroundColor: colors.paper },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 120, textAlign: 'center', fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  stepExtra: { paddingHorizontal: 12, minHeight: 34, borderRadius: radius.pill, backgroundColor: colors.paper, justifyContent: 'center' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
}));
