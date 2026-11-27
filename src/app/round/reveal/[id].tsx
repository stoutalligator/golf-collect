import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Collectible, Emblem } from '@/art/components';
import { Animated, CountUp, popIn, Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { TIERS } from '@/data/config/game';
import { tierRank } from '@/domain/collection';
import { formatToPar } from '@/domain/stats';
import type { Round } from '@/domain/types';
import { haptics } from '@/lib/haptics';
import { shortCourseName } from '@/lib/names';
import { matchLine, matchStatus, teamNumbers } from '@/domain/teams';
import { useAppData } from '@/state/app-data';
import { fonts, palettes, radius, space, themed, type } from '@/theme';
import { FadeIn } from 'react-native-reanimated';


/** The reveal is an always-dark celebration: it looks the same in light and dark mode. */
const colors = palettes.light;
type Step =
  | { kind: 'score' }
  | { kind: 'tier'; tier: (typeof TIERS)[number] }
  | { kind: 'item'; id: string; itemKind: string; name: string }
  | { kind: 'badge'; id: string; name: string; description: string; sim: boolean }
  | { kind: 'done' };

/**
 * The moment after "Finish Round": your score, then each thing the round earned revealed one at a time
 * (ball-marker tier, new collectibles, badges), then a wrap-up with the group's scores and what's next.
 */
export default function Reveal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const round = data.roundById(id);
  const summary = round ? data.summaries.get(round.id) : undefined;
  const course = round?.kind === 'course' ? data.courseById(round.courseId) : undefined;

  // Freeze the rewards when the screen opens so a background refresh can't reshuffle the sequence.
  const [steps] = useState<Step[]>(() => {
    if (!round) return [{ kind: 'done' }];
    const earned = data.earnedInRound(round);
    const tier = earned.tier ? TIERS.find((t) => t.tier === earned.tier!.tier) : undefined;
    return [
      { kind: 'score' },
      ...(tier ? [{ kind: 'tier' as const, tier }] : []),
      ...earned.items.map((i) => ({ kind: 'item' as const, id: i.def.id, itemKind: i.def.kind, name: i.def.name })),
      ...earned.badges.map((b) => ({ kind: 'badge' as const, id: b.def.id, name: b.def.name, description: b.def.description, sim: b.def.track === 'sim' })),
      { kind: 'done' },
    ];
  });
  const [at, setAt] = useState(0);
  const step = steps[at];
  const rewards = steps.filter((s) => s.kind === 'tier' || s.kind === 'item' || s.kind === 'badge').length;
  const rewardNo = steps.slice(0, at + 1).filter((s) => s.kind === 'tier' || s.kind === 'item' || s.kind === 'badge').length;

  useEffect(() => {
    if (step.kind === 'tier' || step.kind === 'item' || step.kind === 'badge') {
      const t = setTimeout(() => haptics.success(), 180);
      return () => clearTimeout(t);
    }
  }, [step.kind, at]);

  const scorecard = () => router.replace(`/round/${id}`);
  if (!round || !summary) {
    return (
      <Shell insets={insets}>
        <Text style={styles.title}>Round saved</Text>
        <Footer><Primary label="See scorecard" onPress={scorecard} /></Footer>
      </Shell>
    );
  }

  const short = course ? shortCourseName(course.name) : data.roundCourseName(round);
  const next = () => setAt((i) => Math.min(i + 1, steps.length - 1));

  return (
    <Shell insets={insets}>
      <View style={styles.top}>
        <Emblem size={30} onDark />
        {rewards && step.kind !== 'score' && step.kind !== 'done' ? <Text style={styles.counter}>{rewardNo} of {rewards}</Text> : null}
      </View>

      <Animated.View key={at} entering={FadeIn.duration(260)} style={styles.stage}>
        {step.kind === 'score' ? (
          <>
            <Text style={styles.kicker}>Round complete</Text>
            <Text style={styles.course} numberOfLines={2}>{data.roundCourseName(round)}</Text>
            <CountUp value={summary.strokes} style={styles.score} duration={900} />
            <Text style={styles.toPar}>{formatToPar(summary.toPar)}  ·  {summary.holesPlayed} holes</Text>
            <View style={styles.facts}>
              <Fact label="Birdies" value={String(summary.birdies + summary.eagles)} />
              <Fact label="Pars" value={String(summary.pars)} />
              <Fact label="Putts" value={summary.putts.entered ? String(summary.putts.total) : '—'} />
            </View>
          </>
        ) : step.kind === 'tier' && course ? (
          <Reward kicker={`${step.tier.name} tier`} title={`${step.tier.name} ball marker`} sub={`${step.tier.label} at ${short}`}>
            <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind="ball-marker" tier={step.tier.tier} label={short} size={190} />
          </Reward>
        ) : step.kind === 'item' && course ? (
          <Reward kicker="New collectible" title={step.name} sub={short}>
            <Collectible courseId={course.id} region={course.region} sublabel={`${course.city} · ${course.state}`} kind={step.itemKind as never} id={step.id} tier={null} label={short} size={190} />
          </Reward>
        ) : step.kind === 'badge' ? (
          <Reward kicker="Badge unlocked" title={step.name} sub={step.description}>
            <Badge id={step.id} name={step.name} sim={step.sim} size={170} />
          </Reward>
        ) : (
          <WrapUp round={round} rewards={rewards} />
        )}
      </Animated.View>

      <Footer>
        {step.kind === 'done' ? (
          <>
            <Primary label="See scorecard" onPress={scorecard} />
            <Secondary label="Done" onPress={() => router.replace('/')} />
          </>
        ) : step.kind === 'score' ? (
          <Primary label={rewards ? `Reveal ${rewards === 1 ? 'your reward' : `${rewards} rewards`}` : 'Continue'} onPress={next} />
        ) : (
          <>
            <Primary label={rewardNo === rewards ? 'Continue' : 'Next'} onPress={next} />
            <Secondary label="Skip" onPress={() => setAt(steps.length - 1)} />
          </>
        )}
      </Footer>
    </Shell>
  );
}

