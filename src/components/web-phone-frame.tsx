/**
 * Web-only dev preview: renders the app at iPhone size (393×852 pt, iPhone 15/16) with a
 * status bar and realistic safe-area insets, so browser previews and screenshots look
 * like the phone. Native builds pass straight through.
 *
 *   wide desktop window → phone bezel centered on a dark backdrop
 *   ?phone=1            → no bezel, fills the viewport (used by `npm run screens`)
 */
import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

export const PHONE = { width: 393, height: 852, insets: { top: 54, bottom: 34, left: 0, right: 0 } };

const bare = Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]phone=1\b/.test(window.location.search);

export function WebPhoneFrame({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return <>{children}</>;

  const bezel = !bare && width > PHONE.width + 80;
  const screen = (
    <SafeAreaInsetsContext.Provider value={PHONE.insets}>
      <View style={bezel ? styles.screen : styles.bareScreen}>
        {children}
        <StatusBarMock />
      </View>
    </SafeAreaInsetsContext.Provider>
  );
  if (!bezel) return screen;
  return (
    <View style={styles.backdrop}>
      <View style={styles.device}>{screen}</View>
      <Text style={styles.caption}>iPhone preview · {PHONE.width}×{PHONE.height} pt</Text>
    </View>
  );
}

function StatusBarMock() {
  return (
    <View pointerEvents="none" style={styles.status}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.island} />
      <View style={styles.right}>
        <View style={styles.signal}>
          {[5, 7, 9, 11].map((h) => <View key={h} style={[styles.bar, { height: h }]} />)}
        </View>
        <View style={styles.battery}><View style={styles.batteryFill} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, minHeight: '100%' as never, backgroundColor: '#1b1f1c', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 12 },
  device: { padding: 12, borderRadius: 64, backgroundColor: '#0b0d0c', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30 },
  screen: { width: PHONE.width, height: PHONE.height, borderRadius: 52, overflow: 'hidden', backgroundColor: colors.cream },
  bareScreen: { flex: 1, overflow: 'hidden', backgroundColor: colors.cream },
  caption: { fontFamily: fonts.body, fontSize: 12, color: '#8d968f' },
  status: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 34, zIndex: 1000 },
  time: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink, width: 60 },
  island: { position: 'absolute', top: 11, left: (PHONE.width - 124) / 2, width: 124, height: 36, borderRadius: 18, backgroundColor: '#000' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 60, justifyContent: 'flex-end' },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 3, borderRadius: 1, backgroundColor: colors.ink },
  battery: { width: 24, height: 12, borderRadius: 3, borderWidth: 1.2, borderColor: colors.ink, padding: 1.5 },
  batteryFill: { flex: 1, borderRadius: 1.5, backgroundColor: colors.ink },
});
