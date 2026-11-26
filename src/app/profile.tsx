import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ProfileLink, ProfileView } from '@/components/profile-view';
import { AvatarStack } from '@/components/social';
import { Button, Card, Group, IconButton } from '@/components/ui';
import { useAppData } from '@/state/app-data';
import { colors, fonts, space, type } from '@/theme';

export default function Profile() {
  const data = useAppData();
  const [devOpen, setDevOpen] = useState(false);
  return (
    <ProfileView pd={data.meData} headerRight={<IconButton name="settings" label="Settings" onPress={() => setDevOpen((o) => !o)} />}>
      <Group inset={space.lg}>
        <ProfileLink
          icon="users"
          label="Friends"
          sub={`${data.friends.length} friends`}
          onPress={() => router.push('/friends')}
          right={<AvatarStack players={data.friends.slice(0, 4)} size={24} />}
        />
        <ProfileLink icon="chart" label="Your stats" sub="Trends, scoring and strokes by category" onPress={() => router.navigate('/stats')} />
        <ProfileLink icon="trophy" label="Badges" sub={`${data.achievements.filter((a) => a.earned).length} of ${data.achievements.length} earned`} onPress={() => router.push('/achievements')} />
      </Group>

      {devOpen ? (
        <Card style={styles.dev}>
          <Text style={styles.devTitle}>Settings</Text>
          <Text style={styles.devNote}>Accounts and privacy controls arrive with the backend. Sample-data tools for now:</Text>
          <Button variant="secondary" label="Reset to sample data" onPress={data.resetToSample} />
          <Button variant="secondary" label="Clear my rounds (first-run state)" haptic="warning" onPress={data.clearRounds} />
        </Card>
      ) : null}
    </ProfileView>
  );
}

const styles = StyleSheet.create({
  dev: { padding: space.lg, gap: space.md },
  devTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.fairway },
  devNote: { ...type.caption, color: colors.inkMuted },
});
