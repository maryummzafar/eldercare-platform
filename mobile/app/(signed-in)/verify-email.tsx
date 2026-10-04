import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, Card, CodeField, Icon, Notice, Screen } from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { useCountdown } from '../../src/useCountdown';

const RESEND_SECONDS = 60;

/** Confirms the email address with the code sent at signup. */
export default function VerifyEmail() {
  const { session, updateProfile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { remaining, start } = useCountdown();

  // A code was just sent at signup (or by the last visit here), so the resend
  // button starts on its cooldown rather than inviting an immediate 429.
  useEffect(() => {
    start(RESEND_SECONDS);
  }, [start]);

  async function confirm() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await updateProfile(await api.verifyEmail(code));
      if (router.canGoBack()) router.back();
      else router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      await api.resendVerification();
      setInfo('We have sent you a new code.');
      setCode('');
      start(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send a new code. Please try again.');
    }
  }

  if (session?.emailVerified) {
    return (
      <Screen>
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: colors.successSoft }]}>
            <Icon name="checkmark-circle" size={34} color={colors.success} />
          </View>
          <Text style={styles.title}>Email confirmed</Text>
          <Text style={styles.subtitle}>{session.email} is confirmed. You are all set.</Text>
        </View>
        <Button label="Continue" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Icon name="mail-unread-outline" size={30} color={colors.primary} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Confirm your email
        </Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {session?.email}. Enter it below to finish setting up your account.
        </Text>
      </View>

      {!!error && <Notice message={error} />}
      {!!info && <Notice tone="success" message={info} />}

      <Card style={styles.form}>
        <CodeField value={code} onChangeText={setCode} />
        <Button label="Confirm email" icon="checkmark" onPress={confirm} busy={busy} disabled={code.length !== 6} />
      </Card>

      <Text style={styles.help}>Not there? Check your spam folder. The code works for 15 minutes.</Text>
      <Button
        label={remaining > 0 ? `Send a new code in ${remaining}s` : 'Send a new code'}
        variant="ghost"
        onPress={resend}
        disabled={remaining > 0}
      />
      <Button label="I'll do this later" variant="ghost" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...type.title, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  form: { gap: spacing.md, padding: spacing.lg },
  help: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
});
