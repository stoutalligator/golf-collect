import { router } from 'expo-router';
import { Children, Fragment, isValidElement, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { Animated, CountUp, SPRING, Tap, useFill } from '@/components/motion';
import type { HapticKind } from '@/lib/haptics';
import { colors, fonts, radius, shadow, space, themed, type } from '@/theme';

// ── Screen chrome ──────────────────────────────────────────────────────────

/**
 * Standard screen: cream page, large serif title, round icon buttons (back on the left, actions on the right).
 * One header system for every non-hero screen.
 */
export function SheetScreen({ title, back, right, children, scroll = true, headerExtra }: {
  title: string; back?: boolean; right?: ReactNode; children: ReactNode; scroll?: boolean; headerExtra?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.xs }]}>
        <View style={styles.headerRow}>
          {back ? <IconButton name="chevron-left" onPress={() => router.back()} label="Back" /> : null}
          <Text style={[styles.headerTitle, back && { marginLeft: space.md }]} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.headerRight}>{right}</View>
        </View>
        {headerExtra}
      </View>
      <Body
        {...(scroll
          ? { contentContainerStyle: styles.content, keyboardShouldPersistTaps: 'handled' as const }
          : { style: [styles.content, { flex: 1 }] })}>
        {children}
      </Body>
    </View>
  );
}

/** Round icon button on a soft fill. `onArt` gives it a translucent cream fill for use over paintings. */
export function IconButton({ name, onPress, label, onArt = false, size = 20 }: {
  name: IconName; onPress: () => void; label: string; onArt?: boolean; size?: number;
}) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} scaleTo={0.9} style={[styles.iconButton, onArt && styles.iconButtonOnArt]}>
      <Icon name={name} color={colors.fairway} size={size} strokeWidth={1.8} />
    </Tap>
  );
}

// ── Controls ───────────────────────────────────────────────────────────────

/** iOS-style segmented control: the selected segment is a raised light pill that slides between options. */
export function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const [frames, setFrames] = useState<Record<string, { x: number; w: number }>>({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const ready = useSharedValue(0);
  const f = frames[value];
  useEffect(() => {
    if (!f) return;
    if (ready.value === 0) {
      x.value = f.x;
      w.value = f.w;
      ready.value = 1;
    } else {
      x.value = withSpring(f.x, SPRING);
      w.value = withSpring(f.w, SPRING);
    }
  }, [f, x, w, ready]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: w.value, opacity: ready.value }));
  const onLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x: lx, width } = e.nativeEvent.layout;
    setFrames((prev) => (prev[key]?.x === lx && prev[key]?.w === width ? prev : { ...prev, [key]: { x: lx, w: width } }));
  };
  return (
    <View style={styles.chips} accessibilityRole="tablist">
      <Animated.View pointerEvents="none" style={[styles.chipPill, pill]} />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap
            key={o.value}
            onLayout={onLayout(o.value)}
            onPress={() => !active && onChange(o.value)}
            haptic={active ? 'none' : 'select'}
            scaleTo={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.chip}>
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{o.label}</Text>
          </Tap>
        );
      })}
    </View>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <Icon name="search" size={18} color={colors.inkMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        style={styles.searchInput}
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

/** Small outlined pill with a chevron ("See All ›"), used as a section's trailing action. */
export function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} scaleTo={0.95} style={styles.pillButton}>
      <Text style={styles.pillButtonText}>{label}</Text>
      <Icon name="chevron-right" size={13} color={colors.ink} strokeWidth={2} />
    </Tap>
  );
}

// ── Figures ────────────────────────────────────────────────────────────────

export interface StatItem {
  label: string;
  value: string | number;
  icon?: IconName;
  /** Small line under the label (e.g. "est. index"). */
  sub?: string;
  /** Replaces `sub` with a custom node (e.g. a sparkline). */
  extra?: ReactNode;
  onPress?: () => void;
}

