import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Button, Empty, Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import { FORMAT_LABEL, KIND_LABEL, type CompetitionEvent, type EventKind } from '@/domain/competition';
import { formatDay, formatTeeTime, todayISO } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { useAuth } from '@/state/auth';
import { useEventLists } from '@/state/events';
import { colors, fonts, radius, space, themed, type } from '@/theme';

const KIND_ORDER: EventKind[] = ['league', 'tournament', 'outing'];
const SECTION: Record<EventKind, string> = { league: 'Leagues', tournament: 'Tournaments', outing: 'Scheduled rounds' };

export default function Events() {
  const data = useAppData();
  const auth = useAuth();
  const { invitations, active, upcoming } = useEventLists();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const join = () => act('join', async () => {
    const id = await data.joinEvent(code.trim());
    setCode('');
    router.push(`/event/${id}`);
  });

  return (
    <SheetScreen title="Events" back right={<IconButton name="plus" label="Create an event" onPress={() => router.push('/events/new')} />}>
      {auth.offline ? <Text style={styles.note}>Leagues and events need an account. This is the offline demo.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {invitations.length ? (
        <View style={styles.section}>
          <SectionHeader title="Invitations" count={String(invitations.length)} />
          <Group>
            {invitations.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{e.name}</Text>
                  <Text style={styles.meta}>{KIND_LABEL[e.kind]} · from {data.playerById(e.organizerId)?.name ?? 'a friend'}</Text>
                </View>
                <Small label="Decline" quiet busy={busy === `${e.id}-no`} onPress={() => act(`${e.id}-no`, () => data.respondToEvent(e.id, false))} />
                <Small label="Join" busy={busy === e.id} onPress={() => act(e.id, () => data.respondToEvent(e.id, true))} />
              </View>
            ))}
          </Group>
        </View>
      ) : null}

      {upcoming.length ? (
        <View style={styles.section}>
          <SectionHeader title="Up next" />
          <Group>
            {upcoming.slice(0, 4).map(({ round, event, courseName }) => {
              const today = round.scheduledOn === todayISO();
              return (
                <View key={round.id} style={[styles.row, { paddingVertical: 0, paddingRight: today ? space.lg : 0 }]}>
                  <Tap onPress={() => router.push(`/event/${event.id}/round/${round.id}`)} scaleTo={0.985} accessibilityRole="button" style={styles.rowMain}>
                    <View style={[styles.dateBadge, today && styles.dateBadgeToday]}>
                      <Icon name="calendar" size={16} color={today ? colors.cream : colors.fairway} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.name} numberOfLines={1}>{event.name} · {round.name}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {today ? 'Today' : formatDay(round.scheduledOn)}{round.teeTime ? ` · ${formatTeeTime(round.teeTime)}` : ''} · {courseName}
                      </Text>
                    </View>
                    {today ? null : <Icon name="chevron-right" size={16} color={colors.inkMuted} />}
                  </Tap>
                  {today ? <Small label="Log round" onPress={() => router.push(`/round/new?eventRound=${round.id}`)} /> : null}
                </View>
              );
            })}
          </Group>
        </View>
      ) : null}

      {KIND_ORDER.map((kind) => {
        const list = active.filter((e) => e.kind === kind);
        if (!list.length) return null;
        return (
          <View key={kind} style={styles.section}>
            <SectionHeader title={SECTION[kind]} count={String(list.length)} />
            <Animated.View entering={enterItem(0)}>
              <Group>
                {list.map((e) => <EventRow key={e.id} event={e} />)}
              </Group>
            </Animated.View>
          </View>
        );
      })}

      {!active.length && !invitations.length ? (
        <Empty title="No events yet" body="Start a league, run a tournament, or schedule a round with friends." />
      ) : null}

      <View style={styles.section}>
        <Button label="Schedule a round" icon="calendar" onPress={() => router.push('/schedule')} disabled={auth.offline} />
        <Button variant="secondary" label="Start a league or tournament" icon="trophy" onPress={() => router.push('/events/new')} disabled={auth.offline} />
        <View style={styles.join}>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="Join code"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Join code"
            style={styles.codeInput}
          />
          <Small label="Join" busy={busy === 'join'} disabled={code.length !== 6 || auth.offline} onPress={join} />
        </View>
      </View>
    </SheetScreen>
  );
}

function EventRow({ event }: { event: CompetitionEvent }) {
  const data = useAppData();
  const rounds = data.eventRounds.filter((r) => r.eventId === event.id);
  const today = todayISO();
  const played = rounds.filter((r) => r.scheduledOn < today).length;
  const players = data.eventMembers.filter((m) => m.eventId === event.id && m.status === 'joined').length;
  return (
    <Tap onPress={() => router.push(`/event/${event.id}`)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={event.name} style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>{event.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {event.kind === 'outing' ? formatDay(event.startsOn) : `${FORMAT_LABEL(event.format)} · ${rounds.length ? `${played}/${rounds.length} rounds` : 'no rounds yet'}`} · {players} {players === 1 ? 'player' : 'players'}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={colors.inkMuted} />
    </Tap>
  );
}

function Small({ label, onPress, busy, quiet, disabled }: { label: string; onPress: () => void; busy?: boolean; quiet?: boolean; disabled?: boolean }) {
  return (
    <Tap onPress={onPress} disabled={busy || disabled} haptic={quiet ? 'tap' : 'press'} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={label} style={[styles.small, quiet && styles.smallQuiet, (busy || disabled) && { opacity: 0.5 }]}>
      <Text style={[styles.smallText, quiet && styles.smallTextQuiet]}>{busy ? '…' : label}</Text>
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingRight: space.lg },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  dateBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  dateBadgeToday: { backgroundColor: colors.fairway },
  join: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  codeInput: { flex: 1, height: 46, borderRadius: radius.md, backgroundColor: colors.paper, paddingHorizontal: space.md, fontFamily: fonts.bodySemibold, fontSize: 17, letterSpacing: 3, color: colors.ink, outlineStyle: 'none' } as never,
  small: { paddingHorizontal: 14, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  smallQuiet: { backgroundColor: colors.paper },
  smallText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  smallTextQuiet: { color: colors.ink },
}));
