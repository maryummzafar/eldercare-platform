import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '../api/client';
import type { BookingResponse, HelperResponse, IdentityVerificationStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { BookingCard } from '../components/BookingCard';
import { ConfirmEmailBanner } from '../components/ConfirmEmailBanner';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Icon,
  Loading,
  Notice,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '../components/ui';
import type { IconName } from '../components/ui';
import { formatMoney, greeting } from '../format';
import { colors, fonts, radius, spacing, type } from '../theme';
import { useBookingActions } from './useBookingActions';

/** The helper's dashboard: are they live, what is waiting on them, what is next. */
export function HelperHome() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[] | null>(null);
  // undefined while loading, null when they have no profile yet.
  const [profile, setProfile] = useState<HelperResponse | null | undefined>(undefined);
  const [identityStatus, setIdentityStatus] = useState<IdentityVerificationStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const [page, mine, me] = await Promise.allSettled([
      api.listBookings({ size: 100 }),
      api.getMyHelperProfile(),
      api.me(),
    ]);
    if (page.status === 'fulfilled') setBookings(page.value.content);
    else {
      setLoadError('Could not load your visits.');
      setBookings((current) => current ?? []);
    }
    // A helper who has not filled in a profile yet gets a 404. That is the
    // expected first-run state, not an error worth showing.
    setProfile(mine.status === 'fulfilled' ? mine.value : null);
    setIdentityStatus(me.status === 'fulfilled' ? me.value.identityVerificationStatus : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { actionsFor, actingOn, error } = useBookingActions('HELPER', load);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = session?.name?.split(' ')[0] ?? 'there';
  const all = bookings ?? [];
  const requests = all.filter((b) => b.status === 'REQUESTED');
  const upcoming = all
    .filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS')
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const completed = all.filter((b) => b.status === 'COMPLETED');
  const earned = completed.reduce((sum, b) => sum + (b.finalTotal ?? 0), 0);

  return (
    <Screen safeTop refreshing={refreshing} onRefresh={onRefresh}>
      <ScreenHeader eyebrow={greeting()} title={firstName} right={<Avatar name={session?.name ?? '?'} size={48} />} />

      <ConfirmEmailBanner />

      {profile !== undefined && identityStatus !== null && (
        <ProfileStatus profile={profile} identityStatus={identityStatus} />
      )}

      <View style={styles.stats}>
        <Stat icon="mail-unread-outline" label="Requests" value={String(requests.length)} />
        <Stat icon="calendar-outline" label="Upcoming" value={String(upcoming.length)} />
        <Stat icon="wallet-outline" label="Earned" value={formatMoney(earned)} />
      </View>

      {!!(loadError ?? error) && <Notice message={(loadError ?? error)!} />}

      {bookings === null ? (
        <Loading label="Loading your visits" />
      ) : requests.length === 0 && upcoming.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="No requests yet"
          body="When an elder books you, the request appears here for you to accept."
        />
      ) : (
        <>
          {requests.length > 0 && (
            <>
              <SectionHeader title="New requests" />
              {requests.map((b) => (
                <BookingCard key={b.id} booking={b} counterpartyName={b.elderName} busy={actingOn === b.id} actions={actionsFor(b)} />
              ))}
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <SectionHeader title="Coming up" action={{ label: 'See all', onPress: () => router.navigate('/bookings') }} />
              {upcoming.map((b) => (
                <BookingCard key={b.id} booking={b} counterpartyName={b.elderName} busy={actingOn === b.id} actions={actionsFor(b)} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

/** Tells the helper, in one card, the single next thing standing between them and bookings. */
function ProfileStatus({ profile, identityStatus }: {
  profile: HelperResponse | null;
  identityStatus: IdentityVerificationStatus;
}) {
  if (identityStatus !== 'VERIFIED') {
    const pending = identityStatus === 'PENDING';
    return (
      <Card style={[styles.status, { backgroundColor: pending ? colors.warningSoft : colors.primarySoft }]}>
        <View style={styles.statusRow}>
          <Icon name={pending ? 'hourglass-outline' : 'videocam-outline'} size={22} color={pending ? colors.warning : colors.primary} />
          <Text style={styles.statusTitle}>{pending ? 'Identity check in review' : 'Verify your identity'}</Text>
        </View>
        <Text style={styles.statusBody}>
          {pending
            ? 'Our team will contact you to arrange a video call. You will not appear in search until identity and helper approval are complete.'
            : 'Request a video check with our team. You will become eligible for helper approval after your identity is verified.'}
        </Text>
        <View style={styles.statusAction}>
          <Button
            label={pending ? 'View identity check' : 'Request video check'}
            variant="outline"
            icon="videocam-outline"
            compact
            onPress={() => router.navigate('/account')}
          />
        </View>
      </Card>
    );
  }
  if (!profile) {
    return (
      <Card style={[styles.status, { backgroundColor: colors.primary }]}>
        <Text style={[styles.statusTitle, styles.onBrand]}>Set up your profile</Text>
        <Text style={[styles.statusBody, styles.onBrand]}>
          Add your rate and the help you offer so elders can find you.
        </Text>
        <View style={styles.statusAction}>
          <Button label="Set up profile" variant="outline" icon="create-outline" compact onPress={() => router.push('/profile')} />
        </View>
      </Card>
    );
  }
  if (!profile.verified) {
    return (
      <Card style={[styles.status, { backgroundColor: colors.warningSoft }]}>
        <View style={styles.statusRow}>
          <Icon name="hourglass-outline" size={22} color={colors.warning} />
          <Text style={styles.statusTitle}>Waiting for approval</Text>
        </View>
        <Text style={styles.statusBody}>
          Your identity is verified. Our team separately reviews your helper profile before elders can find you.
        </Text>
      </Card>
    );
  }
  return (
    <Card style={[styles.status, { backgroundColor: profile.acceptingBookings ? colors.successSoft : colors.surface }]}>
      <View style={styles.statusRow}>
        <Icon
          name={profile.acceptingBookings ? 'radio-button-on' : 'pause-circle-outline'}
          size={22}
          color={profile.acceptingBookings ? colors.success : colors.textMuted}
        />
        <Text style={styles.statusTitle}>
          {profile.acceptingBookings ? 'You are live and taking bookings' : 'Bookings are paused'}
        </Text>
      </View>
      <Text style={styles.statusBody}>
        {profile.acceptingBookings
          ? `Elders can find and book you at ${formatMoney(profile.hourlyRate)} an hour.`
          : 'Elders cannot send you new requests. Turn bookings back on in your profile.'}
      </Text>
      <View style={styles.statusAction}>
        <Button label="Edit profile" variant="outline" icon="create-outline" compact onPress={() => router.push('/profile')} />
      </View>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  status: { gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusTitle: { ...type.bodyStrong, color: colors.text, flex: 1 },
  statusBody: { ...type.caption, color: colors.text },
  statusAction: { marginTop: spacing.xs },
  onBrand: { color: colors.onPrimary },
  stats: { flexDirection: 'row', gap: spacing.sm + 2 },
  stat: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
  },
  statValue: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 30, color: colors.text, marginTop: spacing.xs },
  statLabel: { ...type.small, color: colors.textMuted },
});
