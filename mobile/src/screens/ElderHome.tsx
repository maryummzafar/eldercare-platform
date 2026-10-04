import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../api/client';
import { ALL_SERVICES, SERVICE_LABELS, STATUS_LABELS } from '../api/types';
import type { BookingResponse, HelperResponse, ServiceType } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { HelperCard } from '../components/HelperCard';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  DetailRow,
  EmptyState,
  Field,
  Icon,
  Loading,
  Notice,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '../components/ui';
import { formatTimeRange, greeting } from '../format';
import { SERVICE_ICONS, STATUS_TONES } from '../presentation';
import { colors, radius, spacing, type } from '../theme';

/** The elder's home: their next visit, then search for help. */
export function ElderHome() {
  const { session } = useAuth();
  const [city, setCity] = useState('');
  const [service, setService] = useState<ServiceType | null>(null);
  const [helpers, setHelpers] = useState<HelperResponse[] | null>(null);
  const [nextVisit, setNextVisit] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const search = useCallback(
    async (filters: { city: string; service: ServiceType | null }) => {
      setSearching(true);
      setError(null);
      try {
        const page = await api.searchHelpers({
          city: filters.city.trim() || undefined,
          service: filters.service ?? undefined,
          size: 20,
        });
        setHelpers(page.content);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Could not load helpers.');
        setHelpers((current) => current ?? []);
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  const loadNextVisit = useCallback(async () => {
    try {
      const page = await api.listBookings({ size: 20 });
      const upcoming = page.content
        .filter((b) => ['REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status))
        .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
      setNextVisit(upcoming[0] ?? null);
    } catch {
      // The teaser is a convenience; the Bookings tab shows any real error.
    }
  }, []);

  // Load once on mount. Afterwards a search runs when a filter chip is tapped or
  // the city is submitted, not on every keystroke of a city name.
  useEffect(() => {
    void search({ city: '', service: null });
    void loadNextVisit();
  }, [search, loadNextVisit]);

  const pickService = (next: ServiceType | null) => {
    setService(next);
    void search({ city, service: next });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([search({ city, service }), loadNextVisit()]);
    setRefreshing(false);
  };

  const firstName = session?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader
        eyebrow={greeting()}
        title={firstName}
        right={<Avatar name={session?.name ?? '?'} size={48} />}
      />

      {nextVisit && <NextVisit booking={nextVisit} />}

      <Card>
        <Text style={styles.searchTitle}>What do you need help with?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <Chip label="All" icon="apps-outline" selected={service === null} onPress={() => pickService(null)} />
          {ALL_SERVICES.map((s) => (
            <Chip
              key={s}
              label={SERVICE_LABELS[s]}
              icon={SERVICE_ICONS[s]}
              selected={service === s}
              onPress={() => pickService(s)}
            />
          ))}
        </ScrollView>
        <Field
          label="City"
          icon="location-outline"
          value={city}
          onChangeText={setCity}
          placeholder="Any city"
          autoCapitalize="words"
        />
        <Button label="Search" icon="search" onPress={() => search({ city, service })} busy={searching} />
      </Card>

      <SectionHeader title={service ? SERVICE_LABELS[service] : 'Available helpers'} />
      <View style={styles.trust}>
        <Icon name="shield-checkmark" size={18} color={colors.success} />
        <Text style={styles.trustText}>Every helper is ID-checked and approved by our team.</Text>
      </View>

      {!!error && <Notice message={error} />}

      {helpers === null ? (
        <Loading label="Finding helpers" />
      ) : helpers.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No helpers found"
          body="Nobody matches that search yet. Try another city or type of help."
          action={
            city || service
              ? {
                  label: 'Clear filters',
                  onPress: () => {
                    setCity('');
                    pickService(null);
                  },
                }
              : undefined
          }
        />
      ) : (
        helpers.map((helper) => <HelperCard key={helper.helperId} helper={helper} />)
      )}
    </Screen>
  );
}

function NextVisit({ booking }: { booking: BookingResponse }) {
  const status = STATUS_TONES[booking.status];
  return (
    <Card onPress={() => router.push('/bookings')} accessibilityLabel="Your next visit. Open bookings." style={styles.next}>
      <View style={styles.nextTop}>
        <Text style={styles.nextLabel}>Your next visit</Text>
        <Badge label={STATUS_LABELS[booking.status]} tone={status.tone} icon={status.icon} />
      </View>
      <View style={styles.nextRow}>
        <View style={styles.nextIcon}>
          <Icon name={SERVICE_ICONS[booking.serviceType]} size={24} color={colors.primary} />
        </View>
        <View style={styles.fill}>
          <Text style={styles.nextService}>{SERVICE_LABELS[booking.serviceType]}</Text>
          <Text style={styles.nextWith}>with {booking.helperName}</Text>
        </View>
      </View>
      <DetailRow icon="calendar-outline">
        {formatTimeRange(booking.scheduledStart, booking.scheduledEnd)}
      </DetailRow>
    </Card>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchTitle: { ...type.heading, color: colors.text },
  chips: { gap: spacing.sm, paddingVertical: 2 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: -spacing.sm },
  trustText: { ...type.caption, color: colors.textMuted, flex: 1 },
  next: { borderWidth: 1.5, borderColor: colors.primarySoft },
  nextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextLabel: { ...type.label, color: colors.textMuted },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextService: { ...type.heading, color: colors.text },
  nextWith: { ...type.caption, color: colors.textMuted },
});
