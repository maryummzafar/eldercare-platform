import { Stack } from 'expo-router';

import { NotificationBell } from '../../src/components/NotificationBell';

import { colors, type } from '../../src/theme';

export default function ElderLayout() {
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
      <Stack.Screen name="index" options={{ title: 'Find help' }} />
      <Stack.Screen name="bookings" options={{ title: 'My bookings' }} />
      <Stack.Screen name="helper/[id]" options={{ title: 'Helper' }} />
    </Stack>
  );
}
