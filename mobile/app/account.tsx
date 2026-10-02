import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError, api } from '../src/api/client';
import { useAuth } from '../src/auth/AuthContext';
import { Body, Button, Card, Field, Heading, Notice, Screen } from '../src/components/ui';

/**
 * Account details, the legal pages, and permanent deletion — which Google Play
 * requires of every app that lets people sign up.
 *
 * Deletion is two steps on the screen itself rather than a native Alert, because
 * Alert does nothing in the web build.
 */
export default function AccountScreen() {
  const { session, signOut } = useAuth();

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount({ password });
      await signOut();
      router.replace({ pathname: '/(auth)/login', params: { deleted: '1' } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Heading>{session?.name}</Heading>
        <Body muted>{session?.email}</Body>
      </Card>

      <Button label="Privacy policy" variant="secondary" onPress={() => router.push('/privacy')} />
      <Button label="Terms of service" variant="secondary" onPress={() => router.push('/terms')} />
      <Button
        label="Sign out"
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      />

      <Heading>Delete my account</Heading>
      <Body muted>
        This permanently removes your name, email, phone number, address and the messages you
        wrote. Any upcoming bookings are cancelled and the other person is told. It cannot be
        undone.
      </Body>

      {!confirming ? (
        <Button label="Delete my account" variant="danger" onPress={() => setConfirming(true)} />
      ) : (
        <>
          {!!error && <Notice message={error} />}
          <Field
            label="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Button
            label="Permanently delete my account"
            variant="danger"
            busy={busy}
            onPress={deleteAccount}
          />
          <Button
            label="Keep my account"
            variant="secondary"
            onPress={() => {
              setConfirming(false);
              setPassword('');
              setError(null);
            }}
          />
        </>
      )}
    </Screen>
  );
}
