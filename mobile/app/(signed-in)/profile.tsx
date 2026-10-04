import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { ALL_SERVICES, SERVICE_LABELS } from '../../src/api/types';
import type { ServiceType } from '../../src/api/types';
import { Button, Card, Chip, Field, Loading, Notice, Screen } from '../../src/components/ui';
import { SERVICE_ICONS } from '../../src/presentation';
import { colors, spacing, type } from '../../src/theme';

/** The helper's public profile: what elders see when they search. */
export default function HelperProfileEditor() {
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [rate, setRate] = useState('');
  const [services, setServices] = useState<ServiceType[]>([]);
  const [accepting, setAccepting] = useState(true);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      router.back();
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
    <Screen
      footer={
        <>
          {!!error && <Notice message={error} />}
          <Button label="Save profile" icon="checkmark" onPress={save} busy={busy} />
        </>
      }>
      <Text style={styles.intro}>
        This is what elders see when they search. Our team checks your ID before you appear.
      </Text>

      <Card>
        <Text style={styles.cardTitle}>About you</Text>
        <Field
          label="Introduce yourself"
          value={bio}
          onChangeText={setBio}
          placeholder="Your studies, your experience, and why you like helping."
          multiline
          error={fieldErrors.bio}
          hint={`${bio.length}/1000`}
        />
        <Field label="City" icon="location-outline" value={city} onChangeText={setCity} autoCapitalize="words" error={fieldErrors.city} />
        <Field
          label="Hourly rate (₹)"
          icon="cash-outline"
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
          placeholder="250"
          error={fieldErrors.hourlyRate}
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Help you offer</Text>
        <View style={styles.wrap}>
          {ALL_SERVICES.map((service) => (
            <Chip
              key={service}
              label={SERVICE_LABELS[service]}
              icon={services.includes(service) ? 'checkmark' : SERVICE_ICONS[service]}
              selected={services.includes(service)}
              onPress={() => toggleService(service)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.fill}>
            <Text style={styles.cardTitle}>Taking new bookings</Text>
            <Text style={styles.muted}>
              Turn off to stay listed but pause new requests. Existing bookings are not affected.
            </Text>
          </View>
          <Switch
            value={accepting}
            onValueChange={setAccepting}
            accessibilityLabel="Taking new bookings"
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
            thumbColor={colors.card}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 4 },
  intro: { ...type.body, color: colors.textMuted },
  cardTitle: { ...type.heading, color: colors.text },
  muted: { ...type.caption, color: colors.textMuted },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
