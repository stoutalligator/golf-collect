import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { Empty, IconButton } from '@/components/ui';
import { deriveGir, formatToPar } from '@/domain/stats';
import type { FairwayResult, HoleScore, Round } from '@/domain/types';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/** Hole-by-hole entry. Only strokes are required; every other stat can stay blank. */
export default function PlayRound() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useAppData();
  const stored = data.rounds.find((r) => r.id === id);
  const [round, setRound] = useState<Round | undefined>(stored);
  const [index, setIndex] = useState(() => {
    const first = stored?.scores[stored.playerIds[0]]?.findIndex((s) => !s) ?? 0;
    return first < 0 ? 0 : first;
  });

  useEffect(() => {
    if (!round && stored) setRound(stored);
  }, [round, stored]);

  const layout = round ? data.layoutFor(round) : undefined;
  if (!round || !layout) return <Empty title="Round not found" body="" />;

  const me = round.playerIds[0];
  const holeNo = round.holeNumbers[index];
  const hole = layout.holes.find((h) => h.number === holeNo)!;
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const tee = course?.tees.find((t) => t.id === round.teeId);
  const yards = tee?.yardages?.[holeNo - 1];
  const scores = round.scores[me];
  const current: HoleScore = scores[index] ?? { strokes: hole.par };
  const isLast = index === round.holeNumbers.length - 1;
  const gir = deriveGir(current, hole.par);

  const patch = (p: Partial<HoleScore>) => {
    tick();
    const next = { ...current, ...p };
    (Object.keys(next) as (keyof HoleScore)[]).forEach((k) => next[k] === undefined && delete next[k]);
    const nextScores = scores.slice();
    nextScores[index] = next;
    setRound({ ...round, scores: { ...round.scores, [me]: nextScores } });
  };

  /** Commit the current hole (strokes default to par if untouched) and persist. */
  const commit = async (extra?: Partial<Round>) => {
    const nextScores = scores.slice();
    nextScores[index] = current;
    const next = { ...round, scores: { ...round.scores, [me]: nextScores }, ...extra };
    setRound(next);
    await data.saveRound(next);
    return next;
  };

  const go = async (i: number) => {
    await commit();
    setIndex(i);
  };

  const finish = async () => {
    const next = await commit();
    const allScored = next.scores[me].every(Boolean);
    if (!allScored) {
      const missing = next.scores[me].findIndex((s) => !s);
      setIndex(missing);
      return;
    }
    await data.saveRound({ ...next, status: 'complete', completedAt: new Date().toISOString() });
    router.replace(`/round/${next.id}`);
  };

  const runningToPar = scores.reduce((acc, s, i) => {
    const h = layout.holes.find((x) => x.number === round.holeNumbers[i]);
    return s && h ? acc + s.strokes - h.par : acc;
  }, 0);
  const thru = scores.filter(Boolean).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerRow}>
          <IconButton name="chevron-left" label="Save and exit" onPress={async () => { await commit(); router.back(); }} />
          <Text style={styles.courseName} numberOfLines={1}>{data.roundCourseName(round)}</Text>
          <Text style={styles.running}>{thru ? `${formatToPar(runningToPar)} thru ${thru}` : ''}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {round.holeNumbers.map((n, i) => {
            const s = scores[i];
            const h = layout.holes.find((x) => x.number === n)!;
            const active = i === index;
            return (
              <Pressable key={n} onPress={() => go(i)} style={[styles.stripCell, active && styles.stripActive]} accessibilityRole="button" accessibilityLabel={`Hole ${n}`}>
                <Text style={[styles.stripHole, active && { color: colors.fairway }]}>{n}</Text>
                <Text style={[styles.stripScore, active && { color: colors.fairway }, s && s.strokes < h.par && { color: colors.gold }]}>{s ? s.strokes : '·'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.holeInfo}>
          <Text style={styles.holeTitle}>Hole {holeNo}</Text>
          <Text style={styles.holeMeta}>Par {hole.par}{yards ? `  ·  ${yards} yds` : ''}  ·  HCP {hole.handicap}</Text>
        </View>

        <View style={styles.stepper}>
          <StepButton icon="minus" label="One fewer stroke" onPress={() => patch({ strokes: Math.max(1, current.strokes - 1) })} />
          <View style={{ alignItems: 'center', minWidth: 110 }}>
            <Text style={styles.strokes}>{current.strokes}</Text>
            <Text style={styles.toPar}>{scores[index] ? formatToPar(current.strokes - hole.par) : 'par · tap ± to change'}</Text>
          </View>
          <StepButton icon="plus" label="One more stroke" onPress={() => patch({ strokes: current.strokes + 1 })} />
        </View>

        <Field label="Putts">
          <ChoiceRow
            options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: n === 4 ? '4+' : String(n) }))}
            value={current.putts}
            onChange={(v) => patch({ putts: v })}
          />
        </Field>

        {hole.par > 3 ? (
          <Field label="Fairway">
            <ChoiceRow<FairwayResult>
              options={[{ value: 'left', label: 'Left' }, { value: 'hit', label: 'Hit' }, { value: 'right', label: 'Right' }, { value: 'short', label: 'Short' }]}
              value={current.fairway}
              onChange={(v) => patch({ fairway: v })}
            />
          </Field>
        ) : null}

        <View style={styles.smallRow}>
          <SmallStepper label="Penalties" value={current.penalties} onChange={(v) => patch({ penalties: v })} />
          <SmallStepper label="Chips" value={current.chips} onChange={(v) => patch({ chips: v })} />
          <SmallStepper label="Sand" value={current.sandShots} onChange={(v) => patch({ sandShots: v })} />
        </View>

        <Text style={styles.gir}>
          {gir === undefined ? 'GIR: enter putts to calculate' : gir ? 'Green in regulation ✓' : 'Missed green in regulation'}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Pressable onPress={() => index > 0 && go(index - 1)} disabled={index === 0} style={[styles.navButton, index === 0 && { opacity: 0.35 }]} accessibilityRole="button">
          <Icon name="chevron-left" size={18} color={colors.fairway} />
          <Text style={styles.navText}>Prev</Text>
        </Pressable>
        <Pressable onPress={() => (isLast ? finish() : go(index + 1))} style={styles.nextButton} accessibilityRole="button">
          <Text style={styles.nextText}>{isLast ? 'Finish Round' : `Next · Hole ${round.holeNumbers[index + 1]}`}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepButton({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.stepButton, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Icon name={icon} size={30} color={colors.cream} strokeWidth={2.4} />
    </Pressable>
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
          <Pressable key={String(o.value)} onPress={() => onChange(active ? undefined : o.value)} style={[styles.choice, active && styles.choiceActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
            <Text style={[styles.choiceText, active && { color: colors.cream }]}>{o.label}</Text>
          </Pressable>
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
        <Pressable onPress={() => onChange(value === undefined || value <= 0 ? undefined : value - 1)} hitSlop={6} accessibilityLabel={`Fewer ${label}`} style={styles.smallBtn}>
          <Icon name="minus" size={16} color={colors.fairway} />
        </Pressable>
        <Text style={styles.smallValue}>{value ?? '–'}</Text>
        <Pressable onPress={() => onChange((value ?? 0) + 1)} hitSlop={6} accessibilityLabel={`More ${label}`} style={styles.smallBtn}>
          <Icon name="plus" size={16} color={colors.fairway} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.fairway, paddingHorizontal: space.md, paddingBottom: space.sm, gap: space.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  courseName: { flex: 1, fontFamily: fonts.display, fontSize: 18, color: colors.cream },
  running: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.goldSoft },
  strip: { gap: 4, paddingVertical: 2 },
  stripCell: { width: 34, alignItems: 'center', paddingVertical: 4, borderRadius: radius.sm },
  stripActive: { backgroundColor: colors.cream },
  stripHole: { fontFamily: fonts.body, fontSize: 10, color: colors.goldSoft },
  stripScore: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.cream },
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
  footer: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.rule, backgroundColor: colors.cream },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.fairway },
  navText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway },
  nextButton: { flex: 1, backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  nextText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.cream },
});
