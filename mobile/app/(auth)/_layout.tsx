import { Stack } from 'expo-router';

import { stackScreenOptions } from '../../src/navigation';

export default function AuthLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Sign up' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
      <Stack.Screen name="unsupported-role" options={{ headerShown: false }} />
    </Stack>
  );
}
