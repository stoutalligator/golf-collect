import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Button, Card, Chips, Empty, Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import { FORMAT_LABEL, KIND_LABEL, positionLabel } from '@/domain/competition';
import { formatDay, formatTeeTime } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { useEvent, type EventView } from '@/state/events';
import { colors, fonts, radius, space, type } from '@/theme';

type Tab = 'standings' | 'schedule' | 'players';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const view = useEvent(id);
  const [tab, setTab] = useState<Tab>('standings');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!view) return <SheetScreen title="Event" back><Empty title="Event not found" body="It may have been deleted, or you left it." /></SheetScreen>;
  const { event } = view;

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

  const hasStandingsTab = event.kind !== 'outing';
  const current: Tab = hasStandingsTab ? tab : tab === 'standings' ? 'players' : tab;
  const share = () => Share.share({ message: `Join "${event.name}" on Greens Keeper with code ${event.joinCode}` }).catch(() => {});

  return (
    <SheetScreen title={KIND_LABEL[event.kind]} back right={<IconButton name="share" label="Share join code" onPress={share} />}>
      <Card style={styles.hero}>
        <Text style={styles.name}>{event.name}</Text>
        <Text style={styles.meta}>
          {event.kind === 'outing' ? formatDay(event.startsOn) : `${FORMAT_LABEL(event.format)} · ${formatDay(event.startsOn)}${event.endsOn && event.endsOn !== event.startsOn ? ` – ${formatDay(event.endsOn)}` : ''}`}
        </Text>
        <Text style={styles.meta}>Organized by {view.isOrganizer ? 'you' : view.organizer?.name ?? 'a friend'} · {view.joined.length} {view.joined.length === 1 ? 'player' : 'players'}</Text>
        <Tap onPress={share} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`Join code ${event.joinCode}, share`} style={styles.code}>
          <Text style={styles.codeLabel}>JOIN CODE</Text>
          <Text style={styles.codeValue}>{event.joinCode}</Text>
          <Icon name="share" size={16} color={colors.fairway} />
        </Tap>
      </Card>

      {view.myMembership?.status === 'invited' ? (
        <Card style={styles.invite}>
          <Text style={styles.inviteText}>You’re invited. Join to see standings and log rounds for it.</Text>
          <View style={styles.inviteActions}>
            <Button variant="secondary" label="Decline" onPress={() => act('no', () => data.respondToEvent(event.id, false))} style={{ flex: 1 }} />
            <Button label={busy === 'yes' ? 'Joining…' : 'Join'} onPress={() => act('yes', () => data.respondToEvent(event.id, true))} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      {view.next ? <NextUp view={view} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Chips
        value={current}
        onChange={setTab}
        options={[...(hasStandingsTab ? [{ value: 'standings' as Tab, label: 'Standings' }] : []), { value: 'schedule', label: 'Schedule' }, { value: 'players', label: event.kind === 'outing' ? 'Who’s in' : 'Players' }]}
      />

      {current === 'standings' ? <Standings view={view} /> : null}
      {current === 'schedule' ? <Schedule view={view} /> : null}
      {current === 'players' ? <Players view={view} busy={busy} act={act} /> : null}

      {view.isOrganizer ? (
        <Button
          variant="secondary"
          label={confirmDelete ? 'Tap again to delete this event for everyone' : 'Delete event'}
          haptic="warning"
          onPress={async () => {
            if (!confirmDelete) return setConfirmDelete(true);
            await act('delete', () => data.deleteEvent(event.id));
            router.back();
          }}
        />
      ) : view.myMembership?.status === 'joined' ? (
        <Button variant="secondary" label="Leave event" haptic="warning" onPress={async () => { await act('leave', () => data.leaveEvent(event.id)); router.back(); }} />
      ) : null}
    </SheetScreen>
  );
}

function NextUp({ view }: { view: EventView }) {
  const r = view.next!;
  const today = r.status === 'today';
  const posted = r.linked.has(useAppData().me.id);
  return (
    <Card style={styles.next}>
      <Tap onPress={() => router.push(`/event/${view.event.id}/round/${r.round.id}`)} scaleTo={0.985} accessibilityRole="button" style={styles.nextMain}>
        <View style={[styles.calendar, today && styles.calendarToday]}>
          <Icon name="calendar" size={18} color={today ? colors.cream : colors.fairway} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nextTitle}>{today ? 'Today' : 'Up next'} · {r.round.name}</Text>
          <Text style={styles.meta}>{formatDay(r.round.scheduledOn)}{r.round.teeTime ? ` · ${formatTeeTime(r.round.teeTime)}` : ''} · {r.courseName}</Text>
        </View>
      </Tap>
      {today && view.myMembership?.status === 'joined' && !posted ? (
        <Tap onPress={() => router.push(`/round/new?eventRound=${r.round.id}`)} haptic="press" scaleTo={0.94} accessibilityRole="button" style={styles.logBtn}>
          <Text style={styles.logText}>Log round</Text>
        </Tap>
      ) : <Icon name="chevron-right" size={16} color={colors.inkMuted} />}
    </Card>
  );
}

