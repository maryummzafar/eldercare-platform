import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../../src/api/client';
import { SERVICE_LABELS } from '../../src/api/types';
import type { AdminHelperResponse } from '../../src/api/types';
import { useAuth } from '../../src/auth/AuthContext';
import { Body, Button, Card, Heading, Loading, Notice, Screen } from '../../src/components/ui';
import { formatDateTime, formatMoney } from '../../src/format';
import { colors, spacing, type } from '../../src/theme';

/**
 * The vetting queue. A helper is invisible to elders until approved here, so this
 * screen is the platform's main safety control: approve only after an ID check.
 */
export default function HelperApprovals() {
  const { signOut } = useAuth();
  const [showApproved, setShowApproved] = useState(false);
  const [helpers, setHelpers] = useState<AdminHelperResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await api.adminListHelpers({ verified: showApproved, size: 100 });
      setHelpers(page.content);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load helpers.');
      setHelpers([]);
    }
  }, [showApproved]);

  useEffect(() => {
    setHelpers(null);
    void load();
  }, [load]);

  async function setVerified(helper: AdminHelperResponse, verified: boolean) {
    setActingOn(helper.helperId);
    setError(null);
    try {
      await api.adminSetVerified(helper.helperId, verified);
      // Approving moves them to the other list, so drop them from this one.
      setHelpers((current) => current?.filter((h) => h.helperId !== helper.helperId) ?? current);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'That did not work. Please try again.');
    } finally {
      setActingOn(null);
    }
  }

  return (
    <Screen>
      <View style={styles.tabs}>
        <View style={styles.tab}>
          <Button
            label="Waiting"
            variant={showApproved ? 'secondary' : 'primary'}
            onPress={() => setShowApproved(false)}
          />
        </View>
        <View style={styles.tab}>
          <Button
            label="Approved"
            variant={showApproved ? 'primary' : 'secondary'}
            onPress={() => setShowApproved(true)}
          />
        </View>
      </View>

      {!showApproved && (
        <Notice
          tone="info"
          message="Approve a helper only after checking their government ID and contacting them. Approved helpers can be booked into elders' homes."
        />
      )}
      {!!error && <Notice message={error} />}

      {helpers === null ? (
        <Loading label="Loading helpers" />
      ) : helpers.length === 0 ? (
        <Body muted>
          {showApproved ? 'No approved helpers yet.' : 'Nobody is waiting for approval.'}
        </Body>
      ) : (
        helpers.map((helper) => (
          <Card key={helper.helperId}>
            <Heading>{helper.name}</Heading>
            <Text style={styles.detail}>{helper.email}</Text>
            {!!helper.phone && <Text style={styles.detail}>{helper.phone}</Text>}
            <Text style={styles.detail}>
              {[helper.city, `${formatMoney(helper.hourlyRate)} / hour`].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.detail}>
              {helper.offeredServices.map((s) => SERVICE_LABELS[s]).join(' · ')}
            </Text>
            {!!helper.bio && <Body>{helper.bio}</Body>}
            <Text style={styles.detail}>Joined {formatDateTime(helper.joinedAt)}</Text>
            {showApproved ? (
              <Button
                label="Revoke approval"
                variant="danger"
                busy={actingOn === helper.helperId}
                onPress={() => setVerified(helper, false)}
              />
            ) : (
              <Button
                label="Approve"
                busy={actingOn === helper.helperId}
                onPress={() => setVerified(helper, true)}
              />
            )}
          </Card>
        ))
      )}

      <Button label="Refresh" variant="secondary" onPress={load} />
      <Button
        label="Sign out"
        variant="secondary"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1 },
  detail: { ...type.caption, color: colors.textMuted },
});
