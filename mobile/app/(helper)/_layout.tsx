import { Stack } from 'expo-router';

import { colors, type } from '../../src/theme';

export default function HelperLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...type.bodyStrong, color: colors.text },
        headerTintColor: colors.primary,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'My visits' }} />
      <Stack.Screen name="profile" options={{ title: 'My profile' }} />
    </Stack>
  );
}
