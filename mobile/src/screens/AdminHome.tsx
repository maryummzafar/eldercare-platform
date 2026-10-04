import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../api/client';
import { SERVICE_LABELS } from '../api/types';
import type { AdminHelperResponse } from '../api/types';
import { confirm } from '../confirm';
import {
  Avatar,
  Button,
  Card,
  Chip,
  DetailRow,
  EmptyState,
  Loading,
  Notice,
  Screen,
  ScreenHeader,
} from '../components/ui';
import { formatMoney } from '../format';
import { colors, spacing, type } from '../theme';

/**
 * The vetting queue. A helper is invisible to elders until approved here, so this
 * screen is the platform's main safety control: approve only after an ID check.
 */
export function AdminHome() {
  const [showApproved, setShowApproved] = useState(false);
  const [helpers, setHelpers] = useState<AdminHelperResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    if (
      !verified &&
      !(await confirm('Revoke approval?', `${helper.name} will disappear from search straight away.`, 'Revoke'))
    ) {
      return;
    }
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader eyebrow="Admin" title="Helper approvals" />

      <View style={styles.filters}>
        <Chip label="Waiting" icon="hourglass-outline" selected={!showApproved} onPress={() => setShowApproved(false)} />
        <Chip label="Approved" icon="shield-checkmark-outline" selected={showApproved} onPress={() => setShowApproved(true)} />
      </View>

      {!showApproved && (
        <Notice
          tone="warning"
          message="Approve a helper only after checking their government ID and speaking to them. Approved helpers can be booked into elders' homes."
        />
      )}
      {!!error && <Notice message={error} />}

      {helpers === null ? (
        <Loading label="Loading helpers" />
      ) : helpers.length === 0 ? (
        <EmptyState
          icon={showApproved ? 'people-outline' : 'checkmark-done-outline'}
          title={showApproved ? 'No approved helpers yet' : 'All caught up'}
          body={showApproved ? 'Helpers you approve will be listed here.' : 'Nobody is waiting for approval.'}
        />
      ) : (
        helpers.map((helper) => (
          <Card key={helper.helperId}>
            <View style={styles.top}>
              <Avatar name={helper.name} size={52} />
              <View style={styles.fill}>
                <Text style={styles.name}>{helper.name}</Text>
                <Text style={styles.muted}>
                  Joined {new Date(helper.joinedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.rate}>{formatMoney(helper.hourlyRate)}/h</Text>
            </View>
            <View style={styles.details}>
              <DetailRow icon="mail-outline">{helper.email}</DetailRow>
              {!!helper.phone && <DetailRow icon="call-outline">{helper.phone}</DetailRow>}
              {!!helper.city && <DetailRow icon="location-outline">{helper.city}</DetailRow>}
              <DetailRow icon="list-outline">
                {helper.offeredServices.map((s) => SERVICE_LABELS[s]).join(', ')}
              </DetailRow>
            </View>
            {!!helper.bio && <Text style={styles.bio}>{helper.bio}</Text>}
            {showApproved ? (
              <Button
                label="Revoke approval"
                variant="danger"
                icon="close-circle-outline"
                busy={actingOn === helper.helperId}
                onPress={() => setVerified(helper, false)}
              />
            ) : (
              <Button
                label="Approve helper"
                icon="shield-checkmark"
                busy={actingOn === helper.helperId}
                onPress={() => setVerified(helper, true)}
              />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  filters: { flexDirection: 'row', gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...type.heading, color: colors.text },
  muted: { ...type.caption, color: colors.textMuted },
  rate: { ...type.bodyStrong, color: colors.text },
  details: { gap: 6 },
  bio: { ...type.caption, color: colors.text },
});
