import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ProfileLink, ProfileView } from '@/components/profile-view';
import { AvatarStack } from '@/components/social';
import { Button, Card, Chips, Group } from '@/components/ui';
import { pushEnabled, pushSupported, setPushEnabled } from '@/lib/push';
import { useAppData } from '@/state/app-data';
import { useAppearance, type AppearancePref } from '@/state/appearance';
import { useAuth } from '@/state/auth';
import { colors, fonts, space, themed, type } from '@/theme';

export default function Profile() {
  const data = useAppData();
  const auth = useAuth();
  const appearance = useAppearance();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notify, setNotify] = useState<boolean | null>(null);
  const [notifyNote, setNotifyNote] = useState<string | null>(null);
  useEffect(() => {
    if (pushSupported) pushEnabled().then(setNotify);
  }, []);
  const toggleNotify = async () => {
    const next = !notify;
    setNotify(next);
    const why = await setPushEnabled(next, auth.offline ? null : auth.userId);
    setNotifyNote(why === 'denied' ? 'Notifications are off for Greens Keeper in iOS Settings → Notifications.' : why === 'no-token' ? 'Push isn’t available in this build yet.' : null);
  };
  const pending = data.requests.incoming.length;

  return (
    <ProfileView pd={data.meData}>
      <Group inset={space.lg}>
        {auth.offline ? null : (
          <ProfileLink icon="user" label="Edit profile" sub={data.me.username ? `@${data.me.username}` : 'Name, username, home course, password'} onPress={() => router.push('/account')} />
        )}
        <ProfileLink
          icon="users"
          label="Friends"
          sub={pending ? `${data.friends.length} friends · ${pending} ${pending === 1 ? 'request' : 'requests'}` : `${data.friends.length} friends`}
          onPress={() => router.push('/friends')}
          right={<AvatarStack players={data.friends.slice(0, 4)} size={24} />}
        />
        <ProfileLink icon="calendar" label="Leagues & events" sub={`${data.events.length} ${data.events.length === 1 ? 'event' : 'events'}`} onPress={() => router.push('/events')} />
        <ProfileLink icon="chart" label="Your stats" sub="Trends, scoring and strokes by category" onPress={() => router.navigate('/stats')} />
        <ProfileLink icon="trophy" label="Badges" sub={`${data.achievements.filter((a) => a.earned).length} of ${data.achievements.length} earned`} onPress={() => router.push('/achievements')} />
      </Group>

      <Card style={styles.settings}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.label}>Appearance</Text>
          <Chips<AppearancePref>
            value={appearance.pref}
            onChange={appearance.setPref}
            options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
          />
          <Text style={styles.note}>System follows your iPhone’s Light/Dark setting.</Text>
          {pushSupported && notify !== null ? (
            <>
              <Button variant="secondary" label={notify ? 'Notifications: on' : 'Notifications: off'} icon="bell" onPress={toggleNotify} />
              <Text style={styles.note}>Friend requests, event invites, comments and reactions, plus a reminder 2 hours before tee times.</Text>
              {notifyNote ? <Text style={styles.note}>{notifyNote}</Text> : null}
            </>
          ) : null}
          {auth.offline ? (
            <>
              <Text style={styles.note}>Offline demo: running on bundled sample data (Supabase isn’t configured).</Text>
              {data.resetToSample ? <Button variant="secondary" label="Reset sample data" onPress={() => data.resetToSample!()} /> : null}
            </>
          ) : (
            <Text style={styles.note}>Signed in as {auth.email}</Text>
          )}
          <Button
            variant="secondary"
            label={confirmClear ? 'Tap again to delete all your rounds' : 'Delete all my rounds'}
            haptic="warning"
            onPress={async () => {
              if (!confirmClear) return setConfirmClear(true);
              setConfirmClear(false);
              await data.clearRounds();
            }}
          />
          {auth.offline ? null : (
            <Button
              label={signingOut ? 'Signing out…' : 'Sign out'}
              icon="lock"
              haptic="warning"
              disabled={signingOut}
              onPress={async () => {
                setSigningOut(true);
                await auth.signOut();
              }}
            />
          )}
        </Card>
    </ProfileView>
  );
}

const styles = themed(() => StyleSheet.create({
  settings: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  label: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted },
}));
