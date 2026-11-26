import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={10} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}>
      <Icon name={name} color={color} size={size} />
    </Pressable>
  );
}

/** Segmented pill chips (All · Played · Wishlist …). */
export function Chips<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Icon name="chevron-right" size={14} color={colors.ink} />
        </Pressable>
      ) : action ? (
        <Text style={styles.sectionActionText}>{action}</Text>
      ) : null}
    </View>
  );
}

export function ListRow({ icon, label, onPress, right }: { icon?: IconName; label: string; onPress?: () => void; right?: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.goldSoft + '55' }]}>
      {icon ? <Icon name={icon} size={20} color={colors.ink} /> : null}
      <Text style={styles.listRowText}>{label}</Text>
      {right ?? <Icon name="chevron-right" size={16} color={colors.inkMuted} />}
    </Pressable>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, style, pressed && { transform: [{ scale: 0.985 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
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
  chips: { flexDirection: 'row', backgroundColor: colors.paper, borderRadius: radius.pill, padding: 3, gap: 2 },
  chip: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingVertical: 8, paddingHorizontal: 10, borderRadius: radius.pill, alignItems: 'center' },
  chipActive: { backgroundColor: colors.fairway },
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
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.inkMuted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  empty: { padding: space.xl, gap: space.sm, alignItems: 'center' },
});
