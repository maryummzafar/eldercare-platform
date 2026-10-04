import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { colors, spacing, type } from '../theme';
import { Button, Card, Icon } from './ui';

/** Shown until the email is confirmed, saying what it unlocks for this role. */
export function ConfirmEmailBanner() {
  const { session } = useAuth();
  if (!session || session.emailVerified) return null;

  const why =
    session.role === 'HELPER'
      ? 'Our team can approve you only once your email is confirmed.'
      : 'You need to confirm it before you can book a helper.';

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Icon name="mail-unread-outline" size={22} color={colors.warning} />
        <Text style={styles.title}>Confirm your email</Text>
      </View>
      <Text style={styles.body}>
        We sent a code to {session.email}. {why}
      </Text>
      <View>
        <Button label="Enter code" variant="outline" compact icon="keypad-outline" onPress={() => router.push('/verify-email')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.warningSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.bodyStrong, color: colors.text },
  body: { ...type.caption, color: colors.text },
});