/** Last step: everything earned, the group's scores, and what to chase next at this course. */
function WrapUp({ round, rewards }: { round: Round; rewards: number }) {
  const data = useAppData();
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const col = course ? data.collections.get(course.id) : undefined;
  const current = col?.tier?.tier;
  const nextTier = TIERS.find((t) => !current || tierRank(t.tier) > tierRank(current));
  const group = useMemo(() => {
    const all = data.roundGroup(round);
    const teams = teamNumbers(all);
    return all
      .map((r) => ({
        r, s: data.summaries.get(r.id), p: data.playerById(r.ownerId ?? data.me.id),
        // Scramble teams read "Team 2 · Mike, Dana"; individual rounds the player's first name.
        label: teams.get(r.id) ? `Team ${teams.get(r.id)}` : undefined,
        members: r.playerIds.map((pid) => data.playerById(pid)).filter((x): x is NonNullable<typeof x> => !!x),
      }))
      .filter((x) => x.s && x.p)
      .sort((a, b) => a.s!.strokes - b.s!.strokes);
  }, [data, round]);
  const versus = group.length === 2 && group.every((g) => g.s!.isComplete)
    ? matchLine(matchStatus(group[0].r.scores[group[0].r.ownerId ?? data.me.id] ?? [], group[1].r.scores[group[1].r.ownerId ?? data.me.id] ?? [], round.holeNumbers.length),
      group[0].label ?? (group[0].p!.id === data.me.id ? 'You' : group[0].p!.name.split(' ')[0]),
      group[1].label ?? (group[1].p!.id === data.me.id ? 'You' : group[1].p!.name.split(' ')[0]))
    : undefined;

  return (
    <View style={{ gap: space.lg, alignSelf: 'stretch' }}>
      <Text style={styles.kicker}>{round.format === 'scramble' ? 'Scramble saved · just for fun' : rewards ? `${rewards} earned this round` : 'Round saved'}</Text>
      <Text style={styles.course}>{course ? shortCourseName(course.name) : data.roundCourseName(round)}</Text>
      {group.length > 1 ? (
        <View style={styles.board}>
          {versus ? <Text style={styles.versus}>{versus} · match play</Text> : null}
          {group.map(({ r, s, p, label, members }, i) => (
            <Animated.View key={r.id} entering={popIn(80 + i * 70, { from: 0.96 })} style={[styles.boardRow, i > 0 && styles.boardRule]}>
              <Text style={styles.boardPos}>{i + 1}</Text>
              <View style={styles.ring}><Avatar player={p!} size={30} /></View>
              <Text style={styles.boardName} numberOfLines={1}>{label ? `${label} · ${members.map((m) => (m.id === data.me.id ? 'You' : m.name.split(' ')[0])).join(', ')}` : p!.id === data.me.id ? 'You' : p!.name.split(' ')[0]}</Text>
              <Text style={styles.boardScore}>{s!.strokes}</Text>
              <Text style={styles.boardToPar}>{formatToPar(s!.toPar)}</Text>
            </Animated.View>
          ))}
        </View>
      ) : null}
      {round.kind === 'course' && round.format !== 'scramble' && nextTier ? (
        <View style={styles.nextUp}>
          <Text style={styles.nextLabel}>Next here</Text>
          <Text style={styles.nextText}>{nextTier.label} for the {nextTier.name} ball marker</Text>
        </View>
      ) : null}
    </View>
  );
}

