/**
 * League / tournament card: a forest header with the format and players, then progress through the schedule,
 * where you stand, and the next round. Tappable in lists; `header` is the version at the top of the event page
 * (adds the organizer and the join code).
 */
import { router } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { RoundTicket } from '@/components/round-ticket';
import { AvatarStack } from '@/components/social';
import { ProgressBar } from '@/components/ui';
import { FORMAT_LABEL, KIND_LABEL } from '@/domain/competition';
import { formatDay, formatTeeTime, todayISO } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { myEventRound, startEventRoundHref, useEvent, type EventView } from '@/state/events';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

/** Your place and score in the event, or undefined before anyone has posted. */
function myStanding(view: EventView, me: string): string | undefined {
  const s = view.season?.find((r) => r.playerId === me);
  if (s && s.rounds > 0) return `You're ${s.tied ? 'T-' : ''}${ordinal(s.position)} · ${s.points} pts`;
  const l = view.leaderboard?.find((r) => r.playerId === me);
  if (l) return `You're ${l.tied ? 'T-' : ''}${ordinal(l.position)} · ${l.value}${view.event.format.scoring === 'stableford' ? ' pts' : ''}`;
  const m = view.matchTable?.find((r) => r.playerId === me);
  if (m && m.played > 0) return `You're ${ordinal(m.position)} · ${m.won}-${m.lost}-${m.halved}`;
  return undefined;
}

export function EventCard({ eventId, header = false }: { eventId: string; header?: boolean }) {
  const data = useAppData();
  const view = useEvent(eventId);
  if (!view) return null;
  const { event } = view;
  const played = view.rounds.filter((r) => r.status === 'past' || r.results.some((x) => x.complete)).length;
  const total = view.rounds.length;
  const standing = myStanding(view, data.me.id);
  const next = view.next;
  const nextLine = next
    ? `${next.round.scheduledOn === todayISO() ? 'Today' : formatDay(next.round.scheduledOn)}${next.round.teeTime ? ` · ${formatTeeTime(next.round.teeTime)}` : ''} · ${shortCourseName(next.courseName)}`
    : total ? 'No more rounds scheduled' : 'No rounds scheduled yet';
  const share = () => Share.share({ message: `Join "${event.name}" on Greens Keeper with code ${event.joinCode}` }).catch(() => {});

  const body = (
    <>
      <View style={styles.band}>
        <View style={styles.bandTop}>
          <Icon name="trophy" size={16} color={colors.gold} />
          <Text style={styles.kind} numberOfLines={1}>{KIND_LABEL[event.kind].toUpperCase()} · {FORMAT_LABEL(event.format).toUpperCase()}</Text>
          <AvatarStack players={view.joined.slice(0, 5)} size={22} />
        </View>
        <Text style={[styles.name, header && styles.nameHeader]} numberOfLines={2}>{event.name}</Text>
        {header ? (
          <Text style={styles.bandSub}>Organized by {view.isOrganizer ? 'you' : view.organizer?.name ?? 'a friend'} · {view.joined.length} {view.joined.length === 1 ? 'player' : 'players'}</Text>
        ) : null}
      </View>
      <View style={styles.body}>
        {total ? (
          <View style={{ gap: 6 }}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{played >= total ? (event.kind === 'league' ? 'Season complete' : 'Complete') : `Round ${Math.min(played + 1, total)} of ${total}`}</Text>
              {standing ? <Text style={styles.standing}>{standing}</Text> : null}
            </View>
            <ProgressBar value={played} max={total} />
          </View>
        ) : null}
        <View style={styles.nextRow}>
          <Icon name="calendar" size={15} color={next?.status === 'today' ? colors.fairway : colors.inkMuted} />
          <Text style={[styles.next, next?.status === 'today' && styles.nextToday]} numberOfLines={1}>{next ? `Next: ${nextLine}` : nextLine}</Text>
          {header ? null : <Icon name="chevron-right" size={16} color={colors.inkMuted} />}
        </View>
        {header ? (
          <Tap onPress={share} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={`Join code ${event.joinCode}, share`} style={styles.code}>
            <Text style={styles.codeLabel}>JOIN CODE</Text>
            <Text style={styles.codeValue}>{event.joinCode}</Text>
            <Icon name="share" size={15} color={colors.fairway} />
          </Tap>
        ) : null}
      </View>
    </>
  );

  return header ? (
    <View style={styles.card}>{body}</View>
  ) : (
    <Tap onPress={() => router.push(`/event/${event.id}`)} scaleTo={0.985} swish accessibilityRole="button" accessibilityLabel={`${event.name}, ${KIND_LABEL[event.kind]}`} style={styles.card}>{body}</Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.creamLight, ...shadow.card },
  band: { backgroundColor: colors.fairway, padding: space.lg, gap: space.sm },
  bandTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kind: { flex: 1, fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 1.2, color: colors.onFillMuted },
  name: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30, color: colors.cream },
  nameHeader: { fontSize: 28, lineHeight: 34 },
  bandSub: { ...type.caption, fontSize: 13, color: colors.onFillMuted },
  body: { padding: space.lg, gap: space.md },
  progressRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  progressText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  standing: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.gold },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  next: { flex: 1, ...type.caption, fontSize: 13, color: colors.inkMuted },
  nextToday: { fontFamily: fonts.bodySemibold, color: colors.fairway },
  code: { flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.paper },
  codeLabel: { fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1.2, color: colors.inkMuted },
  log: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 36, borderRadius: radius.pill, backgroundColor: colors.fairway },
  logText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.cream },
  codeValue: { fontFamily: fonts.bodyBold, fontSize: 17, letterSpacing: 3, color: colors.ink },
}));