/** One cohesive strip of 2–4 headline numbers with hairline dividers (Home, profiles, Trophy Room, Stats). */
export function StatStrip({ items, style, compact = false }: { items: StatItem[]; style?: StyleProp<ViewStyle>; compact?: boolean }) {
  return (
    <View style={[styles.strip, compact && styles.stripCompact, style]}>
      {items.map((it, i) => {
        const body = (
          <>
            {it.icon ? <Icon name={it.icon} size={20} color={colors.gold} strokeWidth={1.7} /> : null}
            {typeof it.value === 'number'
              ? <CountUp value={it.value} style={[styles.stripValue, compact && styles.stripValueCompact]} />
              : <Text style={[styles.stripValue, compact && styles.stripValueCompact]}>{it.value}</Text>}
            <Text style={styles.stripLabel} numberOfLines={1}>{it.label}</Text>
            {it.extra ?? (it.sub ? <Text style={styles.stripSub} numberOfLines={1}>{it.sub}</Text> : null)}
          </>
        );
        return (
          <Fragment key={it.label}>
            {i > 0 ? <View style={styles.stripRule} /> : null}
            {it.onPress ? (
              <Tap onPress={it.onPress} scaleTo={0.96} accessibilityRole="button" accessibilityLabel={`${it.label} ${it.value}`} style={styles.stripItem}>{body}</Tap>
            ) : (
              <View style={styles.stripItem} accessible accessibilityLabel={`${it.label} ${it.value}`}>{body}</View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

/** Single stat tile (kept for small grids). Prefer `StatStrip` for headline rows. */
export function StatTile({ value, label, style }: { value: string | number; label: string; style?: ViewStyle }) {
  return (
    <View style={[styles.statTile, style]}>
      {typeof value === 'number' ? <CountUp value={value} style={styles.statValue} /> : <Text style={styles.statValue}>{value}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
      <View style={{ flex: 1 }} />
      {action && onAction ? <PillButton label={action} onPress={onAction} /> : action ? <Text style={styles.sectionNote}>{action}</Text> : null}
    </View>
  );
}

// ── Surfaces ───────────────────────────────────────────────────────────────

/** Raised surface. Tappable when `onPress` is given. Use sparingly; prefer `Group` for lists. */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Tap onPress={onPress} accessibilityRole="button" scaleTo={0.98} style={[styles.card, style]}>
        {children}
      </Tap>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Grouped list: one raised surface, children separated by inset hairlines (iOS inset-grouped style). */
export function Group({ children, style, inset = space.lg }: { children: ReactNode; style?: StyleProp<ViewStyle>; inset?: number }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.group, style]}>
      {rows.map((row, i) => (
        <Fragment key={(row.key as string) ?? i}>
          {i > 0 ? <View style={[styles.groupRule, { marginLeft: inset, marginRight: inset }]} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

/** Row inside a `Group`: optional leading icon, title + subtitle, trailing accessory, chevron when tappable. */
export function ListRow({ icon, label, sub, onPress, right, chevron = true }: {
  icon?: IconName; label: string; sub?: string; onPress?: () => void; right?: ReactNode; chevron?: boolean;
}) {
  const content = (
    <>
      {icon ? <View style={styles.rowIcon}><Icon name={icon} size={18} color={colors.fairway} /></View> : null}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
      {onPress && chevron ? <Icon name="chevron-right" size={16} color={colors.inkMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.listRow}>{content}</View>;
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${label}, ${sub}` : label} scaleTo={0.985} style={styles.listRow}>
      {content}
    </Tap>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const fill = useFill(max > 0 ? Math.min(1, value / max) : 0);
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <Animated.View style={[styles.progressFill, fill]} />
    </View>
  );
}

/** Primary (filled forest) and secondary (outlined) pill buttons. */
export function Button({ label, onPress, variant = 'primary', icon, disabled, haptic, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary'; icon?: IconName; disabled?: boolean; haptic?: HapticKind; style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      haptic={haptic ?? (primary ? 'press' : 'tap')}
      scaleTo={0.97}
      swish={!disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[primary ? styles.btnPrimary : styles.btnSecondary, disabled && { opacity: 0.4 }, style]}>
      {icon ? <Icon name={icon} size={18} color={primary ? colors.cream : colors.fairway} /> : null}
      <Text style={primary ? styles.btnPrimaryText : styles.btnSecondaryText}>{label}</Text>
    </Tap>
  );
}

export function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.check, checked && styles.checkOn]}>
      {checked ? <Icon name="check" size={14} color={colors.cream} strokeWidth={2.4} /> : null}
    </View>
  );
}

/** Small lock marker for not-yet-earned collectibles and badges (shape + icon, not just dimming). */
export function LockMark({ size = 20 }: { size?: number }) {
  return (
    <View style={[styles.lock, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name="lock" size={size * 0.55} color={colors.cream} strokeWidth={2} />
    </View>
  );
}

/** Centered spinner with an optional line of text (used while a course scorecard loads). */
export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.fairway} />
      {label ? <Text style={[type.caption, { color: colors.inkMuted }]}>{label}</Text> : null}
    </View>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[type.displayS, { color: colors.fairway, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.body, { color: colors.inkMuted, textAlign: 'center' }]}>{body}</Text> : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: space.lg, paddingBottom: space.sm, gap: space.md, backgroundColor: colors.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  headerTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.fairway, flexShrink: 1 },
  headerRight: { flexDirection: 'row', gap: space.sm },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm, gap: space.xl, paddingBottom: space.xxl * 3 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  iconButtonOnArt: { backgroundColor: colors.artButton, ...shadow.control },
  chips: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: radius.md, padding: 3, position: 'relative' },
  chipPill: { position: 'absolute', top: 3, bottom: 3, left: 0, borderRadius: 10, backgroundColor: colors.segment, ...shadow.control },
  chip: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  chipTextActive: { color: colors.fairway, fontFamily: fonts.bodySemibold },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.paper, borderRadius: radius.md, paddingHorizontal: space.md, height: 44 },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, outlineStyle: 'none' } as never,
  pillButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 14, paddingRight: 10, height: 32, borderRadius: radius.pill, backgroundColor: colors.creamLight, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule },
  pillButtonText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  strip: { flexDirection: 'row', backgroundColor: colors.creamLight, borderRadius: radius.xl, paddingVertical: space.lg, paddingHorizontal: space.xs, ...shadow.card },
  stripCompact: { paddingVertical: space.md },
  stripItem: { flex: 1, alignItems: 'center', gap: 2, justifyContent: 'center' },
  stripRule: { width: StyleSheet.hairlineWidth, backgroundColor: colors.rule, marginVertical: space.sm },
  stripValue: { fontFamily: fonts.displayBold, fontSize: 30, lineHeight: 36, color: colors.ink, marginTop: 2 },
  stripValueCompact: { fontSize: 22, lineHeight: 28 },
  stripLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  stripSub: { ...type.caption, fontSize: 11, color: colors.inkMuted },
  statTile: { flex: 1, backgroundColor: colors.creamLight, borderRadius: radius.lg, paddingVertical: space.md, alignItems: 'center', gap: 2, ...shadow.card },
  statValue: { ...type.stat, color: colors.ink },
  statLabel: { ...type.caption, color: colors.inkMuted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: -space.sm },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.fairway },
  sectionCount: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkMuted, marginTop: 4 },
  sectionNote: { ...type.caption, color: colors.inkMuted },
  card: { backgroundColor: colors.creamLight, borderRadius: radius.xl, ...shadow.card },
  group: { backgroundColor: colors.creamLight, borderRadius: radius.xl, ...shadow.card },
  groupRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.rule },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, paddingHorizontal: space.lg, minHeight: 56 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  rowSub: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.paper, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.gold },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.fairway, borderRadius: radius.pill, minHeight: 54, paddingHorizontal: space.xl, ...shadow.card },
  btnPrimaryText: { fontFamily: fonts.bodySemibold, fontSize: 17, color: colors.cream, letterSpacing: 0.2 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.creamLight, borderRadius: radius.pill, minHeight: 48, paddingHorizontal: space.xl, borderWidth: 1, borderColor: colors.rule },
  btnSecondaryText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.inkMuted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  lock: { backgroundColor: colors.inkMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.creamLight },
  empty: { padding: space.xl, gap: space.sm, alignItems: 'center' },
  loading: { flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.cream },
}));
