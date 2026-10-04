import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../src/auth/AuthContext';
import { stackScreenOptions } from '../src/navigation';

// Hold the logo on screen until the font is ready, so the first frame is not
// drawn in the system font and then jump.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // A font that fails to load falls back to the system font; that is no reason
  // to keep the user staring at the splash screen.
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(signed-in)" options={{ headerShown: false }} />
          {/* Public pages: the website's front door and the legal pages Play links to. */}
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy policy' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms of service' }} />
          <Stack.Screen name="delete-account" options={{ title: 'Delete your account' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
