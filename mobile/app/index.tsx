import { Redirect } from 'expo-router';

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

  if (!session) return <Redirect href="/(auth)/login" />;

  // ADMIN has no mobile surface — verification happens through the API. Sending
  // an admin to the elder tab would show them an empty, confusing app.
  if (session.role === 'HELPER') return <Redirect href="/(helper)" />;
  if (session.role === 'ELDER') return <Redirect href="/(elder)" />;

  return <Redirect href="/(auth)/unsupported-role" />;
}
