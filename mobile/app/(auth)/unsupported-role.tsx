import { router } from 'expo-router';

import { useAuth } from '../../src/auth/AuthContext';
import { Body, Button, Notice, Screen, Title } from '../../src/components/ui';

/**
 * Fallback for a role this build does not know — for example one added on the
 * server before the app was updated. Say so plainly rather than dropping the user
 * into an empty view and letting them conclude the app is broken.
 */
export default function UnsupportedRole() {
  const { session, signOut } = useAuth();

  return (
    <Screen>
      <Title>Nothing to do here yet</Title>
      <Notice
        tone="info"
        message={`You are signed in as ${session?.email ?? 'an unknown account'}, which this version of the app does not support.`}
      />
      <Body muted>Update the app, or sign in with an elder or helper account.</Body>
      <Button
        label="Sign out"
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}
