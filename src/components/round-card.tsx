import { router } from 'expo-router';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { courseHeroKeys, firstArt } from '@/art';
import { hashString, Landscape } from '@/art/placeholders';
import { Icon } from '@/components/icons';
import { Tap } from '@/components/motion';
import { ScoreBox } from '@/components/social';
import type { RoundSummary } from '@/domain/stats';
import type { Round } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { shortCourseName } from '@/lib/names';
import { useAppData } from '@/state/app-data';
import { colors, fonts, radius, space, themed, type } from '@/theme';

/**
 * Small course painting. Courses share their region's painting, so each course gets its own fixed crop
 * (seeded by id) of a larger render: rows look distinct without implying course-specific art.
 */
export function CourseThumb({ course, style }: { course?: { id: string; region: string }; style?: StyleProp<ViewStyle> }) {
  if (!course) {
    return (
      <View style={[styles.thumb, style]}>
        <Landscape seed="sim" />
      </View>
    );
  }
  const hit = firstArt(courseHeroKeys(course));
  const h = hashString(course.id);
  const zoom = 1.6;
  // Offsets within the overflow: −(zoom−1) .. 0 of the box, on both axes.
  const ox = -((h % 100) / 100) * (zoom - 1) * 100;
  const oy = -(0.5 + (((h >> 7) % 100) / 100) * 0.5) * (zoom - 1) * 100;
  return (
    <View style={[styles.thumb, style]}>
      {hit ? (
        <Image source={hit.src} resizeMode="cover" style={{ position: 'absolute', width: `${zoom * 100}%`, height: `${zoom * 100}%`, left: `${ox}%`, top: `${oy}%` }} />
      ) : (
        <Landscape seed={course.region} />
      )}
    </View>
  );
}

/** Round row for grouped lists: thumbnail · course + date · score box · chevron. */
export function RoundRow({ round, summary, name }: { round: Round; summary?: RoundSummary; name: string }) {
  const data = useAppData();
  const course = round.kind === 'course' ? data.courseById(round.courseId) : undefined;
  const active = round.status === 'active';
  const holes = summary?.holesPlanned === 9 ? '9 holes' : '18 holes';
  return (
    <Tap
      onPress={() => router.push(active ? `/round/play/${round.id}` : `/round/${round.id}`)}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatDate(round.date)}${summary && !active ? `, ${summary.strokes}` : ''}`}
      style={styles.row}>
      <CourseThumb course={course} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.name} numberOfLines={1}>{shortCourseName(name)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {active ? `In progress · hole ${(summary?.holesPlayed ?? 0) + 1}` : `${formatDate(round.date)}  ·  ${holes}`}
          </Text>
          {round.kind === 'sim' ? <Text style={styles.simTag}>SIM</Text> : null}
        </View>
      </View>
      {summary && !active ? <ScoreBox strokes={summary.strokes} toPar={summary.toPar} /> : null}
      <Icon name="chevron-right" size={16} color={colors.inkMuted} />
    </Tap>
  );
}

const styles = themed(() => StyleSheet.create({
  thumb: { width: 76, height: 54, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.paper },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.md },
  name: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { ...type.caption, fontSize: 13, color: colors.inkMuted, flexShrink: 1 },
  simTag: { fontFamily: fonts.bodySemibold, fontSize: 9, letterSpacing: 0.8, color: colors.slate, borderWidth: 1, borderColor: colors.slate, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
}));
