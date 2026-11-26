import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Group, SearchField, SectionHeader, SheetScreen } from '@/components/ui';
import type { Player } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';

export default function Friends() {
  const data = useAppData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced people search (Supabase profiles; offline demo returns nothing).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      data.searchPlayers(q).then((r) => live && setResults(r)).catch(() => live && setResults([]));
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [query, data]);

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

  const friendIds = new Set(data.friends.map((f) => f.id));
  const outgoing = new Set(data.requests.outgoing.map((p) => p.id));
  const incoming = new Set(data.requests.incoming.map((p) => p.id));
  const shown = query.trim().length >= 2 ? results : [];
  const rows = data.friends
    .map((f) => ({ f, pd: data.playerData(f.id)! }))
    .sort((a, b) => (b.pd.rounds[0]?.date ?? '').localeCompare(a.pd.rounds[0]?.date ?? ''));

  return (
    <SheetScreen title="Friends" back headerExtra={data.offline ? undefined : <SearchField value={query} onChange={setQuery} placeholder="Find golfers by name" />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {shown.length || query.trim().length >= 2 ? (
        <View style={styles.section}>
          <SectionHeader title="Results" />
          {shown.length === 0 ? <Text style={styles.note}>No golfers match “{query.trim()}”.</Text> : (
            <Group inset={space.lg}>
              {shown.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Avatar player={p} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name}</Text>
                    {p.username ? <Text style={styles.meta}>@{p.username}</Text> : null}
                  </View>
                  {friendIds.has(p.id) ? <Text style={styles.state}>Friends</Text>
                    : outgoing.has(p.id) ? <Text style={styles.state}>Requested</Text>
                      : incoming.has(p.id) ? <SmallButton label="Accept" busy={busy === p.id} onPress={() => act(p.id, () => data.respondToRequest(p.id, true))} />
                        : <SmallButton label="Add" busy={busy === p.id} onPress={() => act(p.id, () => data.sendFriendRequest(p.id))} />}
                </View>
              ))}
            </Group>
          )}
        </View>
      ) : null}

      {data.requests.incoming.length ? (
        <View style={styles.section}>
          <SectionHeader title="Requests" count={String(data.requests.incoming.length)} />
          <Group inset={space.lg}>
            {data.requests.incoming.map((p) => (
              <View key={p.id} style={styles.row}>
                <Avatar player={p} size={40} />
                <Text style={[styles.name, { flex: 1 }]}>{p.name}</Text>
                <SmallButton label="Decline" quiet busy={busy === `${p.id}-no`} onPress={() => act(`${p.id}-no`, () => data.respondToRequest(p.id, false))} />
                <SmallButton label="Accept" busy={busy === p.id} onPress={() => act(p.id, () => data.respondToRequest(p.id, true))} />
              </View>
            ))}
          </Group>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Your friends" count={String(data.friends.length)} />
        <Text style={styles.note}>You see each other’s rounds in your feeds. Private rounds stay private.</Text>
        {rows.length === 0 ? (
          <Text style={styles.empty}>No friends yet. Search for golfers above and send a request.</Text>
        ) : (
          <Animated.View entering={enterItem(0)}>
            <Group inset={space.lg}>
              {rows.map(({ f, pd }) => {
                const last = pd.rounds.find((r) => r.status === 'complete');
                const s = last ? data.summaries.get(last.id) : undefined;
                return (
                  <Tap key={f.id} onPress={() => router.push(`/player/${f.id}`)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={f.name} style={styles.row}>
                    <Avatar player={f} size={48} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.name}>{f.name}</Text>
                      <Text style={styles.meta} numberOfLines={1}>Handicap {pd.handicap?.toFixed(1) ?? '—'}  ·  {pd.coursesPlayed} courses played</Text>
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
        )}
      </View>

      {data.requests.outgoing.length ? (
        <Text style={styles.note}>Waiting on: {data.requests.outgoing.map((p) => p.name).join(', ')}</Text>
      ) : null}
    </SheetScreen>
  );
}

function SmallButton({ label, onPress, busy, quiet }: { label: string; onPress: () => void; busy?: boolean; quiet?: boolean }) {
  return (
    <Tap onPress={onPress} disabled={busy} haptic={quiet ? 'tap' : 'press'} scaleTo={0.94} accessibilityRole="button" accessibilityLabel={label} style={[styles.small, quiet && styles.smallQuiet, busy && { opacity: 0.5 }]}>
      <Text style={[styles.smallText, quiet && styles.smallTextQuiet]}>{busy ? '…' : label}</Text>
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  empty: { ...type.body, color: colors.inkMuted, textAlign: 'center', paddingVertical: space.lg },
  error: { ...type.body, fontSize: 14, color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  last: { ...type.caption, color: colors.inkMuted },
  state: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  small: { paddingHorizontal: 14, minHeight: 34, borderRadius: radius.pill, backgroundColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  smallQuiet: { backgroundColor: colors.paper },
  smallText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  smallTextQuiet: { color: colors.ink },
}));
