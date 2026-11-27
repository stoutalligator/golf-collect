/**
 * Friends: three tabs.
 * - Friends: who you're friends with, newest activity first.
 * - Requests: received (accept / decline) and sent (cancel).
 * - Find: search by name or @username, people you may know (leagues, events, rounds you were tagged in), and an
 *   invite to share your username.
 * Pull down on any tab to refresh.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Button, Chips, Empty, Group, IconButton, SearchField, SectionHeader, SheetScreen } from '@/components/ui';
import type { Player } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';

type Tab = 'friends' | 'requests' | 'find';

export default function Friends() {
  const data = useAppData();
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const incoming = data.requests.incoming;
  const outgoing = data.requests.outgoing;
  // Open where the action is: waiting requests first, Find when you have no friends yet.
  // Decided once the data has loaded (a cold start from a notification can land here first).
  const pick = (): Tab => params.tab ?? (incoming.length ? 'requests' : data.friends.length ? 'friends' : 'find');
  const [tab, setTab] = useState<Tab | null>(data.ready ? pick() : null);
  if (tab === null && data.ready) setTab(pick());
  const current: Tab = tab ?? 'friends';
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const invite = () => {
    const handle = data.me.username ? `@${data.me.username}` : data.me.name;
    Share.share({ message: `Add me on Greens Keeper: search for ${handle}.` }).catch(() => {});
  };

  const requestCount = incoming.length + outgoing.length;

  return (
    <SheetScreen
      title="Friends"
      back
      right={data.offline ? undefined : <IconButton name="share" label="Invite a friend" onPress={invite} />}
      onRefresh={data.refresh}
      headerExtra={
        <View style={{ paddingBottom: space.sm }}>
          <Chips
            value={current}
            onChange={setTab}
            options={[
              { value: 'friends' as Tab, label: data.friends.length ? `Friends ${data.friends.length}` : 'Friends' },
              { value: 'requests' as Tab, label: requestCount ? `Requests ${requestCount}` : 'Requests' },
              { value: 'find' as Tab, label: 'Find' },
            ]}
          />
        </View>
      }>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {current === 'friends' ? <FriendsTab onFind={() => setTab('find')} /> : null}
      {current === 'requests' ? <RequestsTab busy={busy} act={act} onFind={() => setTab('find')} /> : null}
      {current === 'find' ? <FindTab busy={busy} act={act} onInvite={invite} /> : null}
    </SheetScreen>
  );
}

type Act = (id: string, fn: () => Promise<void>) => Promise<void>;

function FriendsTab({ onFind }: { onFind: () => void }) {
  const data = useAppData();
  const rows = data.friends
    .map((f) => ({ f, pd: data.playerData(f.id) }))
    .sort((a, b) => (b.pd?.rounds[0]?.date ?? '').localeCompare(a.pd?.rounds[0]?.date ?? ''));
  if (!rows.length) {
    return (
      <View style={styles.section}>
        <Empty title="No friends yet" body="Find golfers you play with and send a request. You'll see each other's rounds in your feeds." />
        <Button label="Find golfers" icon="search" onPress={onFind} />
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <Animated.View entering={enterItem(0)}>
        <Group inset={space.lg}>
          {rows.map(({ f, pd }) => {
            const last = pd?.rounds.find((r) => r.status === 'complete');
            const s = last ? data.summaries.get(last.id) : undefined;
            return (
              <Tap key={f.id} onPress={() => router.push(`/player/${f.id}`)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={f.name} style={styles.row}>
                <Avatar player={f} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{f.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {f.username ? `@${f.username}  ·  ` : ''}Handicap {pd?.handicap?.toFixed(1) ?? '—'}  ·  {pd?.coursesPlayed ?? 0} courses
                  </Text>
                  {last && s ? (
                    <Text style={styles.last} numberOfLines={1}>
                      Last round {s.strokes} at {shortCourseName(data.roundCourseName(last))}, {formatDate(last.date)}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-right" size={16} color={colors.inkMuted} />
              </Tap>
            );
          })}
        </Group>
      </Animated.View>
      <Text style={styles.note}>You see each other’s rounds in your feeds. Private rounds stay private.</Text>
    </View>
  );
}

function RequestsTab({ busy, act, onFind }: { busy: string | null; act: Act; onFind: () => void }) {
  const data = useAppData();
  const { incoming, outgoing } = data.requests;
  if (!incoming.length && !outgoing.length) {
    return (
      <View style={styles.section}>
        <Empty title="No requests" body="Requests you get and send show up here." />
        <Button variant="secondary" label="Find golfers" icon="search" onPress={onFind} />
      </View>
    );
  }
  return (
    <View style={styles.sectionWide}>
      {incoming.length ? (
        <View style={styles.section}>
          <SectionHeader title="Received" count={String(incoming.length)} />
          <Group inset={space.lg}>
            {incoming.map((p) => (
              <PersonRow key={p.id} player={p}>
                <SmallButton label="Decline" quiet busy={busy === `${p.id}-no`} onPress={() => act(`${p.id}-no`, () => data.respondToRequest(p.id, false))} />
                <SmallButton label="Accept" busy={busy === p.id} onPress={() => act(p.id, () => data.respondToRequest(p.id, true))} />
              </PersonRow>
            ))}
          </Group>
        </View>
      ) : null}
      {outgoing.length ? (
        <View style={styles.section}>
          <SectionHeader title="Sent" count={String(outgoing.length)} />
          <Group inset={space.lg}>
            {outgoing.map((p) => (
              <PersonRow key={p.id} player={p} sub="Waiting for them to accept">
                <SmallButton label="Cancel" quiet busy={busy === `${p.id}-cancel`} onPress={() => act(`${p.id}-cancel`, () => data.removeFriend(p.id))} />
              </PersonRow>
            ))}
          </Group>
        </View>
      ) : null}
    </View>
  );
}

function FindTab({ busy, act, onInvite }: { busy: string | null; act: Act; onInvite: () => void }) {
  const data = useAppData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ q: string; players: Player[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);
  const q = query.trim().replace(/^@/, '');

  // Debounced search; only the newest request's answer is shown, so fast typing never shows stale results.
  useEffect(() => {
    if (q.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(() => {
      setSearching(true);
      data.searchPlayers(q)
        .then((players) => { if (id === seq.current) setResults({ q, players }); })
        .catch(() => { if (id === seq.current) setResults({ q, players: [] }); })
        .finally(() => { if (id === seq.current) setSearching(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [q, data]);

  const friendIds = useMemo(() => new Set(data.friends.map((f) => f.id)), [data.friends]);
  const outgoingIds = useMemo(() => new Set(data.requests.outgoing.map((p) => p.id)), [data.requests.outgoing]);
  const incomingIds = useMemo(() => new Set(data.requests.incoming.map((p) => p.id)), [data.requests.incoming]);

  // People you may know: in your leagues/events, or tagged in rounds with you, and not already connected.
  const suggestions = useMemo(() => {
    const mine = new Set(data.eventMembers.filter((m) => m.playerId === data.me.id && m.status === 'joined').map((m) => m.eventId));
    const ids = [
      ...data.eventMembers.filter((m) => mine.has(m.eventId) && m.status !== 'declined').map((m) => m.playerId),
      ...data.others.map((p) => p.id),
    ];
    return [...new Set(ids)]
      .filter((id) => id !== data.me.id && !friendIds.has(id) && !outgoingIds.has(id) && !incomingIds.has(id))
      .map((id) => data.playerById(id))
      .filter((p): p is Player => !!p)
      .slice(0, 12);
  }, [data, friendIds, outgoingIds, incomingIds]);

  const action = (p: Player) =>
    friendIds.has(p.id) ? <Text style={styles.state}>Friends</Text>
      : outgoingIds.has(p.id) ? <Text style={styles.state}>Requested</Text>
        : incomingIds.has(p.id) ? <SmallButton label="Accept" busy={busy === p.id} onPress={() => act(p.id, () => data.respondToRequest(p.id, true))} />
          : <SmallButton label="Add" busy={busy === p.id} onPress={() => act(p.id, () => data.sendFriendRequest(p.id))} />;

  if (data.offline) return <Empty title="Needs an account" body="Friends work when you're signed in." />;

  const showing = q.length >= 2 && results?.q === q ? results.players : null;
  return (
    <View style={styles.sectionWide}>
      <View style={styles.section}>
        <SearchField value={query} onChange={setQuery} placeholder="Name or @username" />
        {q.length >= 2 ? (
          searching && !showing ? (
            <View style={styles.searching}><ActivityIndicator color={colors.fairway} /><Text style={styles.note}>Searching…</Text></View>
          ) : showing && showing.length === 0 ? (
            <Text style={styles.note}>No golfers match “{q}”. Check the spelling, try just a first name, or invite them below.</Text>
          ) : showing ? (
            <Group inset={space.lg}>
              {showing.map((p) => (
                <PersonRow key={p.id} player={p} onPress={friendIds.has(p.id) ? () => router.push(`/player/${p.id}`) : undefined}>{action(p)}</PersonRow>
              ))}
            </Group>
          ) : null
        ) : (
          <Text style={styles.note}>Search by first or last name, or their exact username.</Text>
        )}
      </View>

      {q.length < 2 && suggestions.length ? (
        <View style={styles.section}>
          <SectionHeader title="People you may know" />
          <Text style={styles.note}>From your leagues, events and rounds you were tagged in.</Text>
          <Group inset={space.lg}>
            {suggestions.map((p) => <PersonRow key={p.id} player={p}>{action(p)}</PersonRow>)}
          </Group>
        </View>
      ) : null}

      <View style={styles.inviteCard}>
        <Text style={styles.inviteTitle}>Not on Greens Keeper yet?</Text>
        <Text style={styles.note}>
          {data.me.username ? `Send them your username, @${data.me.username}, so they can add you.` : 'Set a username so friends can find you easily.'}
        </Text>
        {data.me.username ? (
          <Button variant="secondary" label="Invite a friend" icon="share" onPress={onInvite} />
        ) : (
          <Button variant="secondary" label="Set your username" icon="user" onPress={() => router.push('/account')} />
        )}
      </View>
    </View>
  );
}

function PersonRow({ player, sub, onPress, children }: { player: Player; sub?: string; onPress?: () => void; children?: React.ReactNode }) {
  const body = (
    <>
      <Avatar player={player} size={42} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        {sub || player.username ? <Text style={styles.meta} numberOfLines={1}>{sub ?? `@${player.username}`}</Text> : null}
      </View>
      {children}
    </>
  );
  return onPress ? (
    <Tap onPress={onPress} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={player.name} style={styles.row}>{body}</Tap>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}

function SmallButton({ label, onPress, busy, quiet }: { label: string; onPress: () => void; busy?: boolean; quiet?: boolean }) {
  return (
    <Tap onPress={onPress} disabled={busy} haptic={quiet ? 'tap' : 'press'} scaleTo={0.94} swish={!quiet} accessibilityRole="button" accessibilityLabel={label} style={[styles.small, quiet && styles.smallQuiet, busy && { opacity: 0.5 }]}>
      <Text style={[styles.smallText, quiet && styles.smallTextQuiet]}>{busy ? '…' : label}</Text>
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  sectionWide: { gap: space.xl },
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  last: { ...type.caption, color: colors.inkMuted },
  state: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  searching: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  inviteCard: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.tint },
  inviteTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.fairway },
  small: { paddingHorizontal: 14, minHeight: 34, borderRadius: radius.pill, backgroundColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  smallQuiet: { backgroundColor: colors.paper },
  smallText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  smallTextQuiet: { color: colors.ink },
}));
