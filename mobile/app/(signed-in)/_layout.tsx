import { Redirect, Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useAuth } from '../../src/auth/AuthContext';
import { Loading, Screen } from '../../src/components/ui';
import { stackScreenOptions } from '../../src/navigation';

/**
 * Everything behind sign-in lives under this layout, so the check happens once
 * here rather than in every screen. A link to any of these routes from a
 * signed-out browser lands on the front page or login instead of a broken screen.
 */
export default function SignedInLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Signing you in" />
      </Screen>
    );
  }
  if (!session) {
    return <Redirect href={Platform.OS === 'web' ? '/welcome' : '/login'} />;
  }

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="helper/[id]" options={{ title: '' }} />
      <Stack.Screen name="chat/[bookingId]" options={{ title: 'Messages' }} />
      <Stack.Screen name="profile" options={{ title: 'Edit profile' }} />
    </Stack>
  );
}
