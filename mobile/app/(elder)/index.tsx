import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { ALL_SERVICES, SERVICE_LABELS } from '../../src/api/types';
import type { HelperResponse, ServiceType } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { formatMoney } from '../../src/format';
import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Loading,
  Notice,
  Screen,
  Title,
} from '../../src/components/ui';
import { TOUCH_TARGET, colors, radius, spacing, type } from '../../src/theme';

export default function FindHelp() {
  const { session, signOut } = useAuth();
  const [city, setCity] = useState('');
  const [service, setService] = useState<ServiceType | null>(null);
  const [helpers, setHelpers] = useState<HelperResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.searchHelpers({
        city: city.trim() || undefined,
        service: service ?? undefined,
        size: 20,
      });
      setHelpers(page.content);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load helpers.');
    } finally {
      setLoading(false);
    }
  }, [city, service]);

  // Load once on mount; afterwards the user re-runs it explicitly. Searching on
  // every keystroke would fire a request per letter of a city name.
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <Title>Hello, {session?.name?.split(' ')[0] ?? 'there'}</Title>
      <Body muted>Every helper below has been checked and approved by our team.</Body>

      <Button label="My bookings" variant="secondary" onPress={() => router.push('/(elder)/bookings')} />

      <View style={styles.filters}>
        <Heading>Search</Heading>
        <Field label="City" value={city} onChangeText={setCity} placeholder="Any city" />

        <Text style={styles.filterLabel}>Type of help</Text>
        <View style={styles.chips}>
          <Chip label="Any" selected={service === null} onPress={() => setService(null)} />
          {ALL_SERVICES.map((s) => (
            <Chip
              key={s}
              label={SERVICE_LABELS[s]}
              selected={service === s}
              onPress={() => setService(s)}
            />
          ))}
        </View>

        <Button label="Search" onPress={search} busy={loading} />
      </View>

      {!!error && <Notice message={error} />}

      {loading ? (
        <Loading label="Finding helpers" />
      ) : helpers.length === 0 ? (
        <Notice
          tone="info"
          message="No helpers match that search yet. Try a different city or clear the filters."
        />
      ) : (
        helpers.map((helper) => <HelperCard key={helper.helperId} helper={helper} />)
      )}

      <Button label="My account" variant="secondary" onPress={() => router.push('/account')} />
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

function HelperCard({ helper }: { helper: HelperResponse }) {
  const services = helper.offeredServices.map((s) => SERVICE_LABELS[s]).join(' · ');
  return (
    <Pressable
      onPress={() => router.push(`/(elder)/helper/${helper.helperId}`)}
      accessibilityRole="button"
      accessibilityLabel={`${helper.name}, ${helper.hourlyRate} per hour. ${services}`}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <Heading>{helper.name}</Heading>
        <Text style={styles.rate}>{formatMoney(helper.hourlyRate)} / hour</Text>
        {!!helper.city && <Text style={styles.detail}>{helper.city}</Text>}
        <Text style={styles.detail}>{services}</Text>
        <Text style={styles.detail}>
          {helper.completedBookings === 0
            ? 'New to the platform'
            : `${helper.completedBookings} completed ${helper.completedBookings === 1 ? 'visit' : 'visits'}`}
        </Text>
      </Card>
    </Pressable>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  filterLabel: { ...type.label, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { ...type.caption, color: colors.text },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  rate: { ...type.bodyStrong, color: colors.primary },
  detail: { ...type.caption, color: colors.textMuted },
  pressed: { opacity: 0.85 },
});
