/**
 * Push notifications (native only).
 * - Remote: the device's Expo push token is saved to `push_tokens`; database triggers send friend, event,
 *   comment and reaction notifications through Expo (see migration …000600).
 * - Local: tee-time reminders for event rounds you've joined, scheduled on the device.
 * Notifications carry `data.url`, an app route opened on tap.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const pushSupported = Platform.OS === 'ios' || Platform.OS === 'android';
const ENABLED_KEY = 'gk:push:enabled';
const REMINDER_PREFIX = 'gk-reminder-';

if (pushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function pushEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

async function currentToken(): Promise<string | null> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  try {
    return (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  } catch {
    return null; // simulator, Expo Go limits, or push not configured for this build
  }
}

/**
 * Ask permission (once) and save this device's token for the signed-in user.
 * Returns why it didn't register, or null on success.
 */
export async function registerForPush(userId: string): Promise<string | null> {
  if (!pushSupported || !supabase) return 'unsupported';
  if (!(await pushEnabled())) return 'disabled';
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'denied';
  const token = await currentToken();
  if (!token) return 'no-token';
  const { error } = await supabase.from('push_tokens').upsert({ token, profile_id: userId, platform: Platform.OS, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}

/** Turn notifications on/off for this device (off removes the token and pending reminders). */
export async function setPushEnabled(on: boolean, userId: string | null): Promise<string | null> {
  try {
    await AsyncStorage.setItem(ENABLED_KEY, on ? 'true' : 'false');
  } catch {
    // keep going: the server-side token is what matters
  }
  if (on) return userId ? registerForPush(userId) : null;
  const token = pushSupported ? await currentToken() : null;
  if (token && supabase) await supabase.from('push_tokens').delete().eq('token', token);
  await clearReminders();
  return null;
}

/** Before signing out: stop this device receiving the user's notifications. */
export async function forgetDevice() {
  if (!pushSupported || !supabase) return;
  const token = await currentToken();
  if (token) await supabase.from('push_tokens').delete().eq('token', token);
  await clearReminders();
}

async function clearReminders() {
  if (!pushSupported) return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(pending.filter((n) => n.identifier.startsWith(REMINDER_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export interface Reminder {
  id: string;
  title: string;
  body: string;
  /** Local date (YYYY-MM-DD) and optional "HH:MM" tee time. */
  date: string;
  teeTime?: string;
  url: string;
}

/** Replace all tee-time reminders: 2 hours before the tee time, or 8 am on the day when there isn't one. */
export async function scheduleReminders(reminders: Reminder[]) {
  if (!pushSupported || !(await pushEnabled())) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await clearReminders();
  const now = Date.now();
  for (const r of reminders) {
    const [y, m, d] = r.date.split('-').map(Number);
    const [hh, mm] = (r.teeTime ?? '10:00').split(':').map(Number);
    const at = new Date(y, m - 1, d, hh, mm).getTime() - 2 * 3600e3;
    if (at <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_PREFIX}${r.id}`,
      content: { title: r.title, body: r.body, data: { url: r.url }, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  }
}

/** Calls `open(url)` when the user taps a notification (including the one that launched the app). */
export function onNotificationTap(open: (url: string) => void): () => void {
  if (!pushSupported) return () => {};
  const handle = (n: Notifications.NotificationResponse | null) => {
    const url = n?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) open(url);
  };
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
