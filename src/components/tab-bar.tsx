import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons';
import { Animated, SPRING, Tap } from '@/components/motion';
import { colors, fonts } from '@/theme';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  rounds: 'flag',
  courses: 'pin',
  collection: 'layers',
};

/** Icon that lifts and settles when its tab becomes active. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    if (focused) lift.value = withSequence(withSpring(1, { damping: 10, stiffness: 400 }), withSpring(0, SPRING));
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * lift.value }, { scale: 1 + 0.12 * lift.value }] }));
  const tint = focused ? colors.cream : 'rgba(242,230,207,0.6)';
  return (
    <Animated.View style={style}>
      <Icon name={name} color={tint} size={23} strokeWidth={focused ? 1.9 : 1.6} />
    </Animated.View>
  );
}

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
        <View style={[styles.dot, focused && styles.dotOn]} />
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
          <Icon name="plus" color={colors.fairway} size={26} strokeWidth={2.2} />
        </Tap>
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201,163,90,0.35)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, letterSpacing: 0.2 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.gold },
  plus: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6,
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
