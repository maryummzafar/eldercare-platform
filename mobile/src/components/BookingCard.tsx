import { StyleSheet, Text, View } from 'react-native';

import { SERVICE_LABELS, STATUS_LABELS } from '../api/types';
import type { BookingResponse, BookingStatus } from '../api/types';
import { formatMoney, formatTimeRange } from '../format';
import { colors, radius, spacing, type } from '../theme';
import { Body, Button, Card, Heading } from './ui';

export interface BookingAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * One booking, from either side. The caller decides which actions are offered —
 * this component never infers them, because the server is the authority on which
 * transitions are legal and the two sides get different ones.
 */
export function BookingCard({
  booking,
  counterpartyLabel,
  counterpartyName,
  actions,
  busy = false,
}: {
  booking: BookingResponse;
  counterpartyLabel: string;
  counterpartyName: string;
  actions?: BookingAction[];
  busy?: boolean;
}) {
  return (
    <Card>
      <View style={styles.header}>
        <Heading>{SERVICE_LABELS[booking.serviceType]}</Heading>
        <StatusBadge status={booking.status} />
      </View>

      <Body>{formatTimeRange(booking.scheduledStart, booking.scheduledEnd)}</Body>
      <Text style={styles.detail}>
        {counterpartyLabel}: {counterpartyName}
      </Text>
      {!!booking.serviceAddress && <Text style={styles.detail}>{booking.serviceAddress}</Text>}
      {!!booking.notes && <Text style={styles.detail}>“{booking.notes}”</Text>}

      {/* Once complete, the final charge replaces the estimate — showing both
          invites the question of which one was actually billed. */}
      {booking.finalTotal != null ? (
        <Text style={styles.total}>Charged {formatMoney(booking.finalTotal)}</Text>
      ) : booking.estimatedTotal != null ? (
        <Text style={styles.estimate}>Estimated {formatMoney(booking.estimatedTotal)}</Text>
      ) : null}

      {!!actions?.length && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <View key={action.label} style={styles.action}>
              <Button
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? 'primary'}
                busy={busy}
              />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <View style={[styles.badge, badgeTone(status)]}>
      {/* The label carries the meaning; colour only reinforces it. */}
      <Text style={styles.badgeText}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

function badgeTone(status: BookingStatus) {
  switch (status) {
    case 'ACCEPTED':
    case 'IN_PROGRESS':
      return { backgroundColor: colors.success };
    case 'REJECTED':
    case 'CANCELLED':
      return { backgroundColor: colors.danger };
    case 'COMPLETED':
      return { backgroundColor: colors.primary };
    default:
      return { backgroundColor: colors.warning };
  }
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  detail: { ...type.caption, color: colors.textMuted },
  estimate: { ...type.bodyStrong, color: colors.text },
  total: { ...type.bodyStrong, color: colors.primary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
  badgeText: { ...type.caption, color: colors.onPrimary, fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  action: { flexGrow: 1 },
});
