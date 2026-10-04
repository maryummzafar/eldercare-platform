import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../../src/api/client';
import { SERVICE_LABELS } from '../../../src/api/types';
import type { HelperResponse, ServiceType } from '../../../src/api/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Icon,
  Loading,
  Notice,
  Screen,
} from '../../../src/components/ui';
import { formatMoney } from '../../../src/format';
import { SERVICE_ICONS } from '../../../src/presentation';
import { colors, fonts, spacing, type } from '../../../src/theme';

/** Whole-hour start times. A visit at 09:37 helps nobody and complicates billing. */
const START_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DURATIONS = [1, 2, 3, 4];
const DAYS_AHEAD = 7;

export default function HelperDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const helperId = Number(id);

  const [helper, setHelper] = useState<HelperResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [service, setService] = useState<ServiceType | null>(null);
  const [dayOffset, setDayOffset] = useState(1);
  const [startHour, setStartHour] = useState(10);
  const [hours, setHours] = useState(2);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getHelper(helperId);
        if (!cancelled) {
          setHelper(result);
          setService(result.offeredServices[0] ?? null);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : 'Could not load this helper.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [helperId]);

  // Today only offers hours at least one hour away; picking today moves the time
  // forward if the chosen one has already gone.
  const availableHours = useMemo(() => {
    if (dayOffset !== 0) return START_HOURS;
    const earliest = new Date().getHours() + 2;
    return START_HOURS.filter((h) => h >= earliest);
  }, [dayOffset]);

  useEffect(() => {
    if (availableHours.length && !availableHours.includes(startHour)) setStartHour(availableHours[0]);
  }, [availableHours, startHour]);

  const { start, end } = useMemo(() => {
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + dayOffset);
    startAt.setHours(startHour, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + hours);
    return { start: startAt, end: endAt };
  }, [dayOffset, startHour, hours]);

  // Mirrors the server's estimate (rate x scheduled hours) so the elder sees the
  // number before committing. The server recomputes it and its value is the one that counts.
  const estimate = helper ? helper.hourlyRate * hours : 0;

  async function book() {
    if (!service) {
      setError('Choose what kind of help you need.');
      return;
    }
    if (start.getTime() <= Date.now()) {
      setError('Choose a start time in the future.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.createBooking({
        helperId,
        serviceType: service,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        serviceAddress: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.replace('/bookings');
    } catch (e) {
      // The overlap rejection lands here as a 409 with a readable message.
      setError(e instanceof ApiError ? e.message : 'Could not create the booking.');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <Screen>
        <EmptyState
          icon="person-outline"
          title="Helper not available"
          body={loadError}
          action={{ label: 'Back to search', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  if (!helper) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading helper" />
      </Screen>
    );
  }

  const noTimesToday = dayOffset === 0 && availableHours.length === 0;

  return (
    <Screen
      footer={
        <>
          {!!error && <Notice message={error} />}
          <View style={styles.summary}>
            <View style={styles.fill}>
              <Text style={styles.summaryLabel} numberOfLines={1}>
                {dayLabel(dayOffset)}, {hourLabel(startHour)} · {hours}h
              </Text>
              <Text style={styles.summaryTotal}>{formatMoney(estimate)}</Text>
            </View>
            <View style={styles.summaryButton}>
              <Button
                label="Request booking"
                onPress={book}
                busy={busy}
                disabled={!service || noTimesToday}
              />
            </View>
          </View>
        </>
      }>
      <Stack.Screen options={{ title: helper.name }} />
      <Card style={styles.hero}>
        <Avatar name={helper.name} size={80} />
        <Text style={styles.name}>{helper.name}</Text>
        <View style={styles.badges}>
          <Badge label="ID verified" tone="success" icon="shield-checkmark" />
          {!!helper.city && <Badge label={helper.city} icon="location-outline" />}
        </View>
        <View style={styles.facts}>
          <Fact value={formatMoney(helper.hourlyRate)} label="per hour" />
          <View style={styles.factDivider} />
          {helper.completedBookings === 0 ? (
            <Fact value="New" label="on Eldercare" />
          ) : (
            <Fact
              value={String(helper.completedBookings)}
              label={helper.completedBookings === 1 ? 'visit done' : 'visits done'}
            />
          )}
        </View>
      </Card>

      {!!helper.bio && (
        <Card>
          <Text style={styles.sectionTitle}>About {helper.name.split(' ')[0]}</Text>
          <Text style={styles.bio}>{helper.bio}</Text>
        </Card>
      )}

      <Card>
        <Step n={1} title="What do you need?" />
        <View style={styles.wrap}>
          {helper.offeredServices.map((s) => (
            <Chip key={s} label={SERVICE_LABELS[s]} icon={SERVICE_ICONS[s]} selected={service === s} onPress={() => setService(s)} />
          ))}
        </View>
      </Card>

      <Card>
        <Step n={2} title="When?" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {Array.from({ length: DAYS_AHEAD }, (_, offset) => (
            <DayTile key={offset} offset={offset} selected={dayOffset === offset} onPress={() => setDayOffset(offset)} />
          ))}
        </ScrollView>
        <Text style={styles.groupLabel}>Start time</Text>
        {noTimesToday ? (
          <Notice tone="info" message="No more times today. Pick another day." />
        ) : (
          <View style={styles.wrap}>
            {availableHours.map((h) => (
              <Chip key={h} label={hourLabel(h)} selected={startHour === h} onPress={() => setStartHour(h)} />
            ))}
          </View>
        )}
        <Text style={styles.groupLabel}>How long</Text>
        <View style={styles.wrap}>
          {DURATIONS.map((h) => (
            <Chip key={h} label={h === 1 ? '1 hour' : `${h} hours`} selected={hours === h} onPress={() => setHours(h)} />
          ))}
        </View>
      </Card>

      <Card>
        <Step n={3} title="Details" />
        <Field
          label="Where should they meet you?"
          icon="location-outline"
          value={address}
          onChangeText={setAddress}
          placeholder="Your home address"
          hint="Leave blank to use the address on your account."
        />
        <Field
          label="Anything they should know?"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Appointment at 10am, bring my blue file"
          multiline
        />
      </Card>

      <View style={styles.note}>
        <Icon name="information-circle-outline" size={20} color={colors.textMuted} />
        <Text style={styles.noteText}>
          {`${formatMoney(helper.hourlyRate)} × ${hours} ${hours === 1 ? 'hour' : 'hours'} is an estimate. You pay for the time actually spent, rounded up to 15 minutes, with a one-hour minimum. ${helper.name.split(' ')[0]} confirms the request before it is booked.`}
        </Text>
      </View>
    </Screen>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{n}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
    </View>
  );
}

function DayTile({ offset, selected, onPress }: { offset: number; selected: boolean; onPress: () => void }) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const top = offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : date.toLocaleDateString(undefined, { weekday: 'short' });
  return (
    <Chip
      label={`${top} ${date.getDate()}`}
      selected={selected}
      onPress={onPress}
    />
  );
}

function dayLabel(offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  name: { ...type.title, color: colors.text, textAlign: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  facts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    alignSelf: 'stretch',
  },
  fact: { flex: 1, alignItems: 'center' },
  factValue: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, color: colors.text },
  factLabel: { ...type.small, color: colors.textMuted },
  factDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  sectionTitle: { ...type.heading, color: colors.text },
  bio: { ...type.body, color: colors.text },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: fonts.bold, fontSize: 15, color: colors.onPrimary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  days: { gap: spacing.sm, paddingVertical: 2 },
  groupLabel: { ...type.label, color: colors.textMuted, marginTop: spacing.xs },
  note: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs },
  noteText: { ...type.caption, color: colors.textMuted, flex: 1 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryLabel: { ...type.small, color: colors.textMuted },
  summaryTotal: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.text },
  summaryButton: { flex: 1.3 },
});
