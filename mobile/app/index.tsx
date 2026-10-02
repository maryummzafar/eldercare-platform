import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { useAuth } from '../src/auth/AuthContext';
import { Loading, Screen } from '../src/components/ui';

/**
 * The only place that decides where a launch lands. Everything downstream can
 * assume a session exists, because this screen holds the app here until the
 * stored token has been read back.
 */
export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Signing you in" />
      </Screen>
    );
  }

  // On the website, a visitor who is not signed in is most likely meeting the
  // service for the first time, so they get the landing page rather than a login form.
  if (!session) {
    return <Redirect href={Platform.OS === 'web' ? '/welcome' : '/(auth)/login'} />;
  }

  if (session.role === 'HELPER') return <Redirect href="/(helper)" />;
  if (session.role === 'ELDER') return <Redirect href="/(elder)" />;
  if (session.role === 'ADMIN') return <Redirect href="/(admin)" />;

  return <Redirect href="/(auth)/unsupported-role" />;
}
