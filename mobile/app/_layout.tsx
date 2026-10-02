import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../src/auth/AuthContext';
import { colors, type } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { ...type.bodyStrong, color: colors.text },
            headerTintColor: colors.primary,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(elder)" options={{ headerShown: false }} />
          <Stack.Screen name="(helper)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          {/* Public pages: the website's front door and the legal pages Play links to. */}
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy policy', headerBackTitle: 'Back' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms of service', headerBackTitle: 'Back' }} />
          <Stack.Screen
            name="delete-account"
            options={{ title: 'Delete your account', headerBackTitle: 'Back' }}
          />
          <Stack.Screen name="account" options={{ title: 'My account', headerBackTitle: 'Back' }} />
          {/* Reachable from both roles, so they live above the role groups. */}
          <Stack.Screen
            name="notifications"
            options={{ title: 'Notifications', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="chat/[bookingId]"
            options={{ title: 'Messages', headerBackTitle: 'Back' }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
