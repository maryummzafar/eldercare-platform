import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../../src/api/client';
import { SERVICE_LABELS } from '../../../src/api/types';
import type { HelperResponse, ServiceType } from '../../../src/api/types';
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
} from '../../../src/components/ui';
import { formatMoney } from '../../../src/format';
import { TOUCH_TARGET, colors, radius, spacing, type } from '../../../src/theme';

/** Whole-hour start times. A visit at 09:37 helps nobody and complicates billing. */
const START_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const DURATIONS = [1, 2, 3, 4];

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
        if (!cancelled) {
          setLoadError(e instanceof ApiError ? e.message : 'Could not load this helper.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [helperId]);

  const { start, end } = useMemo(() => {
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + dayOffset);
    startAt.setHours(startHour, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + hours);
    return { start: startAt, end: endAt };
  }, [dayOffset, startHour, hours]);

  // Mirrors the server's estimate (rate x scheduled hours) so the elder sees the
  // number before committing. The server recomputes it and its value is the one
  // that counts.
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
      router.replace('/(elder)/bookings');
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
        <Notice message={loadError} />
        <Button label="Go back" variant="secondary" onPress={() => router.back()} />
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

  return (
    <Screen>
      <Title>{helper.name}</Title>
      <Text style={styles.rate}>{formatMoney(helper.hourlyRate)} / hour</Text>
      {!!helper.city && <Body muted>{helper.city}</Body>}
      {!!helper.bio && <Body>{helper.bio}</Body>}
      <Body muted>
        {helper.completedBookings === 0
          ? 'New to the platform'
          : `${helper.completedBookings} completed visits`}
      </Body>

      <Heading>What do you need?</Heading>
      <View style={styles.options}>
        {helper.offeredServices.map((s) => (
          <Option
            key={s}
            label={SERVICE_LABELS[s]}
            selected={service === s}
            onPress={() => setService(s)}
          />
        ))}
      </View>

      <Heading>When?</Heading>
      <Text style={styles.groupLabel}>Day</Text>
      <View style={styles.options}>
        {[0, 1, 2, 3].map((offset) => (
          <Option
            key={offset}
            label={dayLabel(offset)}
            selected={dayOffset === offset}
            onPress={() => setDayOffset(offset)}
          />
        ))}
      </View>

      <Text style={styles.groupLabel}>Start time</Text>
      <View style={styles.options}>
        {START_HOURS.map((h) => (
          <Option
            key={h}
            label={hourLabel(h)}
            selected={startHour === h}
            onPress={() => setStartHour(h)}
          />
        ))}
      </View>

      <Text style={styles.groupLabel}>For how long</Text>
      <View style={styles.options}>
        {DURATIONS.map((h) => (
          <Option
            key={h}
            label={h === 1 ? '1 hour' : `${h} hours`}
            selected={hours === h}
            onPress={() => setHours(h)}
          />
        ))}
      </View>

      <Field
        label="Where should they meet you?"
        value={address}
        onChangeText={setAddress}
        placeholder="Leave blank to use your home address"
        multiline
      />
      <Field
        label="Anything they should know? (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Card>
        <Heading>Estimated cost</Heading>
        <Text style={styles.estimate}>{formatMoney(estimate)}</Text>
        <Body muted>
          {`${formatMoney(helper.hourlyRate)} × ${hours} ${hours === 1 ? 'hour' : 'hours'}. You are charged for the time actually spent, rounded up to the next 15 minutes, with a one-hour minimum.`}
        </Body>
      </Card>

      {!!error && <Notice message={error} />}

      <Button
        label={`Request ${dayLabel(dayOffset).toLowerCase()} at ${hourLabel(startHour)}`}
        onPress={book}
        busy={busy}
        disabled={!service}
      />
      <Body muted>The helper has to accept before this is confirmed.</Body>
    </Screen>
  );
}

function Option({
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
      style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function dayLabel(offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${suffix}`;
}

const styles = StyleSheet.create({
  rate: { ...type.heading, color: colors.primary },
  groupLabel: { ...type.label, color: colors.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minHeight: TOUCH_TARGET,
    minWidth: TOUCH_TARGET * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { ...type.body, color: colors.text },
  optionTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  estimate: { ...type.title, color: colors.primary },
});
