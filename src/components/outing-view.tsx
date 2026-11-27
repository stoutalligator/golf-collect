/**
 * A scheduled round ("outing") as a tee sheet: ticket with date, tee time, course and the group's slots,
 * RSVP you can change, directions, share, and organizer edit/cancel.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Share, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons';
import { Animated, popIn, Tap } from '@/components/motion';
import { CourseThumb } from '@/components/round-card';
import { Avatar } from '@/components/social';
import { Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import type { Player } from '@/domain/types';
import { formatTeeTime, todayISO } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import type { EventView } from '@/state/events';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

export function OutingView({ view }: { view: EventView }) {
  const data = useAppData();
  const { event } = view;
  const r = view.rounds[0];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!r) return null;
  const d = new Date(`${r.round.scheduledOn}T12:00:00`);
  const course = r.course;
  const tee = course?.tees.find((t) => t.id === r.round.teeId);
  const spots = event.format.spots ?? 0;
  const inPlayers = view.joined;
  const waiting = view.invited;
  const out = view.members.filter((m) => m.status === 'declined').map((m) => m.player).filter((p): p is Player => !!p);
  const me = view.myMembership;
  const isToday = r.round.scheduledOn === todayISO();
  const past = r.round.scheduledOn < todayISO();
  const mine = r.linked.get(data.me.id);

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const when = `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}${r.round.teeTime ? ` at ${formatTeeTime(r.round.teeTime)}` : ''}`;
  const share = () => Share.share({ message: `${event.name}: ${when}, ${r.courseName}. Join on Greens Keeper with code ${event.joinCode}.` }).catch(() => {});
  const directions = () => {
    const loc = course?.location;
    const q = encodeURIComponent(`${r.courseName}${course ? `, ${course.city}, ${course.state}` : ''}`);
    const url = !loc ? `https://maps.google.com/?q=${q}`
      : Platform.OS === 'ios' ? `https://maps.apple.com/?q=${q}&ll=${loc.lat},${loc.lng}`
        : Platform.OS === 'android' ? `geo:${loc.lat},${loc.lng}?q=${q}` : `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SheetScreen title="Tee time" back right={<IconButton name="share" label="Share invite" onPress={share} />}>
      <Animated.View entering={popIn(0, { from: 0.97, duration: 280 })} style={styles.ticket}>
        <View style={styles.art}>
          {course ? <CourseThumb course={course} style={styles.artImg} /> : null}
          <View style={styles.dateBlock}>
            <Text style={styles.dow}>{isToday ? 'TODAY' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
            <Text style={styles.day}>{d.getDate()}</Text>
            <Text style={styles.month}>{d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.kicker} numberOfLines={1}>{event.name}</Text>
          <Tap onPress={() => router.push(`/course/${r.round.courseId}`)} scaleTo={0.99} accessibilityRole="link">
            <Text style={styles.course} numberOfLines={2}>{r.courseName}</Text>
          </Tap>
          <Text style={styles.time}>{r.round.teeTime ? formatTeeTime(r.round.teeTime) : 'Tee time TBD'}</Text>
          <Text style={styles.meta}>
            {tee ? `${tee.name} tees · ${tee.totalYards.toLocaleString('en-US')} yds` : ''}
            {tee ? ' · ' : ''}{course && course.holes.length === 9 ? (r.round.holes === 'all' ? '18 holes (twice around)' : '9 holes') : r.round.holes === 'all' ? '18 holes' : `${r.round.holes === 'front' ? 'Front' : 'Back'} 9`}{view.event.format.team === 'scramble' ? ' · Scramble' : ''}
          </Text>

          <View style={styles.slots}>
            {Array.from({ length: Math.max(spots, inPlayers.length) }, (_, i) => {
              const p = inPlayers[i];
              return p ? (
                <Tap key={p.id} onPress={() => router.push(p.isMe ? '/profile' : `/player/${p.id}`)} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={p.name} style={styles.slotFilled}>
                  <Avatar player={p} size={40} />
                </Tap>
              ) : (
                <View key={`open-${i}`} style={styles.slotOpen}><Icon name="plus" size={16} color={colors.inkMuted} /></View>
              );
            })}
          </View>
          <Text style={styles.meta}>
            {inPlayers.length} in{spots ? ` · ${Math.max(0, spots - inPlayers.length)} ${spots - inPlayers.length === 1 ? 'spot' : 'spots'} open` : ''}
            {waiting.length ? ` · ${waiting.length} waiting to reply` : ''}
          </Text>
          {event.format.note ? <Text style={styles.note}>“{event.format.note}”</Text> : null}
          <Text style={styles.host}>Hosted by {view.isOrganizer ? 'you' : view.organizer?.name ?? 'a friend'}</Text>
        </View>
      </Animated.View>

      {/* RSVP (not for the host) */}
      {!view.isOrganizer && me && !past ? (
        <View style={styles.rsvp}>
          <RsvpButton label="I’m in" icon="check" on={me.status === 'joined'} busy={busy === 'in'} onPress={() => me.status !== 'joined' && act('in', () => data.respondToEvent(event.id, true))} />
          <RsvpButton label="Can’t make it" icon="x" on={me.status === 'declined'} busy={busy === 'out'} onPress={() => me.status !== 'declined' && act('out', () => data.respondToEvent(event.id, false))} quiet />
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Action icon="pin" label="Directions" onPress={directions} />
        <Action icon="share" label="Invite" onPress={share} />
        {view.isOrganizer && !past ? <Action icon="calendar" label="Edit" onPress={() => router.push(`/schedule?event=${event.id}`)} /> : null}
        {(isToday || past) && me?.status === 'joined' ? (
          mine
            ? <Action icon="book" label="Scorecard" onPress={() => router.push(mine.status === 'active' ? `/round/play/${mine.id}` : `/round/${mine.id}`)} />
            : <Action icon="flag" label="Log round" primary onPress={() => router.push(`/round/new?eventRound=${r.round.id}`)} />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="The group" count={`${inPlayers.length}${spots ? `/${spots}` : ''}`} />
        <Group>
          {[...inPlayers.map((p) => ({ p, state: 'In' })), ...waiting.map((p) => ({ p, state: 'Waiting' })), ...out.map((p) => ({ p, state: 'Can’t make it' }))].map(({ p, state }) => {
            const posted = r.linked.get(p.id);
            return (
              <Tap key={p.id} onPress={() => (posted ? router.push(`/round/${posted.id}`) : router.push(p.isMe ? '/profile' : `/player/${p.id}`))} scaleTo={0.99} accessibilityRole="button" style={styles.row}>
                <Avatar player={p} size={34} />
                <Text style={[styles.name, state === 'Can’t make it' && { color: colors.inkMuted }]} numberOfLines={1}>{p.isMe ? 'You' : p.name}{p.id === event.organizerId ? ' · host' : ''}</Text>
                <Text style={[styles.state, state === 'In' && styles.stateIn]}>{posted && posted.status === 'complete' ? 'Posted' : state}</Text>
              </Tap>
            );
          })}
        </Group>
        <Text style={styles.help}>Anyone with code {event.joinCode} can join.</Text>
      </View>

      {view.isOrganizer ? (
        <Tap
          onPress={async () => {
            if (!confirmCancel) return setConfirmCancel(true);
            await act('cancel', () => data.deleteEvent(event.id));
            if (router.canGoBack()) router.back();
            else router.replace('/events');
          }}
          haptic="warning"
          scaleTo={0.97}
          accessibilityRole="button"
          style={styles.cancel}>
          <Text style={styles.cancelText}>{confirmCancel ? 'Tap again to cancel for everyone' : 'Cancel round'}</Text>
        </Tap>
      ) : null}
    </SheetScreen>
  );
}

function RsvpButton({ label, icon, on, busy, onPress, quiet }: { label: string; icon: IconName; on: boolean; busy: boolean; onPress: () => void; quiet?: boolean }) {
  return (
    <Tap onPress={onPress} disabled={busy} haptic={on ? 'none' : quiet ? 'tap' : 'success'} scaleTo={0.96} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.rsvpBtn, on && (quiet ? styles.rsvpOut : styles.rsvpIn)]}>
      <Icon name={icon} size={16} color={on ? colors.cream : colors.fairway} strokeWidth={2.2} />
      <Text style={[styles.rsvpText, on && { color: colors.cream }]}>{busy ? '…' : label}</Text>
    </Tap>
  );
}

