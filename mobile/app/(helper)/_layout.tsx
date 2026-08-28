import { Stack } from 'expo-router';

import { NotificationBell } from '../../src/components/NotificationBell';

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
        // Every screen in these groups carries the bell, so a notification is
        // always one tap away rather than only from the home screen.
        headerRight: () => <NotificationBell />,
      }}>
      <Stack.Screen name="index" options={{ title: 'My visits' }} />
      <Stack.Screen name="profile" options={{ title: 'My profile' }} />
    </Stack>
  );
}
