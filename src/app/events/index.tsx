import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Animated, enterItem, Tap } from '@/components/motion';
import { EventCard, EventRoundTicket } from '@/components/event-card';
import { Button, Empty, Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import { KIND_LABEL, type EventKind } from '@/domain/competition';
import { todayISO } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { useAuth } from '@/state/auth';
import { useEventLists } from '@/state/events';
import { colors, fonts, radius, space, themed, type } from '@/theme';

const SECTION: Record<EventKind, string> = { league: 'Leagues', tournament: 'Tournaments', outing: 'Scheduled rounds' };

export default function Events() {
  const data = useAppData();
  const auth = useAuth();
  const { invitations, active, upcoming } = useEventLists();
  // Up next: the next few league / tournament rounds (scheduled rounds with friends have their own section).
  const nextRounds = upcoming.filter(({ event }) => event.kind !== 'outing').slice(0, 3);
  // Scheduled rounds: soonest first, past ones after.
  const today = todayISO();
  const outings = active
    .filter((e) => e.kind === 'outing')
    .map((event) => ({ event, round: data.eventRounds.find((r) => r.eventId === event.id) }))
    .filter((x): x is { event: typeof x.event; round: NonNullable<typeof x.round> } => !!x.round)
    .sort((a, b) => (a.round.scheduledOn < today ? 1 : 0) - (b.round.scheduledOn < today ? 1 : 0) || a.round.scheduledOn.localeCompare(b.round.scheduledOn));
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

      {nextRounds.length ? (
        <View style={styles.section}>
          <SectionHeader title="Up next" />
          {nextRounds.map(({ round, event }, i) => (
            <Animated.View key={round.id} entering={enterItem(i)}>
              <EventRoundTicket eventId={event.id} roundId={round.id} withEventName />
            </Animated.View>
          ))}
        </View>
      ) : null}

      {(['league', 'tournament'] as EventKind[]).map((kind) => {
        const list = active.filter((e) => e.kind === kind);
        if (!list.length) return null;
        return (
          <View key={kind} style={styles.section}>
            <SectionHeader title={SECTION[kind]} count={String(list.length)} />
            {list.map((e, i) => (
              <Animated.View key={e.id} entering={enterItem(i)}>
                <EventCard eventId={e.id} />
              </Animated.View>
            ))}
          </View>
        );
      })}

      {outings.length ? (
        <View style={styles.section}>
          <SectionHeader title={SECTION.outing} count={String(outings.length)} />
          {outings.map(({ event, round }, i) => (
            <Animated.View key={event.id} entering={enterItem(i)}>
              <EventRoundTicket eventId={event.id} roundId={round.id} />
            </Animated.View>
          ))}
        </View>
      ) : null}

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
