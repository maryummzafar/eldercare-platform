import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { ALL_SERVICES, SERVICE_LABELS } from '../../src/api/types';
import type { ServiceType } from '../../src/api/types';
import { Body, Button, Field, Heading, Loading, Notice, Screen, Title } from '../../src/components/ui';
import { TOUCH_TARGET, colors, radius, spacing, type } from '../../src/theme';

export default function HelperProfile() {
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [rate, setRate] = useState('');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [accepting, setAccepting] = useState(true);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.getMyHelperProfile();
        if (cancelled) return;
        setBio(profile.bio ?? '');
        setCity(profile.city ?? '');
        setRate(String(profile.hourlyRate));
        setServices(profile.offeredServices);
        setAccepting(profile.acceptingBookings);
      } catch {
        // No profile yet — the form stays empty, which is the correct first-run
        // state. A real failure surfaces when they try to save.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleService(service: ServiceType) {
    setServices((current) =>
      current.includes(service) ? current.filter((s) => s !== service) : [...current, service],
    );
  }

  async function save() {
    setError(null);
    setFieldErrors({});
    setSaved(false);

    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      setFieldErrors({ hourlyRate: 'Enter your hourly rate as a number, for example 250' });
      return;
    }
    if (services.length === 0) {
      setError('Choose at least one kind of help you offer.');
      return;
    }

    setBusy(true);
    try {
      await api.saveMyHelperProfile({
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        hourlyRate: parsedRate,
        offeredServices: services,
        acceptingBookings: accepting,
      });
      setSaved(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.fieldErrors) setFieldErrors(e.fieldErrors);
      } else {
        setError('Could not save your profile.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your profile" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>My profile</Title>
      <Body muted>
        This is what elders see when they search. An admin verifies you before you appear.
      </Body>

      {saved && <Notice tone="success" message="Profile saved." />}
      {!!error && <Notice message={error} />}

      <Field
        label="About you"
        value={bio}
        onChangeText={setBio}
        placeholder="A few lines about your experience and why you want to help."
        multiline
        error={fieldErrors.bio}
      />
      <Field label="City" value={city} onChangeText={setCity} error={fieldErrors.city} />
      <Field
        label="Hourly rate (₹)"
        value={rate}
        onChangeText={setRate}
        keyboardType="numeric"
        placeholder="250"
        error={fieldErrors.hourlyRate}
      />

      <Heading>What you offer</Heading>
      <View style={styles.options}>
        {ALL_SERVICES.map((service) => {
          const selected = services.includes(service);
          return (
            <Pressable
              key={service}
              onPress={() => toggleService(service)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={SERVICE_LABELS[service]}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {selected ? '✓ ' : ''}
                {SERVICE_LABELS[service]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Heading>Taking bookings?</Heading>
      <Body muted>
        Turn this off to stay listed but pause new requests. Existing bookings are unaffected.
      </Body>
      <View style={styles.options}>
        <Pressable
          onPress={() => setAccepting(true)}
          accessibilityRole="radio"
          accessibilityState={{ selected: accepting }}
          accessibilityLabel="Yes, I am taking bookings"
          style={[styles.option, accepting && styles.optionSelected]}>
          <Text style={[styles.optionText, accepting && styles.optionTextSelected]}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => setAccepting(false)}
          accessibilityRole="radio"
          accessibilityState={{ selected: !accepting }}
          accessibilityLabel="No, pause new bookings"
          style={[styles.option, !accepting && styles.optionSelected]}>
          <Text style={[styles.optionText, !accepting && styles.optionTextSelected]}>
            Paused
          </Text>
        </Pressable>
      </View>

      <Button label="Save profile" onPress={save} busy={busy} />
      <Button label="Back to my visits" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { ...type.body, color: colors.text },
  optionTextSelected: { color: colors.onPrimary, fontWeight: '600' },
});
