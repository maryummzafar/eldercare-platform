import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { useAuth } from '../src/auth/AuthContext';
import { Loading, Screen } from '../src/components/ui';

/**
 * The only place that decides where a launch lands. It holds the app here until
 * the stored token has been read back, so nothing downstream sees a half-restored
 * session.
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
  // service for the first time, so they get the front page rather than a login form.
  if (!session) {
    return <Redirect href={Platform.OS === 'web' ? '/welcome' : '/login'} />;
  }

  if (session.role === 'ELDER' || session.role === 'HELPER' || session.role === 'ADMIN') {
    return <Redirect href="/home" />;
  }
  return <Redirect href="/unsupported-role" />;
}
