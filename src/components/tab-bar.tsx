import type { BottomTabBarProps } from 'expo-router/tabs';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { colors, fonts } from '@/theme';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  rounds: 'flag',
  courses: 'pin',
  collection: 'layers',
};

/** Fairway tab bar: Home · Rounds · (+) · Courses · Collection. The center + starts a round. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => r.name in TAB_ICONS);
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.indexOf(route);
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const tint = focused ? colors.cream : 'rgba(242,230,207,0.6)';
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        style={styles.tab}>
        <Icon name={TAB_ICONS[route.name]} color={tint} size={23} strokeWidth={focused ? 1.9 : 1.6} />
        <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodySemibold : fonts.bodyMedium }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {routes.slice(0, half).map(renderTab)}
      <View style={styles.tab}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a round"
          onPress={() => router.push('/round/new')}
          style={({ pressed }) => [styles.plus, pressed && { transform: [{ scale: 0.94 }] }]}>
          <Icon name="plus" color={colors.fairway} size={26} strokeWidth={2.2} />
        </Pressable>
      </View>
      {routes.slice(half).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.fairway,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, letterSpacing: 0.2 },
  plus: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    borderWidth: 2,
    borderColor: colors.gold,
  },
});
