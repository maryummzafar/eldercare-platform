import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, Card, CodeField, Field, Icon, Notice, Screen } from '../../src/components/ui';
import { colors, spacing, type } from '../../src/theme';
import { useCountdown } from '../../src/useCountdown';

const RESEND_SECONDS = 60;

/**
 * Two steps on one screen: ask for the email, then take the emailed code and the
 * new password together. A successful reset signs the user straight in.
 */
export default function ForgotPassword() {
  const { acceptSignIn } = useAuth();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { remaining, start } = useCountdown();

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setStep('reset');
      start(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      const auth = await api.resetPassword({ email: email.trim(), code, newPassword: password });
      await acceptSignIn(auth);
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.fieldErrors) setFieldErrors(e.fieldErrors);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (step === 'email') {
    return (
      <Screen>
        <View style={styles.heading}>
          <View style={styles.icon}>
            <Icon name="key-outline" size={30} color={colors.primary} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Forgot your password?
          </Text>
          <Text style={styles.subtitle}>
            Enter the email you signed up with and we will send you a code to choose a new one.
          </Text>
        </View>
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
          <Button label="Send me a code" icon="send-outline" onPress={sendCode} busy={busy} disabled={!email.trim()} />
        </Card>
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
          Check your email
        </Text>
        <Text style={styles.subtitle}>
          If {email.trim()} has an account, we have sent it a 6-digit code. It works for 15 minutes.
        </Text>
      </View>
      {!!error && <Notice message={error} />}
      <Card style={styles.form}>
        <CodeField value={code} onChangeText={setCode} error={fieldErrors.code} />
        <Field
          label="New password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          error={fieldErrors.newPassword}
          hint="At least 8 characters"
        />
        <Button
          label="Set new password"
          icon="checkmark"
          onPress={reset}
          busy={busy}
          disabled={code.length !== 6 || password.length < 8}
        />
      </Card>
      <Text style={styles.help}>Not there? Check your spam folder.</Text>
      <Button
        label={remaining > 0 ? `Send a new code in ${remaining}s` : 'Send a new code'}
        variant="ghost"
        onPress={sendCode}
        disabled={remaining > 0 || busy}
      />
      <Button
        label="Use a different email"
        variant="ghost"
        onPress={() => {
          setStep('email');
          setCode('');
          setError(null);
        }}
      />
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
