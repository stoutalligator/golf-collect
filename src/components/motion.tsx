/**
 * Motion primitives — every tappable thing goes through <Tap>, so presses feel the same everywhere:
 * a soft spring scale on press-in / release plus the right haptic for the action.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, Text, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { haptics, type HapticKind } from '@/lib/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Springs tuned to feel weighty but quick (no wobble on release). */
export const SPRING = { damping: 18, stiffness: 320, mass: 0.6 } as const;
export const SPRING_SOFT = { damping: 16, stiffness: 180, mass: 0.8 } as const;

type TapProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Scale while pressed (0.97 cards/buttons, 0.9 small icons). */
  scaleTo?: number;
  /** Haptic fired on press (default: light tap). */
  haptic?: HapticKind;
  /** Slight dim while pressed. */
  dim?: boolean;
};

export function Tap({ style, children, scaleTo = 0.97, haptic = 'tap', dim = false, onPressIn, onPressOut, onPress, disabled, ...rest }: TapProps) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
    opacity: dim ? 1 - 0.12 * pressed.value : 1,
  }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withSpring(1, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic !== 'none') haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

/** Staggered fade-and-rise for list items (cap the delay so long lists don't lag). */
export const enterItem = (index: number) =>
  FadeInDown.delay(Math.min(index, 8) * 45).duration(380).easing(Easing.out(Easing.cubic));

/** Number that counts up from 0 the first time it appears. */
export function CountUp({ value, style, duration = 700 }: { value: number; style?: StyleProp<TextStyle>; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <Text style={style}>{shown}</Text>;
}

/** Animated 0..1 fill (progress bars). */
export function useFill(fraction: number, delay = 120) {
  const v = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      v.value = withTiming(fraction, { duration: 650, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(t);
  }, [fraction, delay, v]);
  return useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(1, v.value)) * 100}%` }));
}

export { Animated };
