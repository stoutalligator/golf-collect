import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { LaunchOverlay } from '@/components/launch-overlay';
import { WebPhoneFrame } from '@/components/web-phone-frame';
import { AppDataProvider } from '@/state/app-data';
import { colors } from '@/theme';

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

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AppDataProvider>
      <WebPhoneFrame>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.fairway } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="round/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="round/play/[id]" options={{ gestureEnabled: false }} />
      </Stack>
      <LaunchOverlay />
      </WebPhoneFrame>
    </AppDataProvider>
  );
}
