import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, themed } from '@/theme';

/**
 * A hole score in golf scorecard notation: circle = birdie (double circle = eagle or better), square = bogey
 * (double square = double bogey or worse), plain = par. `onFill` is for a score sitting on a fairway fill (the
 * selected cell on the live scorecard).
 */
export function ScoreMark({ toPar, strokes, size = 'sm', onFill = false }: { toPar: number; strokes: number; size?: 'sm' | 'md'; onFill?: boolean }) {
  const under = toPar < 0;
  const over = toPar > 0;
  const double = toPar <= -2 || toPar >= 2;
  const s = size === 'md' ? styles.md : styles.sm;
  const si = size === 'md' ? styles.mdInner : styles.smInner;
  return (
    <View style={[styles.mark, s, under && styles.under, over && styles.over, onFill && styles.onFill, onFill && under && { backgroundColor: 'transparent' }]}>
      <View style={[styles.inner, si, double && (under ? styles.underInner : styles.overInner), double && onFill && styles.onFill]}>
        <Text style={[styles.text, size === 'md' && styles.textMd, under && { color: colors.fairwayDeep }, onFill && { color: colors.cream }]}>{strokes}</Text>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: 'transparent' },
  sm: { width: 24, height: 24 },
  md: { width: 28, height: 28 },
  under: { borderRadius: 14, borderColor: colors.gold, backgroundColor: colors.goldSoft },
  over: { borderRadius: 2, borderColor: colors.inkMuted },
  onFill: { borderColor: colors.cream },
  inner: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  smInner: { width: 19, height: 19 },
  mdInner: { width: 22, height: 22 },
  underInner: { borderRadius: 11, borderColor: colors.gold },
  overInner: { borderRadius: 1, borderColor: colors.inkMuted },
  text: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, fontVariant: ['tabular-nums'] },
  textMd: { fontSize: 14 },
}));
