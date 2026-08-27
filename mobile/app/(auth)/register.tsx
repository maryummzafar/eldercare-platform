import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '../../src/api/client';
import type { UserRole } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { Body, Button, Field, Notice, Screen, Title } from '../../src/components/ui';
import { TOUCH_TARGET, colors, radius, spacing, type } from '../../src/theme';

type SignupRole = Extract<UserRole, 'ELDER' | 'HELPER'>;

export default function Register() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<SignupRole>('ELDER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
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
      });
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

  return (
    <Screen>
      <Title>Create your account</Title>

      <View style={styles.roleGroup} accessibilityRole="radiogroup">
        <Text style={styles.roleLabel}>I want to</Text>
        <RoleOption
          selected={role === 'ELDER'}
          onPress={() => setRole('ELDER')}
          heading="Book help"
          detail="Find a vetted helper for hospital trips, groceries or company."
        />
        <RoleOption
          selected={role === 'HELPER'}
          onPress={() => setRole('HELPER')}
          heading="Offer help"
          detail="Earn by helping nearby elders. An admin verifies you before you appear in search."
        />
      </View>

      {!!error && <Notice message={error} />}

      <Field
        label="Full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={fieldErrors.name}
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={fieldErrors.email}
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={fieldErrors.password ?? 'At least 8 characters'}
      />
      <Field
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={fieldErrors.phone}
      />
      <Field
        label={role === 'ELDER' ? 'Home address (optional)' : 'Address (optional)'}
        value={address}
        onChangeText={setAddress}
        multiline
        error={fieldErrors.address}
      />

      <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
        <Button
          label="Create account"
          onPress={submit}
          busy={busy}
          disabled={!name || !email || !password}
        />
        <Button label="I already have an account" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function RoleOption({
  selected,
  onPress,
  heading,
  detail,
}: {
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
      style={[styles.roleOption, selected && styles.roleOptionSelected]}>
      <Text style={styles.roleHeading}>{heading}</Text>
      <Text style={styles.roleDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roleGroup: { gap: spacing.sm },
  roleLabel: { ...type.label, color: colors.text },
  roleOption: {
    minHeight: TOUCH_TARGET,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  // Selection is shown by border weight and a filled background, not colour
  // alone — colour-blind users get the same signal.
  roleOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  roleHeading: { ...type.bodyStrong, color: colors.text },
  roleDetail: { ...type.caption, color: colors.textMuted },
});
