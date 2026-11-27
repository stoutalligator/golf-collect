import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Collectible, SceneImage } from '@/art/components';
import { Icon } from '@/components/icons';
import { Avatar } from '@/components/social';
import { Button, Chips, IconButton, Loading, SearchField } from '@/components/ui';
import { formatMiles, nearest } from '@/domain/geo';
import { roundGroupKey, roundOwner, type Round, type RoundKind } from '@/domain/types';
import { addDaysISO, formatDay, todayISO } from '@/lib/format';
import { uuid } from '@/lib/ids';
import { useLocation } from '@/lib/location';
import { shortCourseName } from '@/lib/names';
import { useAppData, useCourse } from '@/state/app-data';
import { linkableEventRounds, liveEventGroup } from '@/state/events';
import { isNineHole, playLayout } from '@/domain/layout';
import { colors, fonts, radius, space, themed, type } from '@/theme';
import { Tap } from '@/components/motion';

type Holes = '18' | 'front' | 'back';
/** Play now, log one you've already played, or plan one. */
type When = 'now' | 'earlier' | 'later';

/** How far back "Earlier" lets you pick a date. */
const PAST_DAYS = 120;
const dayParts = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
};

export default function NewRound() {
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const params = useLocalSearchParams<{ courseId?: string; eventRound?: string; join?: string; when?: 'earlier'; start?: string }>();
  // Joining a friend's round: log your own round in the same group, same course, holes and day.
  const joinRound = params.join ? data.roundById(params.join) : undefined;
  const joinOwner = joinRound ? data.playerById(roundOwner(joinRound)) : undefined;
  // Opened from an event round: start from its course, tee and holes, and count toward it.
  const fromEvent = params.eventRound ? data.eventRounds.find((r) => r.id === params.eventRound) : undefined;
  const [kind, setKind] = useState<RoundKind>('course');
  // Individual stroke play, or a team scramble (one team score; never counts toward stats, collectibles or badges).
  const [format, setFormat] = useState<'individual' | 'scramble'>('individual');
  const [when, setWhen] = useState<When>(params.when === 'earlier' ? 'earlier' : 'now');
  const [playedOn, setPlayedOn] = useState(todayISO());
  const pastDays = useMemo(() => Array.from({ length: PAST_DAYS }, (_, i) => addDaysISO(todayISO(), -i)), []);
  const date = when === 'earlier' ? playedOn : todayISO();
  const [courseId, setCourseId] = useState<string | undefined>(fromEvent?.courseId ?? params.courseId);
  const [teeId, setTeeId] = useState<string | undefined>(fromEvent?.teeId);
  const [holes, setHoles] = useState<Holes>(fromEvent?.holes === 'front' ? 'front' : fromEvent?.holes === 'back' ? 'back' : '18');
  const [eventRoundId, setEventRoundId] = useState<string | undefined>(fromEvent?.id);
  const [withIds, setWithIds] = useState<string[]>([]);
  // With friends along: keep everyone's card on this phone (each player gets their own round) or just yours.
  const [scoring, setScoring] = useState<'group' | 'me'>('group');
  // Apply the event round once (format, partners), including when its data arrives after the first render.
  const [appliedEvent, setAppliedEvent] = useState<string | undefined>();
  if (fromEvent && appliedEvent !== fromEvent.id) {
    setAppliedEvent(fromEvent.id);
    setCourseId(fromEvent.courseId);
    setTeeId(fromEvent.teeId);
    setHoles(fromEvent.holes === 'front' ? 'front' : fromEvent.holes === 'back' ? 'back' : '18');
    setEventRoundId(fromEvent.id);
    // Logging a scheduled round that's already gone by: default to the day it was scheduled.
    if (params.when === 'earlier' && fromEvent.scheduledOn < todayISO() && fromEvent.scheduledOn >= addDaysISO(todayISO(), -(PAST_DAYS - 1))) setPlayedOn(fromEvent.scheduledOn);
    const ev = data.events.find((e) => e.id === fromEvent.eventId);
    if (ev?.format.team === 'scramble') setFormat('scramble');
    // A round with friends (or a scramble): the others who are in come along as your playing partners.
    if (ev && (ev.kind === 'outing' || ev.format.team === 'scramble')) {
      setWithIds(data.eventMembers.filter((m) => m.eventId === ev.id && m.status === 'joined' && m.playerId !== data.me.id).map((m) => m.playerId));
      if (params.start) setScoring('me');
    }
  }
  const [appliedJoin, setAppliedJoin] = useState<string | undefined>();
  if (joinRound && appliedJoin !== joinRound.id) {
    setAppliedJoin(joinRound.id);
    setKind('course');
    setCourseId(joinRound.courseId);
    setTeeId(joinRound.teeId);
    const first = joinRound.holeNumbers[0] ?? 1;
    setHoles(joinRound.holeNumbers.length >= 18 ? '18' : first >= 10 ? 'back' : 'front');
    // A round in progress today: tee off now, live. Otherwise log it for the day they played.
    setWhen(joinRound.status === 'active' && joinRound.date === todayISO() ? 'now' : 'earlier');
    setPlayedOn(joinRound.date);
    setEventRoundId(undefined);
  }
  const [query, setQuery] = useState('');
  const [starting, setStarting] = useState(false);
  const toggleWith = (id: string) => setWithIds((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  // Scramble teams: how many, and who's on which (you included). Unassigned players alternate between teams.
  const [teamCount, setTeamCount] = useState(1);
  const [assigned, setAssigned] = useState<Record<string, number>>({});

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = kind === 'course'
      ? data.courseIndex.map((c) => ({ id: c.id, name: c.name, sub: `${c.city}, ${c.state}` }))
      : data.simCourses.map((c) => ({ id: c.id, name: c.name, sub: c.platform ?? 'Simulator' }));
    return list.filter((o) => !q || o.name.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q));
  }, [kind, data.courseIndex, data.simCourses, query]);

  // Courses near you first (no search typed yet); ask for location only while picking a real course.
  const picking = kind === 'course' && !courseId;
  const loc = useLocation(picking);
  const nearby = useMemo(() => (loc.status === 'ready' ? nearest(data.courseIndex, loc.here, { limit: 8, maxMiles: 60 }) : []), [loc, data.courseIndex]);
  const recent = useMemo(() => {
    const ids = [...new Set([data.me.homeCourseId, ...data.roundsByDate.filter((r) => r.kind === 'course').map((r) => r.courseId)].filter((x): x is string => !!x))];
    const shown = new Set(nearby.map((c) => c.id));
    return ids.filter((id) => !shown.has(id)).map((id) => data.courseSummary(id)).filter((c) => !!c).slice(0, 5);
  }, [data, nearby]);

  const { course: loaded, loading: courseLoading, missing: courseMissing } = useCourse(kind === 'course' ? courseId : undefined);
  const course = kind === 'course' ? loaded : undefined;
  const sim = kind === 'sim' && courseId ? data.simCourseById(courseId) : undefined;
  const layout = course ?? sim;
  const scramble = kind === 'course' && format === 'scramble' && !joinRound;
  // Scrambles only count toward scheduled scramble rounds; individual rounds never toward those.
  const nearbyEvents = kind === 'course'
    ? linkableEventRounds(data, courseId, date).filter((l) => (l.event.format.team === 'scramble') === scramble)
    : [];
  // Started from a scheduled round: it always counts toward that round, whatever day you actually play it.
  const fromEventLink = fromEvent && fromEvent.courseId === courseId && kind === 'course' ? data.events.find((e) => e.id === fromEvent.eventId) : undefined;
  const linkable = fromEventLink && !nearbyEvents.some((l) => l.round.id === fromEvent!.id)
    ? [{ round: fromEvent!, event: fromEventLink }, ...nearbyEvents]
    : nearbyEvents;
  // A friend already teed off for this scheduled round: start in their group so you see each other live.
  const liveGroup = fromEvent && when === 'now' ? liveEventGroup(data, fromEvent.id) : undefined;
  const selectedTee = course ? (teeId ?? course.tees[Math.min(1, course.tees.length - 1)]?.id) : undefined;

  // Team roster (index 0 = Team 1). Everyone playing: you plus the friends you picked.
  const roster = [data.me.id, ...withIds];
  const teams = scramble ? Math.max(1, Math.min(teamCount, roster.length)) : 1;
  const teamFor = (pid: string) => {
    const t = assigned[pid];
    return t && t <= teams ? t : (roster.indexOf(pid) % teams) + 1;
  };
  const teamRoster = Array.from({ length: teams }, (_, t) => roster.filter((pid) => teamFor(pid) === t + 1));

  const start = async () => {
    if (when === 'later') {
      router.replace(courseId && kind === 'course' ? `/schedule?courseId=${courseId}` : '/schedule');
      return;
    }
    if (!layout || starting) return;
    const all = playLayout(layout).holes.map((h) => h.number); // 9-hole courses: 18 = twice around
    const effective = isNineHole(layout) && holes === 'back' ? 'front' : holes;
    const holeNumbers = effective === '18' ? all : effective === 'front' ? all.slice(0, 9) : all.slice(9, 18);
    const now = new Date().toISOString();
    const group = !joinRound && !scramble && scoring === 'group' && withIds.length > 0;
    // Any round with friends forms a group, so friends on their own phones can join and everyone sees live scores.
    const groupId = joinRound ? roundGroupKey(joinRound) : liveGroup && !scramble ? roundGroupKey(liveGroup) : withIds.length > 0 && !scramble ? uuid() : undefined;
    const linkTo = kind === 'course' && eventRoundId && linkable.some((l) => l.round.id === eventRoundId) ? eventRoundId : undefined;
    const linkEvent = linkTo ? data.eventRounds.find((r) => r.id === linkTo)?.eventId : undefined;
    const inEvent = (id: string) => !!linkEvent && data.eventMembers.some((m) => m.eventId === linkEvent && m.playerId === id && m.status === 'joined');
    const everyone = [data.me.id, ...withIds];
    const roundFor = (owner: string): Round => ({
      id: uuid(),
      kind,
      courseId: layout.id,
      teeId: selectedTee,
      date,
      status: 'active',
      holeNumbers,
      playerIds: [owner, ...everyone.filter((p) => p !== owner)],
      scores: { [owner]: holeNumbers.map(() => null) },
      createdAt: now,
      ...(owner === data.me.id ? {} : { ownerId: owner, scoredBy: data.me.id }),
      ...(groupId ? { groupId } : {}),
      ...(scramble ? { format: 'scramble' as const } : {}),
      // A friend's round counts toward the event only if they're in it too.
      ...(linkTo && (owner === data.me.id || inEvent(owner)) ? { eventRoundId: linkTo } : {}),
    });
    if (scramble && teams > 1) {
      // One card per team in one group. Your team's card is yours; each other team's card belongs to its first
      // player and you keep it. createdAt is staggered so "Team 1, Team 2…" read the same on every phone.
      const gid = uuid();
      const base = Date.parse(now);
      const cards = teamRoster.flatMap((members, t) => {
        if (!members.length) return [];
        const owner = members.includes(data.me.id) ? data.me.id : members[0];
        return [{
          id: uuid(), kind, courseId: layout.id, teeId: selectedTee, date, status: 'active' as const, holeNumbers,
          playerIds: [owner, ...members.filter((p) => p !== owner)],
          scores: { [owner]: holeNumbers.map(() => null) },
          createdAt: new Date(base + t).toISOString(),
          ...(owner === data.me.id ? {} : { ownerId: owner, scoredBy: data.me.id }),
          groupId: gid, format: 'scramble' as const,
          ...(linkTo ? { eventRoundId: linkTo } : {}),
        } satisfies Round];
      });
      const mineCard = cards.find((c) => !c.ownerId)!;
      setStarting(true);
      try {
        // Queued: starting works with no signal; the cards upload in order in the background.
        await data.queueRounds([...cards.filter((c) => c !== mineCard), mineCard]);
        router.replace(`/round/play/${mineCard.id}`);
      } finally {
        setStarting(false);
      }
      return;
    }
    const mine = roundFor(data.me.id);
    setStarting(true);
    try {
      // Friends' scored rounds first, so nobody you're scoring for gets a "join this round" prompt.
      // Queued (works with no signal). Friends' scored rounds first, so nobody you're scoring for gets a
      // "join this round" prompt.
      await data.queueRounds(group ? [...withIds.map(roundFor), mine] : [mine]);
      router.replace(`/round/play/${mine.id}`);
    } finally {
      setStarting(false);
    }
  };

  // "Start now" on a scheduled round: tee off as soon as the scorecard is loaded. Scrambles stop here for team setup.
  const autoStart = !!params.start && !!fromEvent && !scramble && format === 'individual' && !courseMissing;
  const autoFired = useRef(false);
  useEffect(() => {
    if (!autoStart || autoFired.current || !course || appliedEvent !== fromEvent?.id) return;
    autoFired.current = true;
    void start();
  });
  if (autoStart) return <View style={[styles.root, { justifyContent: 'center' }]}><Loading label="Teeing off…" /></View>;

  return (
    <View style={[styles.root, { paddingTop: insets.top || space.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{joinRound ? 'Add your scores' : 'Log a Round'}</Text>
        <IconButton name="x" label="Close" onPress={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {joinRound ? (
          <View style={styles.joinBanner}>
            {joinOwner ? <Avatar player={joinOwner} size={36} /> : null}
            <Text style={[styles.note, { flex: 1, color: colors.ink }]}>
              {joinRound.status === 'active' && joinRound.date === todayISO()
                ? `${joinOwner?.name.split(' ')[0] ?? 'A friend'} teed off at ${data.roundCourseName(joinRound)}. Keep your own score on your phone; you'll see each other's scores live as you play.`
                : `You played with ${joinOwner?.name.split(' ')[0] ?? 'a friend'} at ${data.roundCourseName(joinRound)} on ${formatDay(joinRound.date)}. Enter your own scores hole by hole; your round shows up next to theirs.`}
            </Text>
          </View>
        ) : null}
        {joinRound ? null : (
        <>
        <Chips
          value={kind}
          onChange={(k) => { setKind(k); setCourseId(undefined); setTeeId(undefined); if (k === 'sim' && when === 'later') setWhen('now'); }}
          options={[{ value: 'course', label: 'On the course' }, { value: 'sim', label: 'Simulator' }]}
        />
        {kind === 'sim' ? <Text style={styles.note}>Sim rounds count toward sim stats and sim badges only, never real-course collectibles.</Text> : null}

        </>
        )}
        {joinRound ? null : <Text style={styles.label}>When</Text>}
        {joinRound ? null : <Chips
          value={when}
          onChange={setWhen}
          options={[
            { value: 'now' as When, label: 'Play now' },
            { value: 'earlier' as When, label: 'Already played' },
            ...(kind === 'course' ? [{ value: 'later' as When, label: 'Schedule' }] : []),
          ]}
        />}
        {when === 'earlier' && !joinRound ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days} style={styles.daysScroll}>
              {pastDays.map((d) => {
                const p = dayParts(d);
                const on = d === playedOn;
                const label = d === todayISO() ? 'TODAY' : d === addDaysISO(todayISO(), -1) ? 'YDAY' : p.dow;
                return (
                  <Tap key={d} onPress={() => setPlayedOn(d)} haptic={on ? 'none' : 'select'} scaleTo={0.94} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={formatDay(d)} style={[styles.day, on && styles.dayOn]}>
                    <Text style={[styles.dayDow, on && styles.dayOnSub]}>{label}</Text>
                    <Text style={[styles.dayNum, on && styles.dayOnText]}>{p.day}</Text>
                    <Text style={[styles.dayMonth, on && styles.dayOnSub]}>{p.month}</Text>
                  </Tap>
                );
              })}
            </ScrollView>
            <Text style={styles.note}>Played {playedOn === todayISO() ? 'today' : formatDay(playedOn)}. You’ll enter it hole by hole; it counts toward stats, collectibles and badges on that date.</Text>
          </>
        ) : when === 'later' ? (
          <Text style={styles.note}>Pick a date and tee time, and invite friends, on the next screen.</Text>
        ) : null}

        {layout ? (
          <Tap haptic="select" scaleTo={0.98} style={styles.selected} disabled={!!joinRound} onPress={() => setCourseId(undefined)} accessibilityRole="button" accessibilityLabel="Change course">
            {course ? (
              <Collectible courseId={course.id} region={course.region} kind="ball-marker" tier={data.collections.get(course.id)?.tier?.tier} label={shortCourseName(course.name)} size={52} />
            ) : <SceneImage seed={layout.id} style={styles.selectedThumb} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{layout.name}</Text>
              <Text style={styles.sub}>{isNineHole(layout) ? '9 holes · ' : ''}Par {layout.holes.reduce((s, h) => s + h.par, 0)}{joinRound ? '' : ' · tap to change'}</Text>
            </View>
            <Icon name="check" size={20} color={colors.fairway} />
          </Tap>
        ) : courseLoading ? (
          <Loading label="Loading scorecard…" />
        ) : (
          <>
            <SearchField value={query} onChange={setQuery} placeholder={kind === 'course' ? 'Search courses or towns...' : 'Search sim courses...'} />
            {kind === 'course' && !query.trim() ? (
              <>
                <Text style={styles.label}>Near you</Text>
                {loc.status === 'loading' ? (
                  <Loading label="Finding courses near you…" />
                ) : loc.status === 'denied' ? (
                  <View style={styles.locNote}>
                    <Icon name="pin" size={18} color={colors.fairway} />
                    <Text style={[styles.note, { flex: 1 }]}>Turn on location to see the courses around you. Or search above.</Text>
                    <Tap haptic="tap" onPress={() => (loc.canAskAgain ? loc.retry() : Linking.openSettings())} accessibilityRole="button" hitSlop={8}>
                      <Text style={styles.link}>{loc.canAskAgain ? 'Turn on' : 'Settings'}</Text>
                    </Tap>
                  </View>
                ) : loc.status === 'unavailable' ? (
                  <View style={styles.locNote}>
                    <Icon name="pin" size={18} color={colors.inkMuted} />
                    <Text style={[styles.note, { flex: 1 }]}>Couldn’t get your location right now. Search above.</Text>
                    <Tap haptic="tap" onPress={loc.retry} accessibilityRole="button" hitSlop={8}><Text style={styles.link}>Try again</Text></Tap>
                  </View>
                ) : nearby.length === 0 ? (
                  <Text style={styles.note}>No courses we know of within 60 miles yet. Search above.</Text>
                ) : (
                  nearby.map((c) => (
                    <Tap key={c.id} haptic="select" scaleTo={0.985} dim onPress={() => setCourseId(c.id)} style={styles.option} accessibilityRole="button" accessibilityLabel={`${c.name}, ${formatMiles(c.miles)} away`}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionName}>{c.name}</Text>
                        <Text style={styles.sub}>{c.city}, {c.state}{c.holeCount === 9 ? ' · 9 holes' : ''}</Text>
                      </View>
                      <Text style={styles.miles}>{formatMiles(c.miles)}</Text>
                      <Icon name="chevron-right" size={16} color={colors.inkMuted} />
                    </Tap>
                  ))
                )}
                {recent.length ? (
                  <>
                    <Text style={styles.label}>Your courses</Text>
                    {recent.map((c) => (
                      <Tap key={c.id} haptic="select" scaleTo={0.985} dim onPress={() => setCourseId(c.id)} style={styles.option} accessibilityRole="button">
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionName}>{c.name}</Text>
                          <Text style={styles.sub}>{c.id === data.me.homeCourseId ? 'Home course · ' : ''}{c.city}, {c.state}</Text>
                        </View>
                        {loc.status === 'ready' ? <Text style={styles.miles}>{formatMiles(nearest([c], loc.here, { limit: 1, maxMiles: 100000 })[0]?.miles ?? 0)}</Text> : null}
                        <Icon name="chevron-right" size={16} color={colors.inkMuted} />
                      </Tap>
                    ))}
                  </>
                ) : null}
              </>
            ) : null}
            {kind === 'course' && !query.trim() ? null : options.length > 50 ? <Text style={styles.note}>Showing 50 of {options.length.toLocaleString('en-US')}. Type to narrow it down.</Text> : null}
            {(kind === 'course' && !query.trim() ? [] : options.slice(0, 50)).map((o) => (
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

        {course && when !== 'later' ? (
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

        {layout && when !== 'later' ? (
          <>
            <Text style={styles.label}>Holes</Text>
            <Chips
              value={isNineHole(layout) && holes === 'back' ? 'front' : holes}
              onChange={setHoles}
              options={isNineHole(layout)
                ? [{ value: 'front', label: '9 holes' }, { value: '18', label: '18 · twice around' }]
                : [{ value: '18', label: '18 holes' }, { value: 'front', label: 'Front 9' }, { value: 'back', label: 'Back 9' }]}
            />

            {kind === 'course' && !joinRound ? (
              <>
                <Text style={styles.label}>Format</Text>
                <Chips
                  value={format}
                  onChange={(f) => { setFormat(f); setEventRoundId(undefined); }}
                  options={[{ value: 'individual' as const, label: 'Individual' }, { value: 'scramble' as const, label: 'Scramble' }]}
                />
                {scramble ? (
                  <Text style={styles.note}>One team score per hole. It shows in your team’s feeds, but doesn’t count toward handicap, stats, collectibles or badges.</Text>
                ) : null}
              </>
            ) : null}

            {linkable.length ? (
              <>
                <Text style={styles.label}>Counts toward</Text>
                <View style={styles.friends}>
                  {[{ id: undefined, label: 'Just a round' }, ...linkable.map((l) => ({ id: l.round.id as string | undefined, label: `${l.event.name} · ${l.round.name}` }))].map((o) => {
                    const on = o.id === eventRoundId;
                    return (
                      <Tap key={o.id ?? 'none'} haptic="select" scaleTo={0.95} onPress={() => setEventRoundId(o.id)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.friend, { paddingLeft: 12 }, on && styles.friendOn]}>
                        <Text style={[styles.friendName, on && { color: colors.cream }]} numberOfLines={1}>{o.label}</Text>
                      </Tap>
                    );
                  })}
                </View>
              </>
            ) : null}

            {joinRound ? null : (
            <>
            {scramble ? (
              <>
                <Text style={styles.label}>Teams</Text>
                <Chips
                  value={String(teamCount)}
                  onChange={(v) => setTeamCount(Number(v))}
                  options={['1', '2', '3', '4'].map((v) => ({ value: v, label: v === '1' ? '1 team' : `${v} teams` }))}
                />
              </>
            ) : null}
            <Text style={styles.label}>{scramble ? (teams > 1 ? 'Who’s playing' : 'Your team') : 'Playing with'}</Text>
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
            {scramble && teams > 1 ? (
              <View style={styles.teamBox}>
                {roster.map((pid) => {
                  const p = pid === data.me.id ? data.me : data.playerById(pid);
                  if (!p) return null;
                  return (
                    <View key={pid} style={styles.teamRow}>
                      <Avatar player={p} size={30} />
                      <Text style={styles.teamName} numberOfLines={1}>{pid === data.me.id ? 'You' : p.name.split(' ')[0]}</Text>
                      <View style={styles.teamPick}>
                        {Array.from({ length: teams }, (_, t) => {
                          const on = teamFor(pid) === t + 1;
                          return (
                            <Tap key={t} haptic={on ? 'none' : 'select'} scaleTo={0.9} onPress={() => setAssigned((a) => ({ ...a, [pid]: t + 1 }))} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${pid === data.me.id ? 'You' : p.name}: Team ${t + 1}`} style={[styles.teamChip, on && styles.friendOn]}>
                              <Text style={[styles.teamChipText, on && { color: colors.cream }]}>{t + 1}</Text>
                            </Tap>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                <Text style={styles.note}>
                  {teamRoster.map((m, t) => `Team ${t + 1}: ${m.length ? m.map((pid) => (pid === data.me.id ? 'you' : data.playerById(pid)?.name.split(' ')[0])).join(', ') : 'nobody yet'}`).join(' · ')}.
                  {' '}One card per team; anyone can enter any team’s score while you play.
                </Text>
              </View>
            ) : scramble ? (
              <Text style={styles.note}>{withIds.length ? `Team of ${withIds.length + 1}. One card for the team; teammates can enter scores from their phones too.` : 'Add your teammates.'}</Text>
            ) : withIds.length ? (
              <>
                <Chips
                  value={scoring}
                  onChange={setScoring}
                  options={[{ value: 'group', label: 'Keep everyone’s score' }, { value: 'me', label: 'Just mine' }]}
                />
                <Text style={styles.note}>
                  {scoring === 'group'
                    ? `You’ll enter strokes for the whole group. ${withIds.length === 1 ? 'Your friend gets their' : 'Each friend gets their own'} round, stats and collectibles, and a notification.`
                    : 'Tagged friends see the round in their feed. You keep score for yourself.'}
                </Text>
              </>
            ) : (
              <Text style={styles.note}>Add friends to keep the whole group’s score on this phone.</Text>
            )}
            </>
            )}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button
          label={starting ? 'Setting up…' : when === 'later' ? 'Pick a date & time' : when === 'earlier' ? 'Enter scores' : 'Tee Off'}
          icon={when === 'later' ? 'calendar' : 'flag'}
          onPress={start}
          disabled={(when !== 'later' && !layout) || starting}
        />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
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
  daysScroll: { marginHorizontal: -space.lg },
  days: { gap: space.sm, paddingHorizontal: space.lg },
  day: { width: 56, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.paper, alignItems: 'center', gap: 1 },
  dayOn: { backgroundColor: colors.fairway },
  dayDow: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  dayNum: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 26, color: colors.ink },
  dayMonth: { fontFamily: fonts.bodyMedium, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  dayOnText: { color: colors.cream },
  dayOnSub: { color: colors.goldSoft },
  locNote: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  link: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  miles: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted, marginRight: space.sm, fontVariant: ['tabular-nums'] },
  teamBox: { gap: space.sm, backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  teamName: { flex: 1, fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  teamPick: { flexDirection: 'row', gap: 6 },
  teamChip: { width: 38, height: 34, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  teamChipText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  joinBanner: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.tint },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule },
  startButton: { backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  startText: { fontFamily: fonts.bodySemibold, fontSize: 17, color: colors.cream },
}));
