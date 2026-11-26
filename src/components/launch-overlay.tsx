import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { Emblem, SceneImage } from '@/art/components';
import { artKeys, getArt, homeHeroKeys } from '@/art';
import artSettings from '@/art/settings.json';
import { colors, fonts, themed } from '@/theme';

/** Web dev aid: `?splash=hold` keeps the splash up (design review / screenshots). */
const hold = Platform.OS === 'web' && typeof window !== 'undefined' && /[?&]splash=hold(&|$)/.test(window.location.search);

/** Board 03 splash: painted coastal scene with emblem, wordmark and tagline; fades into the app. */
export function LaunchOverlay() {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => setDone(true));
    }, 1300);
    return () => clearTimeout(t);
  }, [opacity]);

  if (done) return null;
  // Dedicated portrait painting if present; otherwise the home hero / placeholder with a cream wash for legibility.
  const painted = !!getArt(artKeys.splashScene);
  const scene = painted ? [artKeys.splashScene] : homeHeroKeys();
  const wash = !painted;
  const drawBranding = !(painted && artSettings.splashSceneIncludesBranding);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]} pointerEvents="none">
      <StatusBar style="dark" />
      <SceneImage artKeys={scene} seed="splash" style={StyleSheet.absoluteFill} />
      {wash ? <View style={styles.sky} /> : null}
      {drawBranding ? <View style={styles.brand}>
        <Emblem size={84} onDark={false} />
        <Text style={styles.word}>GREENS{'\n'}KEEPER</Text>
        <Text style={styles.tag}>PLAY  ·  TRACK  ·  COLLECT</Text>
      </View> : null}
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { backgroundColor: colors.cream },
  sky: { ...StyleSheet.absoluteFill, bottom: '45%', backgroundColor: colors.cream, opacity: 0.82 },
  brand: { position: 'absolute', top: '12%', left: 0, right: 0, alignItems: 'center', gap: 10 },
  word: { fontFamily: fonts.displayBold, fontSize: 46, lineHeight: 50, letterSpacing: 2, color: colors.fairway, textAlign: 'center' },
  tag: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 2.4, color: colors.fairway, textAlign: 'center', lineHeight: 20 },
}));
