import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tap } from '@/components/motion';
import { OutingView } from '@/components/outing-view';
import { Avatar } from '@/components/social';
import { Button, Card, Empty, Group, IconButton, SectionHeader, SheetScreen } from '@/components/ui';
import { FORMAT_LABEL, positionLabel, roundRobin } from '@/domain/competition';
import { formatDay, formatTeeTime } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { myEventRound, startEventRoundHref, useEvent } from '@/state/events';
import { colors, fonts, space, themed, type } from '@/theme';

export default function EventRoundScreen() {
  const { id, roundId } = useLocalSearchParams<{ id: string; roundId: string }>();
  const data = useAppData();
  const view = useEvent(id);
  const [busy, setBusy] = useState(false);
  const r = view?.rounds.find((x) => x.round.id === roundId);
  if (!view || !r) return <SheetScreen title="Round" back><Empty title="Round not found" body="" /></SheetScreen>;
  if (view.event.kind === 'outing') return <OutingView view={view} />;

  const f = view.event.format;
  const name = (pid: string) => (pid === data.me.id ? 'You' : data.playerById(pid)?.name ?? 'Player');
  const mine = myEventRound(data, r.round.id);
  const joined = view.myMembership?.status === 'joined';
  const canPlay = joined && !mine;
  const metricOf = (pid: string) => {
    const x = r.results.find((y) => y.playerId === pid);
    if (!x) return '';
    return f.scoring === 'stableford' ? `${f.basis === 'net' ? x.stablefordNet : x.stablefordGross} pts` : `${x.gross} / ${x.net}`;
  };

  const makePairings = async () => {
    setBusy(true);
    try {
      // Rotate a round-robin by this round's position so each week brings new opponents.
      const schedule = roundRobin(view.joined.map((p) => p.id));
      const pairs = schedule.length ? schedule[(r.round.seq - 1) % schedule.length] : [];
      await data.setPairings(r.round.id, pairs);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetScreen
      title={r.round.name}
      back
      right={view.isOrganizer ? <IconButton name="calendar" label="Edit round" onPress={() => router.push(`/schedule?round=${r.round.id}`)} /> : undefined}>
      <Card style={styles.hero}>
        <Text style={styles.event}>{view.event.name}</Text>
        <Text style={styles.course}>{r.courseName}</Text>
        <Text style={styles.meta}>
          {formatDay(r.round.scheduledOn)}{r.round.teeTime ? ` · ${formatTeeTime(r.round.teeTime)}` : ''}
          {r.round.holes !== 'all' ? ` · ${r.round.holes === 'front' ? 'Front' : 'Back'} 9` : ''}
          {` · ${FORMAT_LABEL(f)}`}
        </Text>
        {canPlay && r.status !== 'past' ? <Button label="Start now" icon="flag" onPress={() => router.push(startEventRoundHref(r.round.id))} style={{ marginTop: space.md }} /> : null}
        {canPlay ? (
          <Button
            variant={r.status === 'past' ? 'primary' : 'secondary'}
            label={r.status === 'past' ? 'Log my round for this' : 'Already played it'}
            icon={r.status === 'past' ? 'flag' : undefined}
            onPress={() => router.push(`/round/new?eventRound=${r.round.id}&when=earlier`)}
            style={{ marginTop: r.status === 'past' ? space.md : space.sm }}
          />
        ) : null}
        {mine ? (
          <Tap onPress={() => router.push(mine.status === 'active' ? `/round/play/${mine.id}` : `/round/${mine.id}`)} scaleTo={0.98} accessibilityRole="button" style={styles.mine}>
            <Text style={styles.mineText}>{mine.status === 'active' ? 'Your round is in progress · continue' : 'Your round is posted · view scorecard'}</Text>
          </Tap>
        ) : null}
      </Card>

      {f.scoring === 'match' ? (
        <View style={styles.section}>
          <SectionHeader title="Matches" />
          {r.matches.length ? (
            <Group>
              {r.matches.map((m) => (
                <View key={m.matchId} style={styles.row}>
                  <Text style={[styles.player, m.winner === m.playerA && styles.winner]} numberOfLines={1}>{name(m.playerA)}</Text>
                  <Text style={styles.result}>{m.summary.replace(/^A /, `${name(m.playerA).split(' ')[0]} `).replace(/^B /, `${name(m.playerB).split(' ')[0]} `)}</Text>
                  <Text style={[styles.player, styles.right, m.winner === m.playerB && styles.winner]} numberOfLines={1}>{name(m.playerB)}</Text>
                </View>
              ))}
            </Group>
          ) : (
            <Text style={styles.meta}>No pairings yet.</Text>
          )}
          {view.isOrganizer ? (
            <Button variant="secondary" label={busy ? 'Pairing…' : r.matches.length ? 'Re-pair this round' : 'Make pairings'} onPress={makePairings} disabled={busy || view.joined.length < 2} />
          ) : null}
        </View>
      ) : null}

      {f.scoring !== 'match' ? (
        <View style={styles.section}>
          <SectionHeader title="Leaderboard" action={f.scoring === 'stableford' ? 'Points' : 'Gross / Net'} />
          {r.board.length ? (
            <Group>
              {r.board.map((s) => (
                <View key={s.playerId} style={styles.row}>
                  <Text style={styles.pos}>{positionLabel(s)}</Text>
                  {data.playerById(s.playerId) ? <Avatar player={data.playerById(s.playerId)!} size={30} /> : null}
                  <Text style={styles.player} numberOfLines={1}>{name(s.playerId)}</Text>
                  <Text style={styles.score}>{metricOf(s.playerId)}</Text>
                </View>
              ))}
            </Group>
          ) : (
            <Empty title={r.status === 'upcoming' ? 'Not played yet' : 'No scores posted'} body="Scores appear as players log their rounds for this." />
          )}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Players" />
        <Group>
          {view.joined.map((p) => {
            const lr = r.linked.get(p.id);
            return (
              <Tap key={p.id} onPress={() => lr && router.push(`/round/${lr.id}`)} disabled={!lr} scaleTo={0.99} accessibilityRole="button" style={styles.row}>
                <Avatar player={p} size={30} />
                <Text style={styles.player} numberOfLines={1}>{name(p.id)}</Text>
                <Text style={styles.status}>{lr ? (lr.status === 'complete' ? 'Posted' : 'Playing') : r.status === 'past' ? 'No round' : ''}</Text>
              </Tap>
            );
          })}
        </Group>
      </View>
    </SheetScreen>
  );
}

const styles = themed(() => StyleSheet.create({
  section: { gap: space.md },
  hero: { padding: space.lg, gap: 2 },
  event: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.6, color: colors.gold },
  course: { fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28, color: colors.fairway },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  mine: { marginTop: space.md, paddingVertical: 10, paddingHorizontal: space.md, borderRadius: 12, backgroundColor: colors.paper },
  mineText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10, paddingHorizontal: space.lg, minHeight: 48 },
  pos: { width: 28, fontFamily: fonts.displayBold, fontSize: 15, color: colors.gold },
  player: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  right: { textAlign: 'right' },
  winner: { fontFamily: fonts.bodyBold, color: colors.fairway },
  result: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink, textAlign: 'center', minWidth: 92 },
  score: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  status: { ...type.caption, color: colors.inkMuted },
}));
