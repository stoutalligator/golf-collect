import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { Animated, CountUp, SPRING, Tap, useFill } from '@/components/motion';
import type { HapticKind } from '@/lib/haptics';
import { colors, fonts, radius, shadow, space, type } from '@/theme';

/** Fairway header + cream rounded body (board 03 "sheet" look). */
export function SheetScreen({ title, back, right, children, scroll = true, headerExtra }: {
  title: string; back?: boolean; right?: ReactNode; children: ReactNode; scroll?: boolean; headerExtra?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerRow}>
          {back ? <IconButton name="chevron-left" onPress={() => router.back()} label="Back" /> : null}
          <Text style={[styles.headerTitle, back && { marginLeft: space.xs }]} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          <View style={{ flex: 1 }} />
          {right}
        </View>
        {headerExtra}
      </View>
      <View style={styles.sheet}>
        <Body {...(scroll ? { contentContainerStyle: styles.sheetContent } : { style: [styles.sheetContent, { flex: 1 }] })}>
          {children}
        </Body>
      </View>
    </View>
  );
}

export function IconButton({ name, onPress, label, color = colors.cream, size = 22 }: {
  name: IconName; onPress: () => void; label: string; color?: string; size?: number;
}) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={10} scaleTo={0.86} dim style={styles.iconButton}>
      <Icon name={name} color={color} size={size} />
    </Tap>
  );
}

/** Segmented pill chips (All · Played · Wishlist …): the selected pill springs between options. */
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
    <View style={styles.chips}>
      <Animated.View pointerEvents="none" style={[styles.chipPill, pill]} />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap
            key={o.value}
            onLayout={onLayout(o.value)}
            onPress={() => !active && onChange(o.value)}
            haptic={active ? 'none' : 'select'}
            scaleTo={0.94}
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
      />
    </View>
  );
}

export function StatTile({ value, label, style }: { value: string | number; label: string; style?: ViewStyle }) {
  return (
    <View style={[styles.statTile, style]}>
      {typeof value === 'number' ? <CountUp value={value} style={styles.statValue} /> : <Text style={styles.statValue}>{value}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Tap onPress={onAction} hitSlop={8} accessibilityRole="button" scaleTo={0.94} dim style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Icon name="chevron-right" size={14} color={colors.ink} />
        </Tap>
      ) : action ? (
        <Text style={styles.sectionActionText}>{action}</Text>
      ) : null}
    </View>
  );
}

export function ListRow({ icon, label, onPress, right }: { icon?: IconName; label: string; onPress?: () => void; right?: ReactNode }) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" scaleTo={0.985} dim style={styles.listRow}>
      {icon ? <Icon name={icon} size={20} color={colors.ink} /> : null}
      <Text style={styles.listRowText}>{label}</Text>
      {right ?? <Icon name="chevron-right" size={16} color={colors.inkMuted} />}
    </Tap>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const fill = useFill(max > 0 ? Math.min(1, value / max) : 0);
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, fill]} />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Tap onPress={onPress} accessibilityRole="button" scaleTo={0.975} style={[styles.card, style]}>
        {children}
      </Tap>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Primary (filled fairway) and secondary (outlined) pill buttons with depth, a pressed state and haptics. */
export function Button({ label, onPress, variant = 'primary', icon, disabled, haptic, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary'; icon?: IconName; disabled?: boolean; haptic?: HapticKind; style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      haptic={haptic ?? (primary ? 'press' : 'tap')}
      scaleTo={0.96}
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

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[type.displayS, { color: colors.fairway, textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.body, { color: colors.inkMuted, textAlign: 'center' }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.fairway },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  headerTitle: { ...type.displayL, color: colors.cream, flexShrink: 1 },
  iconButton: { padding: 4 },
  sheet: { flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  sheetContent: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  chips: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: radius.pill, padding: 3, gap: 2, position: 'relative' },
  chipPill: { position: 'absolute', top: 3, bottom: 3, left: 0, borderRadius: radius.pill, backgroundColor: colors.fairway, ...shadow.card },
  chip: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: 'center' },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  chipTextActive: { color: colors.cream, fontFamily: fonts.bodySemibold },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.creamLight, borderRadius: radius.pill, paddingHorizontal: space.lg, height: 42, borderWidth: 1, borderColor: colors.rule },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink, outlineStyle: 'none' } as never,
  statTile: { flex: 1, backgroundColor: colors.creamLight, borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center', gap: 2, ...shadow.card },
  statValue: { ...type.stat, color: colors.ink },
  statLabel: { ...type.caption, color: colors.inkMuted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...type.displayS, color: colors.ink },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, paddingHorizontal: space.xs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  listRowText: { flex: 1, ...type.body, color: colors.ink },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.rule, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#8C7A2E' },
  card: { backgroundColor: colors.creamLight, borderRadius: radius.lg, ...shadow.card, overflow: 'hidden' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.fairway, borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: space.xl, borderWidth: 1, borderColor: 'rgba(201,163,90,0.45)', shadowColor: colors.fairwayDeep, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  btnPrimaryText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.cream, letterSpacing: 0.3 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, backgroundColor: colors.creamLight, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: space.xl, borderWidth: 1.5, borderColor: colors.fairway },
  btnSecondaryText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.fairway, letterSpacing: 0.2 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.inkMuted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  empty: { padding: space.xl, gap: space.sm, alignItems: 'center' },
});
