/**
 * Compact date and tee-time pickers (scheduling a round, league rounds). Pure JS, no native picker:
 * - DatePicker: Today · Tomorrow · Sat · Sun quick picks, plus "Other date" with a month calendar.
 * - TeeTimePicker: one big time with − / + (10 minutes a tap, hold to run) and a "No set time" toggle.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { addDaysISO, formatTeeTime, todayISO } from '@/lib/format';
import { colors, fonts, radius, space, themed, type } from '@/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const at = (iso: string) => new Date(`${iso}T12:00:00`);
const short = (iso: string) => at(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** The next given weekday (0 = Sunday) on or after `from`. */
const nextWeekday = (from: string, day: number) => addDaysISO(from, (day - at(from).getDay() + 7) % 7);

export function DatePicker({ value, onChange, min = todayISO() }: { value: string; onChange: (d: string) => void; min?: string }) {
  const today = todayISO();
  const quick = useMemo(() => {
    const list = [
      { d: today, label: 'Today' },
      { d: addDaysISO(today, 1), label: 'Tomorrow' },
      { d: nextWeekday(addDaysISO(today, 2), 6), label: '' },
      { d: nextWeekday(addDaysISO(today, 2), 0), label: '' },
    ];
    const seen = new Set<string>();
    return list
      .filter((q) => q.d >= min && !seen.has(q.d) && seen.add(q.d))
      .map((q) => ({ ...q, label: q.label || `${at(q.d).toLocaleDateString('en-US', { weekday: 'short' })} ${at(q.d).getDate()}` }));
  }, [today, min]);
  const isQuick = quick.some((q) => q.d === value);
  const [open, setOpen] = useState(!isQuick);

  return (
    <View style={{ gap: space.sm }}>
      <View style={styles.dateRow}>
        {quick.map((q) => {
          const on = q.d === value;
          return (
            <Tap key={q.d} onPress={() => { onChange(q.d); setOpen(false); }} haptic={on ? 'none' : 'select'} scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={short(q.d)} style={[styles.dateChip, on && styles.on]}>
              <Text style={[styles.dateChipText, on && styles.onText]} numberOfLines={1}>{q.label}</Text>
            </Tap>
          );
        })}
        <Tap onPress={() => setOpen((o) => !o)} haptic="select" scaleTo={0.92} accessibilityRole="button" accessibilityLabel={isQuick ? 'Pick another date' : `Picked ${short(value)}, change date`} accessibilityState={{ selected: !isQuick, expanded: open }} style={[styles.calChip, (!isQuick || open) && styles.on]}>
          <Icon name="calendar" size={18} color={!isQuick || open ? colors.cream : colors.fairway} />
        </Tap>
      </View>
      {!isQuick ? <Text style={styles.picked}>{at(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text> : null}
      {open ? <MonthCalendar value={value} onChange={(d) => { onChange(d); setOpen(false); }} min={min} /> : null}
    </View>
  );
}

function MonthCalendar({ value, onChange, min }: { value: string; onChange: (d: string) => void; min: string }) {
  const [month, setMonth] = useState(() => { const d = at(value); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(month.y, month.m, 1, 12);
  const days = new Date(month.y, month.m + 1, 0, 12).getDate();
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => iso(month.y, month.m, i + 1))];
  const minMonth = at(min);
  const canBack = month.y > minMonth.getFullYear() || (month.y === minMonth.getFullYear() && month.m > minMonth.getMonth());
  const step = (n: number) => setMonth(({ y, m }) => { const d = new Date(y, m + n, 1, 12); return { y: d.getFullYear(), m: d.getMonth() }; });
  const today = todayISO();

  return (
    <View style={styles.cal}>
      <View style={styles.calHead}>
        <Tap onPress={() => step(-1)} disabled={!canBack} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={8} style={[styles.calArrow, !canBack && { opacity: 0.3 }]}>
          <Icon name="chevron-left" size={18} color={colors.fairway} />
        </Tap>
        <Text style={styles.calTitle}>{first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
        <Tap onPress={() => step(1)} haptic="select" scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Next month" hitSlop={8} style={styles.calArrow}>
          <Icon name="chevron-right" size={18} color={colors.fairway} />
        </Tap>
      </View>
      <View style={styles.calGrid}>
        {WEEKDAYS.map((w, i) => <Text key={`h${i}`} style={styles.calDow}>{w}</Text>)}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.calCell} />;
          const on = d === value;
          const past = d < min;
          return (
            <View key={d} style={styles.calCell}>
              <Tap onPress={() => onChange(d)} disabled={past} haptic={on ? 'none' : 'select'} scaleTo={0.88} accessibilityRole="button" accessibilityState={{ selected: on, disabled: past }} accessibilityLabel={short(d)} style={[styles.calDay, on && styles.on, d === today && !on && styles.calToday]}>
                <Text style={[styles.calDayText, on && styles.onText, past && styles.calPast]}>{Number(d.slice(8))}</Text>
              </Tap>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const shift = (t: string, minutes: number) => {
  const [h, m] = t.split(':').map(Number);
  const total = Math.min(20 * 60, Math.max(5 * 60, h * 60 + m + minutes));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** Tee time: − / + ten minutes (hold to run), or no set time. */
export function TeeTimePicker({ value, onChange, fallback = '08:00' }: { value: string | undefined; onChange: (t: string | undefined) => void; fallback?: string }) {
  const latest = useRef(value);
  useEffect(() => { latest.current = value; }, [value]);
  const nudge = (n: number) => onChange(shift(latest.current ?? fallback, n));
  return (
    <View style={styles.timeRow}>
      <View style={[styles.timeBox, !value && { opacity: 0.45 }]}>
        <HoldButton icon="minus" label="Ten minutes earlier" onStep={() => nudge(-10)} />
        <Text style={styles.timeValue} accessibilityLiveRegion="polite">{formatTeeTime(value ?? fallback)}</Text>
        <HoldButton icon="plus" label="Ten minutes later" onStep={() => nudge(10)} />
      </View>
      <Tap onPress={() => onChange(value ? undefined : fallback)} haptic="select" scaleTo={0.95} accessibilityRole="button" accessibilityState={{ selected: !value }} style={[styles.chip, !value && styles.on]}>
        <Text style={[styles.chipText, !value && styles.onText]}>No set time</Text>
      </Tap>
    </View>
  );
}

/** Steps once on tap; held, it keeps stepping (faster after a moment). */
function HoldButton({ icon, label, onStep }: { icon: 'plus' | 'minus'; label: string; onStep: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeated = useRef(false);
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const run = (delay: number, count: number) => {
    timer.current = setTimeout(() => { repeated.current = true; onStep(); run(count > 6 ? 70 : 140, count + 1); }, delay);
  };
  useEffect(() => stop, []);
  return (
    <Tap
      onPressIn={() => { repeated.current = false; run(420, 0); }}
      onPressOut={stop}
      onPress={() => { if (!repeated.current) onStep(); }}
      haptic="select"
      scaleTo={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={styles.stepBtn}>
      <Icon name={icon} size={18} color={colors.fairway} />
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  dateRow: { flexDirection: 'row', gap: 6 },
  dateChip: { flex: 1, minHeight: 40, paddingHorizontal: 4, borderRadius: radius.pill, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  dateChipText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  calChip: { width: 44, minHeight: 40, borderRadius: radius.pill, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  picked: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.fairway },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 38, borderRadius: radius.pill, backgroundColor: colors.paper },
  chipText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  on: { backgroundColor: colors.fairway },
  onText: { color: colors.cream },
  cal: { backgroundColor: colors.creamLight, borderRadius: radius.lg, padding: space.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  calArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDow: { width: `${100 / 7}%` as never, textAlign: 'center', ...type.caption, fontSize: 11, color: colors.inkMuted, paddingBottom: 4 },
  calCell: { width: `${100 / 7}%` as never, alignItems: 'center', paddingVertical: 2 },
  calDay: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calToday: { borderWidth: 1.5, borderColor: colors.fairway },
  calDayText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink, fontVariant: ['tabular-nums'] },
  calPast: { color: colors.rule },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  timeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.paper, borderRadius: radius.pill, padding: 4 },
  timeValue: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, fontVariant: ['tabular-nums'] },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.creamLight, alignItems: 'center', justifyContent: 'center' },
}));
