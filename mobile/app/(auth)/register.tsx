import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import type { UserRole } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { Button, Card, Checkbox, Field, Icon, Notice, Screen } from '../../src/components/ui';
import type { IconName } from '../../src/components/ui';
import { colors, fonts, radius, spacing, type } from '../../src/theme';

type SignupRole = Extract<UserRole, 'ELDER' | 'HELPER'>;

export default function Register() {
  const { signUp } = useAuth();
  // The website's "Become a helper" button opens this form with the helper option chosen.
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<SignupRole>(params.role === 'HELPER' ? 'HELPER' : 'ELDER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmedAdult, setConfirmedAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        // The backend rejects a malformed phone but accepts an empty one, so
        // send undefined rather than "" when the user skipped it.
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        acceptedTerms,
        confirmedAdult,
      });
      // The signup emailed a code; confirming it is the natural next step.
      router.replace('/verify-email');
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

  return (
    <Screen
      footer={
        <>
          {!!error && <Notice message={error} />}
          <Button
            label="Create account"
            onPress={submit}
            busy={busy}
            disabled={!name || !email || !password || !acceptedTerms || !confirmedAdult}
          />
        </>
      }>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Create your account
        </Text>
        <Text style={styles.subtitle}>It takes about a minute.</Text>
      </View>

      <View style={styles.roles} accessibilityRole="radiogroup">
        <RoleOption
          icon="heart-outline"
          selected={role === 'ELDER'}
          onPress={() => setRole('ELDER')}
          heading="I need help"
          detail="Book a verified helper for hospital trips, shopping or company."
        />
        <RoleOption
          icon="hand-left-outline"
          selected={role === 'HELPER'}
          onPress={() => setRole('HELPER')}
          heading="I want to help"
          detail="Earn by helping older adults near you. We check your ID first."
        />
      </View>

      <Card style={styles.form}>
        <Field
          label="Full name"
          icon="person-outline"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="name"
          error={fieldErrors.name}
        />
        <Field
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <Field
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          error={fieldErrors.password}
          hint="At least 8 characters"
        />
        <Field
          label="Phone (optional)"
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          error={fieldErrors.phone}
          hint={role === 'HELPER' ? 'We use it to verify you before you can be booked.' : undefined}
        />
        <Field
          label={role === 'ELDER' ? 'Home address (optional)' : 'Address (optional)'}
          icon="home-outline"
          value={address}
          onChangeText={setAddress}
          error={fieldErrors.address}
          hint={role === 'ELDER' ? 'Shared only with helpers you book.' : undefined}
        />
      </Card>

      {/* Consent is an active choice here, never pre-ticked, as the DPDP Act expects. */}
      <Card style={styles.form}>
        <Checkbox
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          accessibilityLabel="I agree to the Privacy Policy and Terms of Service"
          error={fieldErrors.acceptedTerms}>
          I agree to the{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
            Terms of Service
          </Text>
          , including how my details are shared with the people I book with.
        </Checkbox>
        <Checkbox
          checked={confirmedAdult}
          onChange={setConfirmedAdult}
          accessibilityLabel="I am 18 years old or older"
          error={fieldErrors.confirmedAdult}>
          I am 18 years old or older.
        </Checkbox>
      </Card>

      <View style={styles.switch}>
        <Text style={styles.switchText}>Already have an account?</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.link}>
          <Text style={styles.linkText}>Sign in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function RoleOption({ icon, selected, onPress, heading, detail }: {
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  heading: string;
  detail: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${heading}. ${detail}`}
      style={[styles.role, selected && styles.roleSelected]}>
      <View style={[styles.roleIcon, selected && styles.roleIconSelected]}>
        <Icon name={icon} size={24} color={selected ? colors.onPrimary : colors.primary} />
      </View>
      <View style={styles.fill}>
        <Text style={styles.roleHeading}>{heading}</Text>
        <Text style={styles.roleDetail}>{detail}</Text>
      </View>
      {/* Selection is shown by the border, the filled icon AND this tick — not colour alone. */}
      <Icon
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={26}
        color={selected ? colors.primary : colors.borderStrong}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 2 },
  heading: { gap: spacing.xs },
  title: { ...type.title, color: colors.text },
  subtitle: { ...type.body, color: colors.textMuted },
  roles: { gap: spacing.sm + 2 },
  role: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  roleSelected: { borderColor: colors.primary, backgroundColor: '#F7FAFE' },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconSelected: { backgroundColor: colors.primary },
  roleHeading: { ...type.bodyStrong, color: colors.text },
  roleDetail: { ...type.caption, color: colors.textMuted },
  form: { gap: spacing.md, padding: spacing.lg },
  switch: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  switchText: { ...type.body, color: colors.textMuted },
  link: { minHeight: 48, justifyContent: 'center' },
  linkText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.primary },
  legalLink: { fontFamily: fonts.semibold, color: colors.primary, textDecorationLine: 'underline' },
});
