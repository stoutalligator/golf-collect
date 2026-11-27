import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Avatar, AvatarStack } from '@/components/social';
import { DiscardRoundSheet, discardTargets } from '@/components/round-actions';
import { ActionSheet, Button, Empty, IconButton } from '@/components/ui';
import { realHoleNumber } from '@/domain/layout';
import { deriveGir, formatToPar } from '@/domain/stats';
import { isScramble, matchLine, matchStatus, teamNumbers, toParThru } from '@/domain/teams';
import { roundGroupKey, roundOwner, type FairwayResult, type HoleScore, type Round } from '@/domain/types';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';
import { Tap } from '@/components/motion';
import { haptics } from '@/lib/haptics';

type Pending = Record<string, Record<number, HoleScore | null>>;

/** Scorecard grid cell size (also used to scroll the current hole into view). */
const CELL_W = 34;
const CELL_H = 32;

/**
 * Hole-by-hole entry. Only strokes are required; every other stat can stay blank.
 *
 * Shared scoring: while the round is in progress, everyone playing can enter or fix anyone's score. The main card
 * is the round you opened (yours, or your team's card); everyone else in the group (friends who joined live, the
 * other scramble teams, cards you keep for friends) is a row with their running score and this hole's strokes.
 * Edits are kept here until you move on, then only the changed holes are saved, so nobody's entry on another hole is
 * overwritten. The group is refetched every 30 seconds (and when the app comes back on screen).
 */
