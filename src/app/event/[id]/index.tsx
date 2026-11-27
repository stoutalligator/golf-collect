import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { EventCard, EventRoundTicket } from '@/components/event-card';
import { OutingView } from '@/components/outing-view';
import { Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Button, Card, Chips, Empty, Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import { KIND_LABEL, positionLabel } from '@/domain/competition';
import { useAppData } from '@/state/app-data';
import { useEvent, type EventView } from '@/state/events';
import { colors, fonts, radius, space, themed, type } from '@/theme';

type Tab = 'standings' | 'schedule' | 'players';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const view = useEvent(id);
  const [picked, setTab] = useState<Tab | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A brand-new league has nothing to stand on yet: open on its (empty) schedule. Decided once, so adding the
  // first round doesn't switch tabs under you.
  if (view && picked === null) setTab(view.rounds.length ? 'standings' : 'schedule');
  const tab: Tab = picked ?? 'standings';

  if (!view) return <SheetScreen title="Event" back><Empty title="Event not found" body="It may have been deleted, or you left it." /></SheetScreen>;
  if (view.event.kind === 'outing') return <OutingView view={view} />;
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
      <EventCard eventId={event.id} header />

      {view.myMembership?.status === 'invited' ? (
        <Card style={styles.invite}>
          <Text style={styles.inviteText}>You’re invited. Join to see standings and log rounds for it.</Text>
          <View style={styles.inviteActions}>
            <Button variant="secondary" label="Decline" onPress={() => act('no', () => data.respondToEvent(event.id, false))} style={{ flex: 1 }} />
            <Button label={busy === 'yes' ? 'Joining…' : 'Join'} onPress={() => act('yes', () => data.respondToEvent(event.id, true))} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      {view.next ? (
        <View style={styles.section}>
          <SectionHeader title={view.next.status === 'today' ? 'Today' : 'Up next'} />
          <EventRoundTicket eventId={event.id} roundId={view.next.round.id} compact={false} />
        </View>
      ) : null}
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
            if (router.canGoBack()) router.back();
            else router.replace('/events');
          }}
        />
      ) : view.myMembership?.status === 'joined' ? (
        <Button variant="secondary" label="Leave event" haptic="warning" onPress={async () => { await act('leave', () => data.leaveEvent(event.id)); if (router.canGoBack()) router.back(); else router.replace('/events'); }} />
      ) : null}
    </SheetScreen>
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
        {view.rounds.length ? `After ${played} of ${view.rounds.length} ${view.rounds.length === 1 ? 'round' : 'rounds'}` : 'No rounds scheduled yet'}
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
  const add = view.isOrganizer ? (
    <Button label="Schedule a round" icon="calendar" onPress={() => router.push(`/schedule?into=${view.event.id}`)} />
  ) : null;
  if (!view.rounds.length) {
    return (
      <View style={styles.section}>
        <Empty
          title="No rounds yet"
          body={view.isOrganizer ? 'Schedule a round whenever the group has a date. Each one counts toward the standings.' : 'The organizer hasn’t scheduled a round yet. You’ll get a notification when they do.'}
        />
        {add}
      </View>
    );
  }
  // Coming up soonest first, then what's been played (latest first).
  const coming = view.rounds.filter((r) => r.status !== 'past');
  const played = view.rounds.filter((r) => r.status === 'past').reverse();
  return (
    <View style={styles.section}>
      {add}
      {coming.length ? <Text style={styles.listLabel}>COMING UP</Text> : null}
      {coming.map((r) => <EventRoundTicket key={r.round.id} eventId={view.event.id} roundId={r.round.id} />)}
      {played.length ? <Text style={styles.listLabel}>PLAYED</Text> : null}
      {played.map((r) => <EventRoundTicket key={r.round.id} eventId={view.event.id} roundId={r.round.id} />)}
    </View>
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

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  listLabel: { ...type.label, color: colors.inkMuted, marginTop: space.sm },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  help: { ...type.caption, fontSize: 12, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  invite: { padding: space.lg, gap: space.md },
  inviteText: { ...type.body, color: colors.ink },
  inviteActions: { flexDirection: 'row', gap: space.md },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10, paddingHorizontal: space.lg, minHeight: 48 },
  tableHead: { minHeight: 36, paddingVertical: 8 },
  headText: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.6, color: colors.inkMuted },
  pos: { width: 26, fontFamily: fonts.displayBold, fontSize: 15, color: colors.gold },
  playerCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  playerName: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  col: { width: 52, textAlign: 'right', fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  colBold: { fontFamily: fonts.bodySemibold, color: colors.ink, fontSize: 15 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 12, height: 36, borderRadius: radius.pill, backgroundColor: colors.paper },
  friendText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
}));
