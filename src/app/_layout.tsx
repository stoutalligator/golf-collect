import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LaunchOverlay } from '@/components/launch-overlay';
import { PushManager } from '@/components/push-manager';
import { Button } from '@/components/ui';
import { WebPhoneFrame } from '@/components/web-phone-frame';
import { AppDataProvider, useAppData } from '@/state/app-data';
import { AppearanceProvider, useAppearance } from '@/state/appearance';
import { AuthProvider, useAuth } from '@/state/auth';
import { colors, fonts, space, themed, type } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!loaded && !error) return null;

  return (
    <AppearanceProvider>
      <AuthProvider>
        <AppDataProvider>
          <Themed />
        </AppDataProvider>
      </AuthProvider>
    </AppearanceProvider>
  );
}

/** Everything that draws: re-renders with the scheme (status bar, frame, and the stack's own options). */
function Themed() {
  const { scheme } = useAppearance();
  // The navigator's own colors (behind screens, under the tab bar's rounded corners, during transitions) follow
  // our palette, not the phone's setting, so a Light choice on a phone in Dark Mode never shows black edges.
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    dark: scheme === 'dark',
    colors: { ...base.colors, primary: colors.fairway, background: colors.cream, card: colors.tabBar, text: colors.ink, border: colors.rule },
  };
  return (
    <ThemeProvider value={navTheme}>
      <WebPhoneFrame>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AppStack />
        <PushManager />
        <LaunchOverlay />
      </WebPhoneFrame>
    </ThemeProvider>
  );
}

/** Signed-out users only reach the sign-in screen; everything else needs a session. */
function AppStack() {
  const auth = useAuth();
  const data = useAppData();
  const { scheme } = useAppearance();

  useEffect(() => {
    if (auth.ready) SplashScreen.hideAsync();
  }, [auth.ready]);

  if (!auth.ready) return null;
  if (auth.signedIn && data.error && !data.rounds.length && !data.courseIndex.length) {
    return <LoadError message={data.error} onRetry={data.refresh} />;
  }

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}
      // Screens don't re-render on their own when the scheme flips, so remount each screen's content for the new
      // palette. The navigation stack (and the selected tab) lives in navigator state and survives.
      screenLayout={({ children }) => <Fragment key={scheme}>{children}</Fragment>}>
      <Stack.Protected guard={auth.signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="round/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="round/play/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="round/[id]" />
        <Stack.Screen name="round/reveal/[id]" options={{ gestureEnabled: false, animation: 'fade', contentStyle: { backgroundColor: colors.fairwayDeep } }} />
        <Stack.Screen name="account" options={{ presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="collectible/[courseId]/[item]" />
        <Stack.Screen name="collection/[kind]" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="achievement/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="player/[id]" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="events/index" />
        <Stack.Screen name="events/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="schedule" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/[id]/index" />
        <Stack.Screen name="event/[id]/round/[roundId]" />
      </Stack.Protected>
      <Stack.Protected guard={!auth.signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>Couldn’t load your golf</Text>
      <Text style={styles.errorBody}>Check your connection and try again.</Text>
      <Text style={styles.errorDetail}>{message}</Text>
      <Button label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  error: { flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: space.xl, gap: space.md },
  errorTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.fairway, textAlign: 'center' },
  errorBody: { ...type.body, color: colors.ink, textAlign: 'center' },
  errorDetail: { ...type.caption, color: colors.inkMuted, textAlign: 'center' },
}));
