import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { ApiError, api } from '../api/client';
import type { IdentityVerificationStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { confirm } from '../confirm';
import {
  Avatar,
  Badge,
  Body,
  Button,
  Card,
  Field,
  ListGroup,
  ListRow,
  Notice,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '../components/ui';
import { SITE } from '../site';
import { colors, spacing, type } from '../theme';

const ROLE_LABELS = { ELDER: 'Member', HELPER: 'Helper', ADMIN: 'Administrator' } as const;

/**
 * Profile, support, the legal pages, and permanent deletion — which Google Play
 * requires of every app that lets people sign up.
 */
export function AccountScreen() {
  const { session, signOut } = useAuth();

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identityStatus, setIdentityStatus] = useState<IdentityVerificationStatus | null>(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIdentityLoading(true);
      api.me()
        .then((me) => {
          if (active) {
            setIdentityStatus(me.identityVerificationStatus);
            setIdentityLoading(false);
          }
        })
        .catch(() => {
          if (active) setIdentityLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  async function requestIdentityReview() {
    setIdentityBusy(true);
    setError(null);
    try {
      const result = await api.requestIdentityVerification();
      setIdentityStatus(result.status);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not request identity verification.');
    } finally {
      setIdentityBusy(false);
    }
  }

  async function deleteAccount() {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.deleteAccount({ password });
      await signOut();
      router.replace({ pathname: '/login', params: { deleted: '1' } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete your account. Please try again.');
      setBusy(false);
    }
  }

  async function doSignOut() {
    if (await confirm('Sign out?', 'You will need your email and password to sign back in.', 'Sign out')) {
      await signOut();
      router.replace('/login');
    }
  }

  const isAdmin = session?.role === 'ADMIN';

  return (
    <Screen safeTop>
      <ScreenHeader title="Account" />

      <Card style={styles.profile}>
        <Avatar name={session?.name ?? '?'} size={64} />
        <View style={styles.fill}>
          <Text style={styles.name}>{session?.name}</Text>
          <Text style={styles.email}>{session?.email}</Text>
          {session && <Badge label={ROLE_LABELS[session.role]} tone="info" />}
        </View>
      </Card>

      {session?.role === 'HELPER' && (
        <ListGroup>
          <ListRow icon="create-outline" label="Edit helper profile" onPress={() => router.push('/profile')} last />
        </ListGroup>
      )}

      <SectionHeader title="Support" />
      <ListGroup>
        <ListRow
          icon="mail-outline"
          label="Contact support"
          onPress={() => Linking.openURL(`mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`${SITE.appName} help`)}`)}
        />
        <ListRow icon="shield-outline" label="Privacy policy" onPress={() => router.push('/privacy')} />
        <ListRow icon="document-text-outline" label="Terms of service" onPress={() => router.push('/terms')} last />
      </ListGroup>

      {!isAdmin && (
        <>
          <SectionHeader title="Identity check" />
          <Card>
            <Body muted>
              A member of our team will arrange a video call to confirm your identity. The app does not upload or store video or identity documents.
            </Body>
            {!!error && <Notice message={error} />}
            {identityLoading ? (
              <Notice tone="info" message="Checking your identity status." />
            ) : identityStatus === 'VERIFIED' ? (
              <Badge label="Identity verified" tone="success" icon="shield-checkmark" />
            ) : identityStatus === 'PENDING' ? (
              <Notice tone="info" message="Your request is waiting for our team to arrange a video check." />
            ) : (
              <Button
                label={identityStatus === 'REJECTED' ? 'Request another identity check' : 'Request video identity check'}
                icon="videocam-outline"
                busy={identityBusy}
                onPress={requestIdentityReview}
              />
            )}
          </Card>
        </>
      )}

      <ListGroup>
        <ListRow icon="log-out-outline" label="Sign out" onPress={doSignOut} last />
      </ListGroup>

      {!isAdmin && (
        <>
          <SectionHeader title="Delete account" />
          <Card>
            <Body muted>
              This permanently removes your name, email, phone number, address and the messages you wrote. Any upcoming
              bookings are cancelled and the other person is told. It cannot be undone.
            </Body>
            {!confirming ? (
              <Button label="Delete my account" variant="danger" icon="trash-outline" onPress={() => setConfirming(true)} />
            ) : (
              <>
                {!!error && <Notice message={error} />}
                <Field
                  label="Enter your password to confirm"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                />
                <Button
                  label="Permanently delete my account"
                  variant="danger"
                  icon="trash"
                  busy={busy}
                  onPress={deleteAccount}
                />
                <Button
                  label="Keep my account"
                  variant="outline"
                  onPress={() => {
                    setConfirming(false);
                    setPassword('');
                    setError(null);
                  }}
                />
              </>
            )}
          </Card>
        </>
      )}

      <Text style={styles.version}>
        {SITE.appName} · Made with care by {SITE.operator}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: 4 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...type.heading, color: colors.text },
  email: { ...type.caption, color: colors.textMuted },
  version: { ...type.small, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
