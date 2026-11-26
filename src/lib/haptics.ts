/**
 * Haptic vocabulary — one place so the whole app feels consistent.
 * No-ops on web (and anywhere haptics are unavailable).
 *
 *   select  — tick for changing a selection (tabs, chips, steppers, toggles)
 *   tap     — light tap for ordinary buttons, cards and rows
 *   press   — firmer tap for primary actions (Tee Off, Next, +)
 *   success — notification for accomplishments (round finished, item earned)
 *   warning — notification for destructive confirms (delete)
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';
const safe = (fn: () => Promise<void>) => {
  if (!enabled) return;
  fn().catch(() => {});
};

export const haptics = {
  select: () => safe(() => Haptics.selectionAsync()),
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};

export type HapticKind = keyof typeof haptics | 'none';