/**
 * One scheduled event round as a ticket (league week, tournament round, or a scheduled round with friends).
 * Upcoming: who's in. Today: "Today". Past: faded, with who posted. Joined and not played yet: Start now (any day).
 * Past and not played: Log my round. Started: Resume.
 */
export function EventRoundTicket({ eventId, roundId, compact = true, withEventName = false }: { eventId: string; roundId: string; compact?: boolean; withEventName?: boolean }) {
  const data = useAppData();
  const view = useEvent(eventId);
  const r = view?.rounds.find((x) => x.round.id === roundId);
  if (!view || !r) return null;
  const { event } = view;
  const outing = event.kind === 'outing';
  const posted = [...r.linked.values()].filter((x) => x.status === 'complete');
  const mine = myEventRound(data, r.round.id);
  const joined = view.myMembership?.status === 'joined';
  // Who's in until someone posts; after that, who posted.
  const showMembers = r.status === 'upcoming' || outing || (r.status === 'today' && !posted.length);
  const players = showMembers
    ? view.joined
    : posted.map((x) => data.playerById(x.ownerId ?? data.me.id)).filter((p): p is NonNullable<typeof p> => !!p);
  const holes = r.round.holes === 'all' ? '18 holes' : r.round.holes === 'front' ? 'Front 9' : 'Back 9';
  const kicker = outing ? event.name : withEventName ? `${event.name} · ${r.round.name}` : r.round.name;
  const summary = data.courseSummary(r.round.courseId);
  return (
    <RoundTicket
      compact={compact}
      course={summary ?? r.course}
      date={r.round.scheduledOn}
      kicker={kicker}
      title={r.courseName}
      meta={`${r.round.teeTime ? formatTeeTime(r.round.teeTime) : 'Tee time TBD'} · ${holes}${event.format.team === 'scramble' ? ' · Scramble' : ''}`}
      players={players}
      playersText={showMembers
        ? `${view.joined.length} ${view.joined.length === 1 ? 'player' : 'players'}`
        : `${posted.length} posted${mine?.status === 'complete' ? ' · ✓ you' : ''}`}
      status={r.status === 'today' ? 'TODAY' : undefined}
      statusTone="live"
      faded={r.status === 'past'}
      onPress={() => router.push(outing ? `/event/${event.id}` : `/event/${event.id}/round/${r.round.id}`)}
      footer={joined && !mine ? (
        <Tap onPress={() => router.push(r.status === 'past' ? `/round/new?eventRound=${r.round.id}&when=earlier` : startEventRoundHref(r.round.id))} haptic="press" scaleTo={0.95} swish accessibilityRole="button" style={styles.log}>
          <Icon name="flag" size={14} color={colors.cream} />
          <Text style={styles.logText}>{r.status === 'past' ? 'Log my round' : 'Start now'}</Text>
        </Tap>
      ) : mine?.status === 'active' ? (
        <Tap onPress={() => router.push(`/round/play/${mine.id}`)} haptic="press" scaleTo={0.95} accessibilityRole="button" style={styles.log}>
          <Text style={styles.logText}>Resume my round</Text>
        </Tap>
      ) : undefined}
    />
  );
}
