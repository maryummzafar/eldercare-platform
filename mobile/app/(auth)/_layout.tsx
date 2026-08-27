import { Stack } from 'expo-router';

import { colors, type } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...type.bodyStrong, color: colors.text },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Sign up' }} />
      <Stack.Screen name="unsupported-role" options={{ headerShown: false }} />
    </Stack>
  );
}
