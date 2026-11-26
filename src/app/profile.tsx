import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ProfileLink, ProfileView } from '@/components/profile-view';
import { AvatarStack } from '@/components/social';
import { Button, Card, Group, IconButton } from '@/components/ui';
import { useAppData } from '@/state/app-data';
import { useAuth } from '@/state/auth';
import { colors, fonts, space, type } from '@/theme';

export default function Profile() {
  const data = useAppData();
  const auth = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const pending = data.requests.incoming.length;

  return (
    <ProfileView pd={data.meData} headerRight={<IconButton name="settings" label="Settings" onPress={() => setSettingsOpen((o) => !o)} />}>
      <Group inset={space.lg}>
        <ProfileLink
          icon="users"
          label="Friends"
          sub={pending ? `${data.friends.length} friends · ${pending} ${pending === 1 ? 'request' : 'requests'}` : `${data.friends.length} friends`}
          onPress={() => router.push('/friends')}
          right={<AvatarStack players={data.friends.slice(0, 4)} size={24} />}
        />
        <ProfileLink icon="chart" label="Your stats" sub="Trends, scoring and strokes by category" onPress={() => router.navigate('/stats')} />
        <ProfileLink icon="trophy" label="Badges" sub={`${data.achievements.filter((a) => a.earned).length} of ${data.achievements.length} earned`} onPress={() => router.push('/achievements')} />
      </Group>

      {settingsOpen ? (
        <Card style={styles.settings}>
          <Text style={styles.title}>Settings</Text>
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
          {auth.offline ? null : <Button label="Sign out" onPress={auth.signOut} />}
        </Card>
      ) : null}
    </ProfileView>
  );
}

const styles = StyleSheet.create({
  settings: { padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted },
});