function PlayerCell({ id }: { id: string }) {
  const data = useAppData();
  const p = data.playerById(id);
  return (
    <View style={styles.playerCell}>
      {p ? <Avatar player={p} size={30} /> : null}
      <Text style={styles.playerName} numberOfLines={1}>{p?.isMe ? 'You' : p?.name ?? 'Player'}</Text>
    </View>
  );
}

function Standings({ view }: { view: EventView }) {
  const f = view.event.format;
  const played = view.rounds.filter((r) => r.results.some((x) => x.complete) || r.matches.some((m) => m.finished)).length;
  const empty = <Empty title="No results yet" body="Standings fill in as players log rounds for each event round." />;
  return (
    <View style={styles.section}>
      <Text style={styles.meta}>
        After {played} of {view.rounds.length} {view.rounds.length === 1 ? 'round' : 'rounds'}
        {view.noHandicap.length ? ` · no handicap yet for ${view.noHandicap.map((p) => p.name.split(' ')[0]).join(', ')} (counted as scratch)` : ''}
      </Text>
      {view.season ? (
        view.season.every((r) => r.rounds === 0) ? empty : (
          <Group>
            <Header cols={['Pts', 'Rds', 'Wins']} />
            {view.season.map((r) => (
              <Row key={r.playerId} pos={positionLabel(r)} id={r.playerId} cols={[String(r.points), String(r.rounds), String(r.wins)]} bold={0} />
            ))}
          </Group>
        )
      ) : null}
      {view.leaderboard ? (
        view.leaderboard.length === 0 ? empty : (
          <Group>
            <Header cols={[f.scoring === 'stableford' ? 'Pts' : 'Total', 'Rds']} />
            {view.leaderboard.map((s) => <Row key={s.playerId} pos={positionLabel(s)} id={s.playerId} cols={[String(s.value), String(s.rounds)]} bold={0} />)}
          </Group>
        )
      ) : null}
      {view.matchTable ? (
        view.matchTable.every((r) => r.played === 0) ? empty : (
          <Group>
            <Header cols={['Pts', 'W-L-H']} />
            {view.matchTable.map((r) => <Row key={r.playerId} pos={String(r.position)} id={r.playerId} cols={[String(r.points), `${r.won}-${r.lost}-${r.halved}`]} bold={0} />)}
          </Group>
        )
      ) : null}
      {view.event.kind === 'league' && f.scoring !== 'match' ? (
        <Text style={styles.help}>Points each round by finishing position: {(f.seasonPoints ?? []).slice(0, 6).join(', ')}… Ties split the points.</Text>
      ) : null}
    </View>
  );
}

function Header({ cols }: { cols: string[] }) {
  return (
    <View style={[styles.tableRow, styles.tableHead]}>
      <Text style={[styles.pos, styles.headText]}>#</Text>
      <Text style={[styles.headText, { flex: 1 }]}>Player</Text>
      {cols.map((c) => <Text key={c} style={[styles.col, styles.headText]}>{c}</Text>)}
    </View>
  );
}

function Row({ pos, id, cols, bold }: { pos: string; id: string; cols: string[]; bold: number }) {
  const data = useAppData();
  return (
    <Tap onPress={() => router.push(id === data.me.id ? '/profile' : `/player/${id}`)} scaleTo={0.99} accessibilityRole="button" style={styles.tableRow}>
      <Text style={styles.pos}>{pos}</Text>
      <PlayerCell id={id} />
      {cols.map((c, i) => <Text key={i} style={[styles.col, i === bold && styles.colBold]}>{c}</Text>)}
    </Tap>
  );
}

