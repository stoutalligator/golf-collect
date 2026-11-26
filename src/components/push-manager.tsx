/**
 * Keeps push notifications in sync for the signed-in user: registers this device, opens the right screen when a
 * notification is tapped, and (re)schedules tee-time reminders for event rounds you've joined. Renders nothing.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';

import { KIND_LABEL } from '@/domain/competition';
import { formatTeeTime, todayISO } from '@/lib/format';
import { onNotificationTap, pushSupported, registerForPush, scheduleReminders } from '@/lib/push';
import { useAppData } from '@/state/app-data';
import { useAuth } from '@/state/auth';

export function PushManager() {
  const auth = useAuth();
  const data = useAppData();
  const userId = auth.offline ? null : auth.userId;

  useEffect(() => {
    if (userId && pushSupported) registerForPush(userId).catch(() => {});
  }, [userId]);

  useEffect(() => onNotificationTap((url) => router.push(url as never)), []);

  // Reminders for upcoming event rounds in events you've joined.
  const key = data.eventRounds.map((r) => `${r.id}:${r.scheduledOn}:${r.teeTime ?? ''}`).join('|') + data.eventMembers.map((m) => `${m.eventId}${m.playerId}${m.status}`).join('');
  useEffect(() => {
    if (!userId || !pushSupported || !data.ready) return;
    const joined = new Set(data.eventMembers.filter((m) => m.playerId === userId && m.status === 'joined').map((m) => m.eventId));
    const today = todayISO();
    const reminders = data.eventRounds
      .filter((r) => joined.has(r.eventId) && r.scheduledOn >= today)
      .slice(0, 30)
      .map((r) => {
        const e = data.events.find((x) => x.id === r.eventId);
        const course = data.courseById(r.courseId)?.name ?? data.courseSummary(r.courseId)?.name ?? 'the course';
        return {
          id: r.id,
          title: e ? `${e.name} · ${r.name}` : KIND_LABEL.outing,
          body: `${r.teeTime ? `Tee time ${formatTeeTime(r.teeTime)}` : 'Today'} at ${course}.`,
          date: r.scheduledOn,
          teeTime: r.teeTime,
          url: `/event/${r.eventId}/round/${r.id}`,
        };
      });
    scheduleReminders(reminders).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the schedule
  }, [userId, data.ready, key]);

  return null;
}
