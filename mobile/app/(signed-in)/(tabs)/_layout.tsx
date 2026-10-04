import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Text } from 'react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../../src/auth/AuthContext';
import { useUnreadCount } from '../../../src/notifications/useUnreadCount';
import { colors, fonts } from '../../../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  // Filled when selected, outlined otherwise: the selected tab is told apart by
  // shape as well as colour.
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={26} color={color} />
  );
}

/**
 * The same four tabs for every role, with role-specific content behind them.
 * Admins have no bookings or inbox, so those tabs are hidden rather than empty.
 */
export default function TabsLayout() {
  const { session } = useAuth();
  const { unread } = useUnreadCount();
  const insets = useSafeAreaInsets();
  const role = session?.role;
  const isAdmin = role === 'ADMIN';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Taller than the default to fit the larger icons and labels, plus the phone's
        // home-indicator inset, which an explicit height would otherwise lose.
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 72 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 10 + insets.bottom,
        },
        // Drawn here rather than by the navigator, whose label box is sized for the
        // system font and clips Inter's descenders (the "g" in "Bookings").
        tabBarLabel: ({ color, children }) => (
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, color }}>{children}</Text>
        ),
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: isAdmin ? 'Approvals' : 'Home',
          tabBarIcon: isAdmin
            ? tabIcon('shield-checkmark', 'shield-checkmark-outline')
            : tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: role === 'HELPER' ? 'Visits' : 'Bookings',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontFamily: fonts.semibold },
          // The count is spoken, not left to a small red dot.
          tabBarAccessibilityLabel: unread > 0 ? `Inbox, ${unread} unread` : 'Inbox',
          href: isAdmin ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
