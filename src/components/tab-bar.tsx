import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { Animated, Tap } from '@/components/motion';
import { colors, fonts } from '@/theme';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  courses: 'pin',
  stats: 'chart',
  collection: 'layers',
};

/** Icon that lifts and settles when its tab becomes active. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    if (focused)
      lift.value = withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 220, easing: Easing.inOut(Easing.cubic) }),
      );
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * lift.value }, { scale: 1 + 0.08 * lift.value }] }));
  const tint = focused ? colors.fairway : colors.inkMuted;
  return (
    <Animated.View style={style}>
      <Icon name={name} color={tint} size={24} strokeWidth={focused ? 2.1 : 1.6} />
    </Animated.View>
  );
}

/** Fairway tab bar: Home · Courses · (+) · Stats · Collection. The center + starts a round. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => r.name in TAB_ICONS);
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.indexOf(route);
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;
    const tint = focused ? colors.fairway : colors.inkMuted;
    return (
      <Tap
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        haptic={focused ? 'none' : 'select'}
        scaleTo={0.9}
        onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
        style={styles.tab}>
        <TabIcon name={TAB_ICONS[route.name]} focused={focused} />
        <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodySemibold : fonts.bodyMedium }]}>{label}</Text>
      </Tap>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {routes.slice(0, half).map(renderTab)}
      <View style={styles.tab}>
        <Tap
          accessibilityRole="button"
          accessibilityLabel="Start a round"
          haptic="press"
          scaleTo={0.86}
          onPress={() => router.push('/round/new')}
          style={styles.plus}>
          <Icon name="plus" color={colors.cream} size={28} strokeWidth={2.2} />
        </Tap>
      </View>
      {routes.slice(half).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.creamLight,
    paddingTop: 10,
    paddingHorizontal: 6,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#6B5530',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48 },
  label: { fontSize: 11, letterSpacing: 0.1 },
  plus: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.fairway,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    borderWidth: 3,
    borderColor: colors.gold,
    shadowColor: colors.fairwayDeep,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
});
