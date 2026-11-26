import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CourseScene, SceneImage } from '@/art/components';
import { Icon } from '@/components/icons';
import { Card } from '@/components/ui';
import { formatToPar, type RoundSummary } from '@/domain/stats';
import type { Round } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, type } from '@/theme';

function scoreLine(round: Round, s: RoundSummary | undefined) {
  if (!s) return formatDate(round.date);
  const holes = s.holesPlanned === 9 ? ' · 9 holes' : '';
  return `${formatDate(round.date)}  ·  ${s.strokes} (${formatToPar(s.toPar)})${holes}`;
}

const open = (id: string) => router.push(`/round/${id}`);

/** Course rounds show the course's (region) hero; sim rounds a placeholder scene. */
function RoundScene({ round, style }: { round: Round; style: object }) {
  const data = useAppData();
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  return course ? <CourseScene course={course} style={style} /> : <SceneImage seed={round.courseId} style={style} />;
}

/** Large card with landscape on top (Home · Recent Rounds). */
export function RoundCardLarge({ round, summary, name }: { round: Round; summary?: RoundSummary; name: string }) {
  return (
    <Card onPress={() => open(round.id)}>
      <RoundScene round={round} style={{ height: 96 }} />
      <View style={styles.largeBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta}>{scoreLine(round, summary)}</Text>
        </View>
        {round.kind === 'sim' ? <Text style={styles.simTag}>SIM</Text> : null}
        <Icon name="chevron-right" size={18} color={colors.inkMuted} />
      </View>
    </Card>
  );
}

/** Compact row with thumbnail (Rounds list, course history). */
export function RoundRow({ round, summary, name }: { round: Round; summary?: RoundSummary; name: string }) {
  return (
    <Card onPress={() => open(round.id)} style={styles.row}>
      <RoundScene round={round} style={styles.thumb} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta}>{scoreLine(round, summary)}</Text>
      </View>
      {round.kind === 'sim' ? <Text style={styles.simTag}>SIM</Text> : null}
      <Icon name="chevron-right" size={18} color={colors.inkMuted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  largeBody: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, paddingRight: space.md },
  thumb: { width: 76, height: 52, borderRadius: radius.sm },
  name: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  meta: { ...type.caption, color: colors.inkMuted },
  simTag: { ...type.label, fontSize: 9, color: colors.slate, borderWidth: 1, borderColor: colors.slate, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
});