function Reward({ kicker, title, sub, children }: { kicker: string; title: string; sub: string; children: ReactNode }) {
  return (
    <>
      <Text style={styles.kicker}>{kicker}</Text>
      <View style={styles.art}>
        <Animated.View entering={FadeIn.duration(700).delay(60)} style={styles.halo} />
        <Animated.View entering={popIn(120, { from: 0.88, duration: 520 })}>{children}</Animated.View>
      </View>
      <Animated.View entering={FadeIn.duration(360).delay(380)} style={{ alignItems: 'center', gap: 4 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </Animated.View>
    </>
  );
}

function Shell({ insets, children }: { insets: { top: number; bottom: number }; children: ReactNode }) {
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.md, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>{children}</ScrollView>
    </View>
  );
}

const Footer = ({ children }: { children: ReactNode }) => <View style={styles.footer}>{children}</View>;

function Primary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap haptic="press" scaleTo={0.97} onPress={onPress} accessibilityRole="button" style={styles.primary}>
      <Text style={styles.primaryText}>{label}</Text>
    </Tap>
  );
}

function Secondary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap haptic="tap" scaleTo={0.97} onPress={onPress} accessibilityRole="button" style={styles.secondary}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Tap>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.fairwayDeep, paddingHorizontal: space.lg },
  scroll: { flexGrow: 1, gap: space.lg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  counter: { ...type.label, color: colors.goldSoft },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.lg },
  kicker: { ...type.label, color: colors.gold, textAlign: 'center' },
  course: { fontFamily: fonts.displayItalic, fontSize: 26, lineHeight: 32, color: colors.cream, textAlign: 'center' },
  score: { fontFamily: fonts.displayBold, fontSize: 112, lineHeight: 124, color: colors.cream, fontVariant: ['tabular-nums'] },
  toPar: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.goldSoft },
  facts: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  fact: { minWidth: 84, alignItems: 'center', paddingVertical: space.sm, paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(233,220,190,0.35)' },
  factValue: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.cream, fontVariant: ['tabular-nums'] },
  factLabel: { ...type.caption, color: colors.goldSoft },
  art: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(179,149,86,0.16)', borderWidth: 1, borderColor: 'rgba(179,149,86,0.35)' },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.cream, textAlign: 'center' },
  sub: { ...type.body, fontSize: 15, color: colors.goldSoft, textAlign: 'center', maxWidth: 300 },
  board: { borderRadius: radius.lg, backgroundColor: 'rgba(246,239,227,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(233,220,190,0.25)', paddingHorizontal: space.md },
  versus: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.gold, textAlign: 'center', paddingVertical: space.sm },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm + 2 },
  boardRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(233,220,190,0.2)' },
  boardPos: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.goldSoft, width: 14 },
  ring: { borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(233,220,190,0.55)', padding: 1 },
  boardName: { flex: 1, fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.cream },
  boardScore: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.cream, fontVariant: ['tabular-nums'] },
  boardToPar: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.goldSoft, minWidth: 36, textAlign: 'right' },
  nextUp: { alignItems: 'center', gap: 4, paddingVertical: space.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(179,149,86,0.4)', borderStyle: 'dashed' },
  nextLabel: { ...type.label, color: colors.gold },
  nextText: { ...type.body, fontSize: 15, color: colors.cream, textAlign: 'center', paddingHorizontal: space.md },
  footer: { gap: space.sm, paddingTop: space.md },
  primary: { minHeight: 54, borderRadius: radius.pill, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.fairway },
  secondary: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.goldSoft },
}));
