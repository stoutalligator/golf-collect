/**
 * Schedule a round with friends (or edit one with ?event=<id>). A focused flow: live invitation preview, a date
 * strip, tee-time presets, group size, invites and a note. Saved as an "outing" event with one event round.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Animated, popIn, Tap } from '@/components/motion';
import { CourseThumb } from '@/components/round-card';
import { Avatar } from '@/components/social';
import { Button, Chips, IconButton, Loading, SearchField } from '@/components/ui';
import { defaultFormat, type EventRound } from '@/domain/competition';
import type { Player } from '@/domain/types';
import { addDaysISO, formatTeeTime, todayISO } from '@/lib/format';
import { useAppData, useCourse } from '@/state/app-data';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

type Holes = EventRound['holes'];
const PRESETS = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '17:30'];
const GROUPS = [{ value: '2', label: 'Twosome' }, { value: '3', label: 'Threesome' }, { value: '4', label: 'Foursome' }, { value: '0', label: 'Open' }] as const;
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dateParts = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return {
    weekday: WEEKDAY[d.getDay()],
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    weekend: d.getDay() === 0 || d.getDay() === 6,
  };
};

const shiftTime = (t: string, minutes: number) => {
  const [h, m] = t.split(':').map(Number);
  const total = Math.min(20 * 60, Math.max(5 * 60, h * 60 + m + minutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** Next Saturday (or today if it's Saturday). */
const nextSaturday = () => {
  const d = new Date(`${todayISO()}T12:00:00`);
  return addDaysISO(todayISO(), (6 - d.getDay() + 7) % 7 || 0);
};

