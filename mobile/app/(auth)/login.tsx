import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { BrandMark } from '../../src/components/BrandMark';
import { Button, Card, Field, Notice, Screen } from '../../src/components/ui';
import { colors, fonts, spacing, type } from '../../src/theme';

export default function Login() {
  const { signIn } = useAuth();
  // Set by the account screen after a successful deletion.
  const { deleted } = useLocalSearchParams<{ deleted?: string }>();
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
    <Screen safeTop>
      <View style={styles.brand}>
        <BrandMark size={52} />
      </View>

      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Welcome back
        </Text>
        <Text style={styles.subtitle}>Sign in to book help or manage your visits.</Text>
      </View>

      {deleted === '1' && !error && <Notice tone="success" message="Your account has been deleted." />}
      {!!error && <Notice message={error} />}

      <Card style={styles.form}>
        <Field
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
        />
        <Pressable accessibilityRole="button" onPress={() => router.push('/forgot-password')} style={styles.forgot}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </Pressable>
        <Button label="Sign in" onPress={submit} busy={busy} disabled={!email || !password} />
      </Card>

      <View style={styles.switch}>
        <Text style={styles.switchText}>New to Eldercare?</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={styles.link}>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </View>

      <View style={styles.legal}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')} style={styles.link}>
          <Text style={styles.legalText}>Privacy policy</Text>
        </Pressable>
        <Text style={styles.legalText}>·</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push('/terms')} style={styles.link}>
          <Text style={styles.legalText}>Terms</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: spacing.lg },
  heading: { alignItems: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  title: { ...type.title, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  form: { gap: spacing.md, padding: spacing.lg },
  switch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  switchText: { ...type.body, color: colors.textMuted },
  link: { minHeight: 48, justifyContent: 'center' },
  forgot: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-end', marginTop: -spacing.sm },
  linkText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.primary },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginTop: 'auto' },
  legalText: { ...type.caption, color: colors.textMuted },
});
