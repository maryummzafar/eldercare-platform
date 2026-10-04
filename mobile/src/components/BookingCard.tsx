import { StyleSheet, Text, View } from 'react-native';

import { SERVICE_LABELS, STATUS_LABELS } from '../api/types';
import type { BookingResponse } from '../api/types';
import { formatMoney, formatTimeRange } from '../format';
import { SERVICE_ICONS, STATUS_TONES } from '../presentation';
import { colors, fonts, radius, spacing, type } from '../theme';
import { Avatar, Badge, Button, Card, DetailRow, Icon } from './ui';
import type { IconName } from './ui';

export interface BookingAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: IconName;
}

/**
 * One booking, from either side. The caller decides which actions are offered —
 * this component never infers them, because the server is the authority on which
 * transitions are legal and the two sides get different ones.
 */
export function BookingCard({
  booking,
  counterpartyName,
  actions,
  busy = false,
}: {
  booking: BookingResponse;
  counterpartyName: string;
  actions?: BookingAction[];
  busy?: boolean;
}) {
  const status = STATUS_TONES[booking.status];
  // Once complete, the final charge replaces the estimate — showing both invites
  // the question of which one was actually billed.
  const amount = booking.finalTotal ?? booking.estimatedTotal;
  const amountLabel = booking.finalTotal != null ? 'Total' : 'Estimate';

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.serviceIcon}>
          <Icon name={SERVICE_ICONS[booking.serviceType]} size={22} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.service}>{SERVICE_LABELS[booking.serviceType]}</Text>
          <Badge label={STATUS_LABELS[booking.status]} tone={status.tone} icon={status.icon} />
        </View>
      </View>

      <View style={styles.details}>
        <DetailRow icon="calendar-outline">
          {formatTimeRange(booking.scheduledStart, booking.scheduledEnd)}
        </DetailRow>
        {!!booking.serviceAddress && <DetailRow icon="location-outline">{booking.serviceAddress}</DetailRow>}
        {!!booking.notes && <DetailRow icon="document-text-outline">{booking.notes}</DetailRow>}
      </View>

      <View style={styles.footer}>
        <View style={styles.person}>
          <Avatar name={counterpartyName} size={36} />
          <Text style={styles.personName} numberOfLines={1}>
            {counterpartyName}
          </Text>
        </View>
        {amount != null && (
          <View style={styles.amount}>
            <Text style={styles.amountLabel}>{amountLabel}</Text>
            <Text style={styles.amountValue}>{formatMoney(amount)}</Text>
          </View>
        )}
      </View>

      {!!actions?.length && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <View key={action.label} style={styles.action}>
              <Button
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? 'primary'}
                icon={action.icon}
                busy={busy}
              />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 6 },
  service: { ...type.heading, color: colors.text },
  details: { gap: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  personName: { ...type.bodyStrong, color: colors.text, flexShrink: 1 },
  amount: { alignItems: 'flex-end' },
  amountLabel: { ...type.small, color: colors.textMuted },
  amountValue: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: 140 },
});
