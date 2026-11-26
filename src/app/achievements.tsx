import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/art/components';
import { Icon } from '@/components/icons';
import { Chips, ProgressBar, SheetScreen } from '@/components/ui';
import type { AchievementCategory } from '@/domain/achievements';
import { formatDate } from '@/lib/format';
import { useAppData } from '@/state/app-data';
import { colors, fonts, space, type } from '@/theme';

type Filter = 'all' | AchievementCategory;

export default function Achievements() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const list = data.achievements
    .filter((a) => filter === 'all' || a.def.category === filter)
    // In progress first (closest to done), then earned (newest first).
    .sort((a, b) => Number(a.earned) - Number(b.earned)
      || (a.earned ? (b.earnedOn ?? '').localeCompare(a.earnedOn ?? '') : b.current / b.target - a.current / a.target));
  const earnedCount = data.achievements.filter((a) => a.earned).length;

  return (
    <SheetScreen title="Achievements" back>
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'game', label: 'Game' },
          { value: 'courses', label: 'Courses' },
          { value: 'collection', label: 'Collection' },
          { value: 'sim', label: 'Sim' },
        ]}
      />
      <Text style={styles.summary}>{earnedCount} of {data.achievements.length} earned</Text>
      {list.map((a) => (
        <View key={a.def.id} style={styles.row}>
          <Badge id={a.def.id} name={a.def.name} sim={a.def.track === 'sim'} earned={a.earned} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{a.def.name}</Text>
              {a.earned ? (
                <View style={styles.check}><Icon name="check" size={12} color={colors.cream} strokeWidth={2.6} /></View>
              ) : null}
            </View>
            <Text style={styles.desc}>{a.def.description}</Text>
            <View style={styles.progressRow}>
              <View style={{ flex: 1 }}><ProgressBar value={a.current} max={a.target} /></View>
              <Text style={styles.count}>{a.current}/{a.target}</Text>
            </View>
            {a.earned && a.earnedOn ? <Text style={styles.earnedOn}>Earned {formatDate(a.earnedOn)}</Text> : null}
          </View>
        </View>
      ))}
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  summary: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.rule },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 17, color: colors.ink },
  check: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#5E7F3A', alignItems: 'center', justifyContent: 'center' },
  desc: { ...type.caption, fontSize: 13, color: colors.inkMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  count: { ...type.caption, color: colors.ink, fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
  earnedOn: { ...type.caption, fontSize: 11, color: colors.inkMuted },
});