export default function PlayRound() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const base = data.roundById(id);
  const me = data.me.id;
  const [pending, setPending] = useState<Pending>({});
  const [saving, setSaving] = useState(false);
  // The card the big −/+ edits: null = this round's own card; a friend's / other team's round id after tapping
  // their cell in the scorecard grid.
  const [focusId, setFocusId] = useState<string | null>(null);
  const gridRef = useRef<ScrollViewInstance>(null);
  const [menu, setMenu] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [index, setIndex] = useState(() => {
    const first = base ? (base.scores[roundOwner(base)] ?? []).findIndex((s) => !s) : 0;
    return first < 0 ? 0 : first;
  });

  // Keep the current hole's column in view (two holes of context to its left).
  useEffect(() => {
    gridRef.current?.scrollTo({ x: Math.max(0, (index - 2) * CELL_W), animated: true });
  }, [index]);

  const groupKey = base ? roundGroupKey(base) : undefined;
  const watch = !!base && (data.roundGroup(base).length > 1 || base.playerIds.length > 1);
  const refreshGroup = useRef(data.refreshGroup);
  useEffect(() => { refreshGroup.current = data.refreshGroup; });
  useEffect(() => {
    if (!groupKey || !watch) return;
    const first = setTimeout(() => refreshGroup.current(groupKey), 400);
    const tick = setInterval(() => refreshGroup.current(groupKey), 30_000);
    // Timers pause while the phone is locked; catch up the moment the app is back on screen.
    const wake = AppState.addEventListener('change', (state) => { if (state === 'active') refreshGroup.current(groupKey); });
    return () => { clearTimeout(first); clearInterval(tick); wake.remove(); };
  }, [groupKey, watch]);

  const layout = base ? data.layoutFor(base) : undefined;
  if (!base || !layout) return <Empty title="Round not found" body="" />;
  const round = base;

  const pars = round.holeNumbers.map((n) => layout.holes.find((h) => h.number === n)?.par ?? 4);
  const holeNo = round.holeNumbers[index];
  const hole = layout.holes.find((h) => h.number === holeNo)!;
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const tee = course?.tees.find((t) => t.id === round.teeId);
  const yards = course ? tee?.yardages?.[realHoleNumber(course, holeNo) - 1] : undefined;
  const scramble = isScramble(round);

  // Every card's scores = saved copy + your unsaved edits.
  const view = (r: Round): (HoleScore | null)[] => {
    const list = (r.scores[roundOwner(r)] ?? r.holeNumbers.map(() => null)).slice();
    for (const [i, s] of Object.entries(pending[r.id] ?? {})) list[Number(i)] = s;
    return list;
  };
  const scores = view(round);
  const ownsOrKeeps = (r: Round) => roundOwner(r) === me || r.scoredBy === me;
  // Cards in the group besides this one; cards you keep (and your team's card) get par filled in as you go.
  const group = data.roundGroup(round);
  // Rows: scramble teams in team order; players alphabetically by first name (the same on every phone).
  const firstName = (r: Round) => data.playerById(roundOwner(r))?.name ?? '';
  const others = group.filter((r) => r.id !== round.id).sort((a, b) =>
    isScramble(a) && isScramble(b)
      ? a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
      : firstName(a).localeCompare(firstName(b)));
  const teams = teamNumbers(group);
  const teamOf = (r: Round) => teams.get(r.id);
  const membersOf = (r: Round) => r.playerIds.map((pid) => data.playerById(pid)).filter((p): p is NonNullable<typeof p> => !!p);
  const nameOf = (r: Round) => (scramble && teamOf(r) ? `Team ${teamOf(r)}` : roundOwner(r) === me ? 'You' : data.playerById(roundOwner(r))?.name.split(' ')[0] ?? 'Player');
  const autoFill = [round, ...others.filter((r) => r.scoredBy === me && r.status === 'active')];
  const joinedIds = new Set(group.flatMap((r) => (isScramble(r) ? r.playerIds : [roundOwner(r)])));
  const waiting = scramble ? [] : round.playerIds.filter((pid) => !joinedIds.has(pid)).map((pid) => data.playerById(pid)).filter((p) => !!p);
  const isLast = index === round.holeNumbers.length - 1;
  const canFinish = ownsOrKeeps(round);
  const canDiscard = discardTargets(data, round).length > 0;


  const target = (focusId && others.find((r) => r.id === focusId)) || round;
  const editingOther = target.id !== round.id;
  const targetScore = view(target)[index];
  // The selected card's hole: strokes and every stat below edit this (yours, or a friend's / team's after tapping
  // their cell). Untouched = par.
  const sel: HoleScore = (editingOther ? targetScore : scores[index]) ?? { strokes: hole.par };
  const targetStrokes = sel.strokes;
  const rows = [round, ...others];

  const edit = (r: Round, i: number, score: HoleScore | null) =>
    setPending((p) => ({ ...p, [r.id]: { ...(p[r.id] ?? {}), [i]: score } }));
  const patch = (p: Partial<HoleScore>) => {
    const next = { ...sel, ...p };
    (Object.keys(next) as (keyof HoleScore)[]).forEach((k) => next[k] === undefined && delete next[k]);
    delete next.enteredBy;
    edit(target, index, next);
  };

  /** Save your edits (and par for untouched cards you keep on this hole). Returns each card's scores after saving. */
  const flush = async (): Promise<Map<string, (HoleScore | null)[]>> => {
    const out = new Map<string, (HoleScore | null)[]>();
    const touched = new Map<string, Set<number>>();
    for (const [rid, holes] of Object.entries(pending)) touched.set(rid, new Set(Object.keys(holes).map(Number)));
    for (const r of autoFill) {
      if (!view(r)[index]) touched.set(r.id, new Set([...(touched.get(r.id) ?? []), index]));
    }
    const jobs: Promise<void>[] = [];
    for (const r of [round, ...others]) {
      const list = view(r);
      const idx = touched.get(r.id);
      if (idx) for (const i of idx) if (!list[i] && autoFill.includes(r)) list[i] = { strokes: pars[i] };
      out.set(r.id, list);
      if (!idx?.size) continue;
      const holes = [...idx].map((i) => r.holeNumbers[i]);
      const next: Round = { ...r, scores: { ...r.scores, [roundOwner(r)]: list.map((s) => (s ? { ...s, enteredBy: undefined } : s)) } };
      // Queued: saved on the phone now, uploaded in the background (retrying with no signal).
      jobs.push(ownsOrKeeps(r)
        ? data.queueRounds([next], { holes })
        : data.queueHoleScores(r, [...idx].map((i) => ({ hole: r.holeNumbers[i], score: list[i] }))));
    }
    setSaving(true);
    try {
      await Promise.all(jobs);
      setPending({});
    } finally {
      setSaving(false);
    }
    return out;
  };

  const go = async (i: number, focus: string | null = null) => {
    if (i !== index) await flush();
    setIndex(i);
    setFocusId(focus);
  };
  /** Tap a cell: edit that player's (or team's) score on that hole. */
  const selectCell = (r: Round, i: number) => go(i, r.id === round.id ? null : r.id);

  const finish = async () => {
    const lists = await flush();
    if (!canFinish) {
      router.back();
      return;
    }
    // Every card you finish (yours and the ones you keep) needs every hole.
    const mine = [round, ...others.filter((r) => r.scoredBy === me && r.status === 'active')];
    const missing = mine.map((r) => (lists.get(r.id) ?? []).findIndex((s) => !s)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (missing !== undefined) {
      setIndex(missing);
      return;
    }
    const completedAt = new Date().toISOString();
    await data.queueRounds(mine.map((r) => ({ ...r, scores: { ...r.scores, [roundOwner(r)]: lists.get(r.id)! }, status: 'complete' as const, completedAt })), { holes: [] });
    haptics.success();
    router.replace(`/round/reveal/${round.id}`);
  };

  const mineNow = toParThru(scores, pars);
  // Head to head when exactly two teams (or two players) are on the course together.
  const rival = others.length === 1 ? others[0] : undefined;
  const match = rival && (scramble || others.length === 1) ? matchStatus(scores, view(rival), round.holeNumbers.length) : undefined;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerRow}>
          <IconButton name="chevron-left" label="Save and exit" onPress={async () => { await flush(); router.back(); }} />
          <Text style={styles.courseName} numberOfLines={1}>{data.roundCourseName(round)}</Text>
          <Text style={styles.running}>{mineNow.thru ? `${formatToPar(mineNow.toPar)} thru ${mineNow.thru}` : ''}</Text>
          <IconButton name="more" label="Round options" onPress={() => setMenu(true)} />
        </View>
        {data.sync.failing ? (
          <Tap onPress={data.retrySync} haptic="tap" scaleTo={0.97} accessibilityRole="button" accessibilityLabel="Offline. Scores are saved on this phone and will upload when you have signal. Tap to retry." style={styles.syncPill}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>Offline · {data.sync.pending} {data.sync.pending === 1 ? 'save' : 'saves'} on this phone, will sync</Text>
          </Tap>
        ) : null}
        <View style={styles.grid}>
          <View style={styles.nameCol}>
            <Text style={styles.gridHeadLabel}>HOLE</Text>
            {rows.map((r) => {
              const t = toParThru(view(r), pars);
              return (
                <View key={r.id} style={styles.nameCell}>
                  <Text style={[styles.nameText, r.id === target.id && styles.nameTextOn]} numberOfLines={1}>{nameOf(r)}</Text>
                  <Text style={styles.nameSub}>{r.status === 'complete' ? 'done' : t.thru ? formatToPar(t.toPar) : '–'}</Text>
                </View>
              );
            })}
          </View>
          <ScrollView ref={gridRef} horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.gridRow}>
                {round.holeNumbers.map((n, i) => (
                  <Tap key={n} haptic={i === index ? 'none' : 'select'} scaleTo={0.9} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={`Hole ${n}`} style={[styles.headCell, i === index && styles.headCellOn]}>
                    <Text style={[styles.headText, i === index && styles.headTextOn]}>{n}</Text>
                  </Tap>
                ))}
              </View>
              {rows.map((r) => {
                const list = view(r);
                return (
                  <View key={r.id} style={styles.gridRow}>
                    {round.holeNumbers.map((n, i) => {
                      const sc = list[i];
                      const focused = r.id === target.id && i === index;
                      const byOther = sc?.enteredBy && sc.enteredBy !== me;
                      return (
                        <Tap
                          key={n}
                          haptic={focused ? 'none' : 'select'}
                          scaleTo={0.9}
                          disabled={r.status === 'complete' && r.id !== round.id}
                          onPress={() => selectCell(r, i)}
                          accessibilityRole="button"
                          accessibilityLabel={`${nameOf(r)}, hole ${n}: ${sc ? sc.strokes : 'not entered'}${byOther ? `, entered by ${data.playerById(sc!.enteredBy!)?.name.split(' ')[0] ?? 'someone else'}` : ''}`}
                          style={[styles.cell, i === index && styles.cellCol, focused && styles.cellFocus]}>
                          <Text style={[styles.cellText, sc && sc.strokes < pars[i] && styles.cellUnder, sc && sc.strokes > pars[i] && styles.cellOver, focused && styles.cellTextFocus]}>{sc ? sc.strokes : '·'}</Text>
                          {byOther ? <View style={[styles.cellDot, focused && { backgroundColor: colors.goldSoft }]} /> : null}
                        </Tap>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
        {match && rival ? (
          <View style={styles.matchBar} accessibilityLiveRegion="polite">
            <Icon name="trophy" size={13} color={colors.gold} />
            <Text style={styles.matchText}>{matchLine(match, nameOf(round), nameOf(rival))}</Text>
          </View>
        ) : null}
        {waiting.length ? <Text style={styles.waiting}>Not joined yet: {waiting.map((p) => p!.name.split(' ')[0]).join(', ')}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeTitle}>Hole {holeNo}</Text>
          <Text style={styles.holeMeta}>Par {hole.par}{yards ? `  ·  ${yards} yds` : ''}  ·  HCP {hole.handicap}</Text>
        </View>

        {editingOther ? (
          <View style={styles.whoseRow}>
            {isScramble(target) ? <AvatarStack players={membersOf(target)} size={22} /> : data.playerById(roundOwner(target)) ? <Avatar player={data.playerById(roundOwner(target))!} size={22} /> : null}
            <Text style={[styles.whose, { color: colors.fairway }]}>Editing {nameOf(target)}</Text>
            <Tap onPress={() => setFocusId(null)} haptic="select" scaleTo={0.94} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.backLink}>Back to {scramble ? 'your team' : 'you'}</Text>
            </Tap>
          </View>
        ) : scramble || others.length ? (
          <View style={styles.whoseRow}>
            {scramble ? <AvatarStack players={membersOf(round)} size={22} /> : null}
            <Text style={styles.whose}>
              {scramble ? `${teamOf(round) ? `Team ${teamOf(round)} · ` : ''}team score` : roundOwner(round) === me ? 'You' : `${data.playerById(roundOwner(round))?.name.split(' ')[0] ?? 'Player'}’s card`}
            </Text>
          </View>
        ) : null}
        <View style={[styles.stepper, scramble || others.length ? { marginTop: -space.lg } : null]}>
          <StepButton icon="minus" label={editingOther ? `One fewer stroke for ${nameOf(target)}` : 'One fewer stroke'} onPress={() => patch({ strokes: Math.max(1, sel.strokes - 1) })} />
          <View style={{ alignItems: 'center', minWidth: 110 }}>
            <Text style={styles.strokes}>{targetStrokes}</Text>
            <Text style={styles.toPar}>
              {(editingOther ? targetScore : scores[index]) ? formatToPar(targetStrokes - hole.par) : 'par · tap ± to change'}
              {(() => {
                const sc = editingOther ? targetScore : scores[index];
                return sc?.enteredBy && sc.enteredBy !== me && !pending[target.id]?.[index] ? ` · by ${data.playerById(sc.enteredBy)?.name.split(' ')[0] ?? 'someone'}` : '';
              })()}
            </Text>
          </View>
          <StepButton icon="plus" label={editingOther ? `One more stroke for ${nameOf(target)}` : 'One more stroke'} onPress={() => patch({ strokes: sel.strokes + 1 })} />
        </View>

        <Field label="Putts">
          <ChoiceRow
            options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: n === 4 ? '4+' : String(n) }))}
            value={sel.putts}
            onChange={(v) => patch({ putts: v })}
          />
        </Field>

        {hole.par > 3 ? (
          <Field label="Fairway">
            <ChoiceRow<FairwayResult>
              options={[{ value: 'left', label: 'Left' }, { value: 'hit', label: 'Hit' }, { value: 'right', label: 'Right' }, { value: 'short', label: 'Short' }]}
              value={sel.fairway}
              onChange={(v) => patch({ fairway: v })}
            />
          </Field>
        ) : null}

        <View style={styles.smallRow}>
          <SmallStepper label="Penalties" value={sel.penalties} onChange={(v) => patch({ penalties: v })} />
          <SmallStepper label="Chips" value={sel.chips} onChange={(v) => patch({ chips: v })} />
          <SmallStepper label="Sand" value={sel.sandShots} onChange={(v) => patch({ sandShots: v })} />
        </View>

        {(() => {
          const gir = deriveGir(sel, hole.par);
          return (
        <Text style={styles.gir}>
          {gir === undefined ? 'GIR: enter putts to calculate' : gir ? 'Green in regulation ✓' : 'Missed green in regulation'}
        </Text>
          );
        })()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button variant="secondary" label="Prev" icon="chevron-left" onPress={() => index > 0 && go(index - 1)} disabled={index === 0 || saving} haptic="tap" />
        <Button
          style={{ flex: 1 }}
          label={isLast ? (canFinish ? 'Finish Round' : 'Save & close') : `Next · Hole ${round.holeNumbers[index + 1]}`}
          onPress={() => (isLast ? finish() : go(index + 1))}
          disabled={saving}
        />
      </View>

      <ActionSheet
        visible={menu}
        title={data.roundCourseName(round)}
        body={canDiscard ? undefined : 'This is a teammate’s card. Your entries are saved as you go; its owner finishes or deletes it.'}
        onClose={() => setMenu(false)}
        actions={[
          { label: canDiscard ? 'Save & exit' : 'Leave', icon: 'chevron-left', onPress: async () => { setMenu(false); await flush(); router.back(); } },
          ...(canDiscard ? [{ label: 'Discard round', icon: 'trash' as const, destructive: true, onPress: () => { setMenu(false); setDiscarding(true); } }] : []),
        ]}
      />
      <DiscardRoundSheet round={round} visible={discarding} onClose={() => setDiscarding(false)} onDone={() => { setDiscarding(false); setPending({}); router.replace('/'); }} />
    </View>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} haptic="select" scaleTo={0.88} accessibilityRole="button" accessibilityLabel={label} style={styles.stepButton}>
      <Icon name={icon} size={30} color={colors.cream} strokeWidth={2.4} />
    </Tap>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={styles.fieldLabel}>{label} <Text style={styles.optional}>optional</Text></Text>
      {children}
    </View>
  );
}

/** Tap to select, tap again to clear (back to "not entered"). */
function ChoiceRow<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T | undefined; onChange: (v: T | undefined) => void }) {
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap key={String(o.value)} haptic="select" scaleTo={0.94} onPress={() => onChange(active ? undefined : o.value)} style={[styles.choice, active && styles.choiceActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
            <Text style={[styles.choiceText, active && { color: colors.cream }]}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

function SmallStepper({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <View style={styles.small}>
      <Text style={styles.smallLabel}>{label}</Text>
      <View style={styles.smallControls}>
        <Tap haptic="select" scaleTo={0.85} onPress={() => onChange(value === undefined || value <= 0 ? undefined : value - 1)} hitSlop={6} accessibilityLabel={`Fewer ${label}`} style={styles.smallBtn}>
          <Icon name="minus" size={16} color={colors.fairway} />
        </Tap>
        <Text style={styles.smallValue}>{value ?? '–'}</Text>
        <Tap haptic="select" scaleTo={0.85} onPress={() => onChange((value ?? 0) + 1)} hitSlop={6} accessibilityLabel={`More ${label}`} style={styles.smallBtn}>
          <Icon name="plus" size={16} color={colors.fairway} />
        </Tap>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.cream, paddingHorizontal: space.lg, paddingBottom: space.sm, gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  courseName: { flex: 1, minWidth: 0, flexShrink: 1, fontFamily: fonts.display, fontSize: 19, color: colors.fairway, marginLeft: space.xs },
  running: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  strip: { gap: 4, paddingVertical: 2 },
  stripDot: { position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  syncPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.goldSoft },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  syncText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink },
  grid: { flexDirection: 'row', backgroundColor: colors.creamLight, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, overflow: 'hidden' },
  nameCol: { width: 78, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.rule, backgroundColor: colors.creamLight },
  gridHeadLabel: { height: 26, lineHeight: 26, paddingLeft: space.sm, fontFamily: fonts.bodySemibold, fontSize: 10, letterSpacing: 1, color: colors.inkMuted },
  nameCell: { height: CELL_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  nameText: { flexShrink: 1, fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  nameTextOn: { color: colors.fairway },
  nameSub: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  gridRow: { flexDirection: 'row' },
  headCell: { width: CELL_W, height: 26, alignItems: 'center', justifyContent: 'center' },
  headCellOn: { backgroundColor: colors.fairway },
  headText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkMuted },
  headTextOn: { fontFamily: fonts.bodyBold, color: colors.cream },
  cell: { width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  cellCol: { backgroundColor: colors.tint },
  cellFocus: { backgroundColor: colors.fairway, borderRadius: 6 },
  cellText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  cellUnder: { color: colors.gold },
  cellOver: { color: colors.inkMuted },
  cellTextFocus: { color: colors.cream },
  cellDot: { position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold },
  backLink: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.fairway, textDecorationLine: 'underline' },
  matchBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 2 },
  matchText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.fairway },
  whoseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  groupTitle: { ...type.caption, color: colors.inkMuted, paddingTop: space.sm },
  groupMembers: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
  waiting: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  stripCell: { width: 36, alignItems: 'center', paddingVertical: 5, borderRadius: radius.sm, backgroundColor: colors.paper },
  stripActive: { backgroundColor: colors.fairway },
  stripHole: { fontFamily: fonts.body, fontSize: 10, color: colors.inkMuted },
  stripScore: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  body: { padding: space.lg, gap: space.xl },
  holeInfo: { alignItems: 'center', gap: 2 },
  holeTitle: { ...type.displayXL, color: colors.fairway },
  holeMeta: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkMuted },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl },
  stepButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  strokes: { ...type.scoreEntry, fontSize: 72, lineHeight: 80, color: colors.ink },
  toPar: { ...type.caption, color: colors.inkMuted },
  fieldLabel: { ...type.label, color: colors.ink },
  optional: { fontFamily: fonts.body, letterSpacing: 0, textTransform: 'none', color: colors.inkMuted, fontSize: 11 },
  choiceRow: { flexDirection: 'row', gap: space.sm },
  choice: { flex: 1, minHeight: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.fairway },
  choiceText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.fairway },
  smallRow: { flexDirection: 'row', gap: space.sm },
  small: { flex: 1, backgroundColor: colors.creamLight, borderRadius: radius.md, padding: space.sm, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.rule },
  smallLabel: { ...type.caption, color: colors.inkMuted },
  smallControls: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  smallBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.2, borderColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  smallValue: { fontFamily: fonts.bodySemibold, fontSize: 17, color: colors.ink, minWidth: 16, textAlign: 'center' },
  gir: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  whose: { ...type.label, color: colors.inkMuted, textAlign: 'center' },
  group: { backgroundColor: colors.creamLight, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, paddingHorizontal: space.md },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, minHeight: 56 },
  groupName: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  groupSub: { ...type.caption, color: colors.inkMuted },
  groupBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.fairway, alignItems: 'center', justifyContent: 'center' },
  groupStrokes: { fontFamily: fonts.bodyBold, fontSize: 24, color: colors.ink, minWidth: 34, textAlign: 'center', fontVariant: ['tabular-nums'] },
  groupStrokesUnset: { color: colors.inkMuted },
  footer: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule, backgroundColor: colors.cream },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.fairway },
  navText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway },
  nextButton: { flex: 1, backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  nextText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.cream },
}));
