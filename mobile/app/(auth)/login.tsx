import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Body, Button, Field, Notice, Screen, Title } from '../../src/components/ui';
import { spacing } from '../../src/theme';
import { View } from 'react-native';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      router.replace('/');
    } catch (e) {
      // The backend answers "Invalid email or password" for both cases on
      // purpose, so there is nothing more specific to show here.
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Title>Welcome back</Title>
      <Body muted>Sign in to book help or manage your visits.</Body>

      {!!error && <Notice message={error} />}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button label="Sign in" onPress={submit} busy={busy} disabled={!email || !password} />
        <Button
          label="Create an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}
        />
      </View>
    </Screen>
  );
}