export default function Schedule() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const params = useLocalSearchParams<{ courseId?: string; event?: string }>();

  // Edit mode: start from the existing scheduled round.
  const editing = params.event ? data.events.find((e) => e.id === params.event && e.kind === 'outing') : undefined;
  const editRound = editing ? data.eventRounds.find((r) => r.eventId === editing.id) : undefined;
  const alreadyIn = new Set(editing ? data.eventMembers.filter((m) => m.eventId === editing.id).map((m) => m.playerId) : []);

  const [courseId, setCourseId] = useState<string | undefined>(editRound?.courseId ?? params.courseId);
  const [teeId, setTeeId] = useState<string | undefined>(editRound?.teeId);
  const [holes, setHoles] = useState<Holes>(editRound?.holes ?? 'all');
  const [date, setDate] = useState(editRound?.scheduledOn ?? nextSaturday());
  const [teeTime, setTeeTime] = useState<string | undefined>(editRound ? editRound.teeTime : '08:00');
  const [spots, setSpots] = useState<string>(String(editing?.format.spots ?? 4));
  const [invite, setInvite] = useState<string[]>([]);
  const [note, setNote] = useState(editing?.format.note ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { course, loading } = useCourse(courseId);
  const tee = course ? (teeId ?? course.tees[Math.min(1, course.tees.length - 1)]?.id) : undefined;
  const teeInfo = course?.tees.find((t) => t.id === tee);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length < 2 ? [] : data.courseIndex.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)).slice(0, 8);
  }, [query, data.courseIndex]);
  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => addDaysISO(todayISO(), i)), []);

  const parts = dateParts(date);
  const shortCourse = (course?.name ?? '').replace(/\s+(Golf Course|Golf Club|Country Club|Golf & Country Club|Club)\b.*$/i, '') || 'the course';
  const autoName = `${parts.weekday} at ${shortCourse}`;
  const limit = Number(spots) || 0;
  const invitedPlayers = data.friends.filter((f) => invite.includes(f.id));
  const groupPlayers: Player[] = [data.me, ...data.friends.filter((f) => alreadyIn.has(f.id)), ...invitedPlayers];
  const over = limit > 0 && groupPlayers.length > limit;

  const save = async () => {
    if (!courseId || busy) return;
    setBusy(true);
    setError(null);
    const format = { ...defaultFormat('outing'), spots: limit || undefined, note: note.trim() || undefined };
    try {
      if (editing && editRound) {
        await data.updateEvent(editing.id, { name: name.trim() || autoName, format: { ...editing.format, ...format } });
        await data.updateEventRound(editRound.id, { scheduledOn: date, teeTime, courseId, teeId: tee, holes });
        if (invite.length) await data.inviteToEvent(editing.id, invite);
        if (router.canGoBack()) router.back();
        else router.replace(`/event/${editing.id}`);
      } else {
        const id = await data.createEvent({
          kind: 'outing',
          name: name.trim() || autoName,
          format,
          inviteIds: invite,
          rounds: [{ name: 'Round', courseId, teeId: tee, scheduledOn: date, teeTime, holes }],
        });
        router.replace(`/event/${id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the round.');
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top || space.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{editing ? 'Edit round' : 'Schedule a round'}</Text>
        <IconButton name="x" label="Close" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Live invitation preview */}
        <Animated.View entering={popIn(0, { from: 0.97, duration: 260 })} style={styles.ticket}>
          <View style={styles.ticketTop}>
            {course ? <CourseThumb course={course} style={styles.ticketArt} /> : <View style={[styles.ticketArt, styles.ticketArtEmpty]}><Icon name="flag" size={22} color={colors.inkMuted} /></View>}
            <View style={styles.dateBlock}>
              <Text style={styles.dateDow}>{parts.dow}</Text>
              <Text style={styles.dateDay}>{parts.day}</Text>
              <Text style={styles.dateMonth}>{parts.month}</Text>
            </View>
          </View>
          <View style={styles.ticketBody}>
            <Text style={styles.ticketName} numberOfLines={1}>{name.trim() || autoName}</Text>
            <Text style={styles.ticketCourse} numberOfLines={1}>{course?.name ?? 'Pick a course'}</Text>
            <Text style={styles.ticketMeta}>
              {teeTime ? formatTeeTime(teeTime) : 'Tee time TBD'}
              {teeInfo ? ` · ${teeInfo.name} tees` : ''}
              {holes !== 'all' ? ` · ${holes === 'front' ? 'Front' : 'Back'} 9` : ' · 18 holes'}
            </Text>
            <View style={styles.slots}>
              {Array.from({ length: Math.max(limit || groupPlayers.length, groupPlayers.length) }, (_, i) => {
                const p = groupPlayers[i];
                return p ? (
                  <View key={p.id} style={styles.slotFilled}><Avatar player={p} size={34} /></View>
                ) : (
                  <View key={`open-${i}`} style={styles.slotOpen}><Icon name="plus" size={14} color={colors.inkMuted} /></View>
                );
              })}
              <Text style={styles.slotText}>
                {limit ? `${Math.max(0, limit - groupPlayers.length)} ${limit - groupPlayers.length === 1 ? 'spot' : 'spots'} open` : `${groupPlayers.length} invited`}
              </Text>
            </View>
            {note.trim() ? <Text style={styles.ticketNote} numberOfLines={3}>“{note.trim()}”</Text> : null}
          </View>
        </Animated.View>

        {/* Course */}
        <Section title="Where">
          {courseId ? (
            loading ? <Loading label="Loading course…" /> : (
              <Tap onPress={() => { setCourseId(undefined); setTeeId(undefined); }} haptic="select" scaleTo={0.98} accessibilityRole="button" accessibilityLabel="Change course" style={styles.courseRow}>
                {course ? <CourseThumb course={course} style={styles.courseThumb} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseName} numberOfLines={1}>{course?.name}</Text>
                  <Text style={styles.help}>{course?.city}, {course?.state} · Change</Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.inkMuted} />
              </Tap>
            )
          ) : (
            <View style={{ gap: space.sm }}>
              <SearchField value={query} onChange={setQuery} placeholder="Search courses or towns" />
              {matches.map((c) => (
                <Tap key={c.id} onPress={() => { setCourseId(c.id); setTeeId(undefined); setQuery(''); }} haptic="select" scaleTo={0.985} accessibilityRole="button" style={styles.option}>
                  <CourseThumb course={c} style={styles.optionThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionName} numberOfLines={1}>{c.name}</Text>
                    <Text style={styles.help}>{c.city}, {c.state}</Text>
                  </View>
                </Tap>
              ))}
              {data.wishlist.length && !query ? (
                <View style={styles.wrap}>
                  {data.wishlist.slice(0, 4).map((id) => {
                    const c = data.courseSummary(id);
                    return c ? (
                      <Tap key={id} onPress={() => setCourseId(id)} haptic="select" scaleTo={0.95} accessibilityRole="button" style={styles.pill}>
                        <Icon name="bookmark" size={12} color={colors.inkMuted} />
                        <Text style={styles.pillText} numberOfLines={1}>{c.name.replace(/\s+(Golf Course|Golf Club|Country Club)$/i, '')}</Text>
                      </Tap>
                    ) : null;
                  })}
                </View>
              ) : null}
            </View>
          )}
          {course ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow} style={styles.hScroll}>
                {course.tees.map((t) => {
                  const on = t.id === tee;
                  return (
                    <Tap key={t.id} onPress={() => setTeeId(t.id)} haptic={on ? 'none' : 'select'} scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.teeChip, on && styles.on]}>
                      <Text style={[styles.teeName, on && styles.onText]}>{t.name}</Text>
                      <Text style={[styles.teeYards, on && styles.onSub]}>{t.totalYards.toLocaleString('en-US')} yds</Text>
                    </Tap>
                  );
                })}
              </ScrollView>
              <Chips value={holes} onChange={setHoles} options={[{ value: 'all', label: '18 holes' }, { value: 'front', label: 'Front 9' }, { value: 'back', label: 'Back 9' }]} />
            </>
          ) : null}
        </Section>

        {/* Date */}
        <Section title="When">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow} style={styles.hScroll}>
            {days.map((d) => {
              const p = dateParts(d);
              const on = d === date;
              return (
                <Tap key={d} onPress={() => setDate(d)} haptic={on ? 'none' : 'select'} scaleTo={0.94} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${p.weekday} ${p.month} ${p.day}`} style={[styles.day, p.weekend && styles.dayWeekend, on && styles.on]}>
                  <Text style={[styles.dayDow, on && styles.onSub]}>{d === todayISO() ? 'TODAY' : p.dow}</Text>
                  <Text style={[styles.dayNum, on && styles.onText]}>{p.day}</Text>
                  <Text style={[styles.dayMonth, on && styles.onSub]}>{p.month}</Text>
                </Tap>
              );
            })}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow} style={styles.hScroll}>
            {PRESETS.map((t) => {
              const on = t === teeTime;
              return (
                <Tap key={t} onPress={() => setTeeTime(t)} haptic={on ? 'none' : 'select'} scaleTo={0.94} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.timeChip, on && styles.on]}>
                  <Text style={[styles.timeText, on && styles.onText]}>{formatTeeTime(t)}</Text>
                </Tap>
              );
            })}
          </ScrollView>
          <View style={styles.fine}>
            <Tap onPress={() => setTeeTime((t) => shiftTime(t ?? '08:00', -10))} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Ten minutes earlier" style={styles.stepBtn}>
              <Icon name="minus" size={16} color={colors.fairway} />
            </Tap>
            <Text style={styles.fineValue}>{teeTime ? formatTeeTime(teeTime) : 'No tee time'}</Text>
            <Tap onPress={() => setTeeTime((t) => shiftTime(t ?? '08:00', 10))} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Ten minutes later" style={styles.stepBtn}>
              <Icon name="plus" size={16} color={colors.fairway} />
            </Tap>
            <Tap onPress={() => setTeeTime(teeTime ? undefined : '08:00')} haptic="select" scaleTo={0.95} accessibilityRole="button" style={styles.tbd}>
              <Text style={styles.pillText}>{teeTime ? 'TBD' : 'Set time'}</Text>
            </Tap>
          </View>
        </Section>

        {/* Group */}
        <Section title="Who">
          <Chips value={spots} onChange={setSpots} options={GROUPS.map((g) => ({ value: g.value, label: g.label }))} />
          <View style={styles.wrap}>
            {data.friends.map((f) => {
              const on = invite.includes(f.id);
              const already = alreadyIn.has(f.id);
              return (
                <Tap
                  key={f.id}
                  disabled={already}
                  onPress={() => setInvite((w) => (on ? w.filter((x) => x !== f.id) : [...w, f.id]))}
                  haptic="select"
                  scaleTo={0.94}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on || already }}
                  style={[styles.friend, (on || already) && styles.on, already && { opacity: 0.6 }]}>
                  <Avatar player={f} size={28} />
                  <Text style={[styles.friendName, (on || already) && styles.onText]}>{f.name.split(' ')[0]}</Text>
                  {on || already ? <Icon name="check" size={14} color={colors.cream} strokeWidth={2.4} /> : null}
                </Tap>
              );
            })}
          </View>
          {over ? <Text style={styles.warn}>That’s more than a {GROUPS.find((g) => g.value === spots)?.label.toLowerCase()}. Everyone can still accept; first to say yes are in.</Text> : null}
          <Text style={styles.help}>Friends get a notification. You’ll also get a join code to share with anyone else.</Text>
        </Section>

        {/* Details */}
        <Section title="Details">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note: carts, where to meet, the stakes…"
            placeholderTextColor={colors.inkMuted}
            multiline
            maxLength={140}
            style={[styles.input, styles.noteInput]}
            accessibilityLabel="Note"
          />
          <TextInput value={name} onChangeText={setName} placeholder={autoName} placeholderTextColor={colors.inkMuted} maxLength={60} style={styles.input} accessibilityLabel="Name" />
        </Section>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button
          label={busy ? 'Saving…' : editing ? 'Save changes' : invite.length ? `Send ${invite.length} ${invite.length === 1 ? 'invite' : 'invites'}` : 'Schedule round'}
          icon={editing ? undefined : 'calendar'}
          onPress={save}
          disabled={!courseId || busy}
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.fairway },
  content: { paddingHorizontal: space.lg, gap: space.xl, paddingBottom: space.xxl },
  section: { gap: space.md },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.fairway },
  help: { ...type.caption, fontSize: 12, color: colors.inkMuted },
  warn: { ...type.caption, fontSize: 12, color: colors.ink },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  // Ticket
  ticket: { backgroundColor: colors.creamLight, borderRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  ticketTop: { height: 110 },
  ticketArt: { width: '100%', height: '100%', borderRadius: 0 },
  ticketArtEmpty: { backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  dateBlock: { position: 'absolute', right: space.lg, bottom: -28, width: 64, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.creamLight, alignItems: 'center', ...shadow.control },
  dateDow: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.gold },
  dateDay: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 30, color: colors.fairway },
  dateMonth: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.inkMuted },
  ticketBody: { padding: space.lg, paddingTop: space.md, gap: 2 },
  ticketName: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.6, color: colors.gold, paddingRight: 80 },
  ticketCourse: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.fairway, paddingRight: 80 },
  ticketMeta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  ticketNote: { fontFamily: fonts.displayItalic, fontSize: 15, color: colors.ink, marginTop: space.sm },
  slots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  slotFilled: { borderRadius: 19, borderWidth: 2, borderColor: colors.creamLight },
  slotOpen: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  slotText: { ...type.caption, fontSize: 12, color: colors.inkMuted, marginLeft: 4 },
  // Course
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.sm, paddingRight: space.md, ...shadow.card },
  courseThumb: { width: 64, height: 46 },
  courseName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 8 },
  optionThumb: { width: 56, height: 40 },
  optionName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  // Rows of chips
  hScroll: { marginHorizontal: -space.lg },
  hRow: { gap: space.sm, paddingHorizontal: space.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  on: { backgroundColor: colors.fairway },
  onText: { color: colors.cream },
  onSub: { color: colors.goldSoft },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 34, borderRadius: radius.pill, backgroundColor: colors.paper, maxWidth: 170 },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, flexShrink: 1 },
  teeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.paper, alignItems: 'center' },
  teeName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  teeYards: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  day: { width: 56, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.paper, alignItems: 'center', gap: 1 },
  dayWeekend: { backgroundColor: colors.goldSoft },
  dayDow: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  dayNum: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, color: colors.ink },
  dayMonth: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  timeChip: { paddingHorizontal: 14, minHeight: 38, borderRadius: radius.pill, backgroundColor: colors.paper, justifyContent: 'center' },
  timeText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink, fontVariant: ['tabular-nums'] },
  fine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  fineValue: { minWidth: 96, textAlign: 'center', fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink, fontVariant: ['tabular-nums'] },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  tbd: { marginLeft: 'auto', paddingHorizontal: 14, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.paper, justifyContent: 'center' },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, height: 38, borderRadius: radius.pill, backgroundColor: colors.paper },
  friendName: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  input: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  noteInput: { minHeight: 76, paddingTop: 12, textAlignVertical: 'top' },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule, backgroundColor: colors.cream },
});
