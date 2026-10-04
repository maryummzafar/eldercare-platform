import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SERVICE_LABELS } from '../api/types';
import type { HelperResponse } from '../api/types';
import { formatMoney } from '../format';
import { SERVICE_ICONS } from '../presentation';
import { colors, fonts, spacing, type } from '../theme';
import { Avatar, Badge, Card, Icon } from './ui';

/** A helper in search results. The whole card opens their profile. */
export function HelperCard({ helper }: { helper: HelperResponse }) {
  const services = helper.offeredServices.map((s) => SERVICE_LABELS[s]).join(', ');
  const experience =
    helper.completedBookings === 0
      ? 'New helper'
      : `${helper.completedBookings} ${helper.completedBookings === 1 ? 'visit' : 'visits'}`;

  return (
    <Card
      onPress={() => router.push(`/helper/${helper.helperId}`)}
      accessibilityLabel={`${helper.name}, verified, ${formatMoney(helper.hourlyRate)} per hour${helper.city ? `, ${helper.city}` : ''}. ${services}. ${experience}.`}>
      <View style={styles.row}>
        <Avatar name={helper.name} size={56} />
        <View style={styles.main}>
          <Text style={styles.name} numberOfLines={1}>
            {helper.name}
          </Text>
          <View style={styles.meta}>
            <Badge label="Verified" tone="success" icon="shield-checkmark" />
            {!!helper.city && (
              <View style={styles.metaItem}>
                <Icon name="location-outline" size={15} color={colors.textMuted} />
                <Text style={styles.metaText}>{helper.city}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.price}>
          <Text style={styles.priceValue}>{formatMoney(helper.hourlyRate)}</Text>
          <Text style={styles.priceUnit}>per hour</Text>
        </View>
      </View>

      {!!helper.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {helper.bio}
        </Text>
      )}

      <View style={styles.services}>
        {helper.offeredServices.slice(0, 3).map((s) => (
          <View key={s} style={styles.service}>
            <Icon name={SERVICE_ICONS[s]} size={15} color={colors.primary} />
            <Text style={styles.serviceText}>{SERVICE_LABELS[s]}</Text>
          </View>
        ))}
        {helper.offeredServices.length > 3 && (
          <Text style={styles.more}>+{helper.offeredServices.length - 3} more</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Icon name="star-outline" size={16} color={colors.textMuted} />
        <Text style={styles.metaText}>{experience}</Text>
        <View style={styles.fill} />
        <Text style={styles.cta}>View profile</Text>
        <Icon name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  main: { flex: 1, gap: 6 },
  fill: { flex: 1 },
  name: { ...type.heading, color: colors.text },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { ...type.caption, color: colors.textMuted },
  price: { alignItems: 'flex-end' },
  priceValue: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.text },
  priceUnit: { ...type.small, color: colors.textMuted },
  bio: { ...type.caption, color: colors.text },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  serviceText: { ...type.small, color: colors.primary },
  more: { ...type.small, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  cta: { fontFamily: fonts.semibold, fontSize: 15, color: colors.primary },
});
