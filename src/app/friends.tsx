import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons';
import { Animated, enterItem, Tap } from '@/components/motion';
import { Avatar } from '@/components/social';
import { Group, SheetScreen } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, space, type } from '@/theme';

export default function Friends() {
  const data = useAppData();
  const rows = data.friends
    .map((f) => ({ f, pd: data.playerData(f.id)! }))
    .sort((a, b) => (b.pd.rounds[0]?.date ?? '').localeCompare(a.pd.rounds[0]?.date ?? ''));

  return (
    <SheetScreen title="Friends" back>
      <Text style={styles.note}>You see each other’s rounds in your feeds. Private rounds stay private. Inviting friends arrives with accounts.</Text>
      <Animated.View entering={enterItem(0)}>
        <Group inset={space.lg}>
          {rows.map(({ f, pd }) => {
            const last = pd.rounds.find((r) => r.status === 'complete');
            const s = last ? data.summaries.get(last.id) : undefined;
            return (
              <Tap key={f.id} onPress={() => router.push(`/player/${f.id}`)} scaleTo={0.985} accessibilityRole="button" accessibilityLabel={f.name} style={styles.row}>
                <Avatar player={f} size={48} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{f.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>Handicap {pd.handicap?.toFixed(1) ?? '—'}  ·  {pd.coursesPlayed} courses played</Text>
                  {last && s ? (
                    <Text style={styles.last} numberOfLines={1}>
                      Last round {s.strokes} at {shortCourseName(data.roundCourseName(last))}, {formatDate(last.date)}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-right" size={16} color={colors.inkMuted} />
              </Tap>
            );
          })}
        </Group>
      </Animated.View>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  note: { ...type.caption, fontSize: 13, color: colors.inkMuted, marginTop: -space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  name: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  last: { ...type.caption, color: colors.inkMuted },
});
