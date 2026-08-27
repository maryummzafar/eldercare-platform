import { router } from 'expo-router';

import { useAuth } from '../../src/auth/AuthContext';
import { Body, Button, Notice, Screen, Title } from '../../src/components/ui';

/**
 * Admins authenticate successfully but have nothing to do in the app — vetting
 * runs through the API. Say so plainly rather than dropping them into an empty
 * elder view and letting them conclude the app is broken.
 */
export default function UnsupportedRole() {
  const { session, signOut } = useAuth();

  return (
    <Screen>
      <Title>Nothing to do here yet</Title>
      <Notice
        tone="info"
        message={`You are signed in as ${session?.email ?? 'an administrator'}. Admin accounts manage helper verification through the API, not this app.`}
      />
      <Body muted>Sign in with an elder or helper account to use the app.</Body>
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