function Schedule({ view }: { view: EventView }) {
  const data = useAppData();
  return (
    <Group>
      {view.rounds.map((r) => {
        const posted = [...r.linked.values()].filter((x) => x.status === 'complete').length;
        const mine = r.linked.get(data.me.id);
        return (
          <Tap key={r.round.id} onPress={() => router.push(`/event/${view.event.id}/round/${r.round.id}`)} scaleTo={0.985} accessibilityRole="button" style={styles.schedRow}>
            <View style={[styles.calendar, r.status === 'today' && styles.calendarToday]}>
              <Text style={[styles.calDay, r.status === 'today' && { color: colors.cream }]}>{new Date(`${r.round.scheduledOn}T12:00:00`).getDate()}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.schedName}>{r.round.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>{formatDay(r.round.scheduledOn)}{r.round.teeTime ? ` · ${formatTeeTime(r.round.teeTime)}` : ''} · {r.courseName}</Text>
            </View>
            <Text style={styles.schedState}>
              {r.status === 'upcoming' ? '' : `${posted} posted`}{mine ? ' · ✓ you' : ''}
            </Text>
            <Icon name="chevron-right" size={16} color={colors.inkMuted} />
          </Tap>
        );
      })}
    </Group>
  );
}

function Players({ view, busy, act }: { view: EventView; busy: string | null; act: (k: string, fn: () => Promise<unknown>) => Promise<void> }) {
  const data = useAppData();
  const inEvent = new Set(view.members.map((m) => m.playerId));
  const invitable = data.friends.filter((f) => !inEvent.has(f.id));
  return (
    <View style={styles.section}>
      <Group>
        {view.members.filter((m) => m.status !== 'declined').map((m) => (
          <View key={m.playerId} style={styles.tableRow}>
            <PlayerCell id={m.playerId} />
            <Text style={styles.help}>{m.role === 'organizer' ? 'Organizer' : m.status === 'invited' ? 'Invited' : 'In'}</Text>
          </View>
        ))}
      </Group>
      {view.isOrganizer && invitable.length ? (
        <>
          <SectionHeader title="Invite friends" />
          <View style={styles.wrap}>
            {invitable.map((f) => (
              <Tap key={f.id} onPress={() => act(`inv-${f.id}`, () => data.inviteToEvent(view.event.id, [f.id]))} haptic="press" scaleTo={0.94} accessibilityRole="button" accessibilityLabel={`Invite ${f.name}`} style={styles.friend}>
                <Avatar player={f} size={26} />
                <Text style={styles.friendText}>{busy === `inv-${f.id}` ? '…' : f.name.split(' ')[0]}</Text>
                <Icon name="plus" size={14} color={colors.fairway} />
              </Tap>
            ))}
          </View>
        </>
      ) : null}
      <Text style={styles.help}>Anyone with the join code {view.event.joinCode} can join.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  hero: { padding: space.lg, gap: 4 },
  name: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32, color: colors.fairway },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  help: { ...type.caption, fontSize: 12, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  code: { flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start', marginTop: space.sm, paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.paper },
  codeLabel: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.inkMuted },
  codeValue: { fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 3, color: colors.ink },
  invite: { padding: space.lg, gap: space.md },
  inviteText: { ...type.body, color: colors.ink },
  inviteActions: { flexDirection: 'row', gap: space.md },
  next: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  nextMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  nextTitle: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  calendar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  calendarToday: { backgroundColor: colors.fairway },
  calDay: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.fairway },
  logBtn: { paddingHorizontal: 14, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.fairway, justifyContent: 'center' },
  logText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10, paddingHorizontal: space.lg, minHeight: 48 },
  tableHead: { minHeight: 36, paddingVertical: 8 },
  headText: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.6, color: colors.inkMuted },
  pos: { width: 26, fontFamily: fonts.displayBold, fontSize: 15, color: colors.gold },
  playerCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  playerName: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  col: { width: 52, textAlign: 'right', fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  colBold: { fontFamily: fonts.bodySemibold, color: colors.ink, fontSize: 15 },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  schedName: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  schedState: { ...type.caption, color: colors.inkMuted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, height: 36, borderRadius: radius.pill, backgroundColor: colors.paper },
  friendText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
});