function Action({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Tap onPress={onPress} haptic={primary ? 'press' : 'tap'} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={label} style={styles.action}>
      <View style={[styles.actionIcon, primary && styles.actionPrimary]}>
        <Icon name={icon} size={20} color={primary ? colors.cream : colors.fairway} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  help: { ...type.caption, fontSize: 12, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  ticket: { backgroundColor: colors.creamLight, borderRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  art: { height: 140, backgroundColor: colors.paper },
  artImg: { width: '100%', height: '100%', borderRadius: 0 },
  dateBlock: { position: 'absolute', right: space.lg, bottom: -30, width: 68, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.creamLight, alignItems: 'center', ...shadow.control },
  dow: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.gold },
  day: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 32, color: colors.fairway },
  month: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.inkMuted },
  body: { padding: space.lg, paddingTop: space.md, gap: 2 },
  kicker: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.6, color: colors.gold, paddingRight: 84 },
  course: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30, color: colors.fairway, paddingRight: 84 },
  time: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.ink, marginTop: space.sm },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  note: { fontFamily: fonts.displayItalic, fontSize: 16, lineHeight: 22, color: colors.ink, marginTop: space.md },
  host: { ...type.caption, fontSize: 12, color: colors.inkMuted, marginTop: space.md },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.lg, marginBottom: 4 },
  slotFilled: { borderRadius: 22, borderWidth: 2, borderColor: colors.creamLight },
  slotOpen: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' },
  rsvp: { flexDirection: 'row', gap: space.md },
  rsvpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: radius.pill, backgroundColor: colors.creamLight, borderWidth: 1, borderColor: colors.rule },
  rsvpIn: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  rsvpOut: { backgroundColor: colors.inkMuted, borderColor: colors.inkMuted },
  rsvpText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: space.xs },
  action: { alignItems: 'center', gap: 6, minWidth: 72 },
  actionIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.fairway },
  actionLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, paddingHorizontal: space.lg, minHeight: 52 },
  name: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  state: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  stateIn: { fontFamily: fonts.bodySemibold, color: colors.fairway },
  cancel: { alignSelf: 'center', paddingVertical: space.sm, paddingHorizontal: space.lg },
  cancelText: { ...type.caption, fontSize: 13, color: colors.danger, textDecorationLine: 'underline' },
}));
