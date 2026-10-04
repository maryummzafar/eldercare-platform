import { useAuth } from '../../../src/auth/AuthContext';
import { BookingsScreen } from '../../../src/screens/BookingsScreen';

export default function BookingsTab() {
  const { session } = useAuth();
  return <BookingsScreen role={session?.role === 'HELPER' ? 'HELPER' : 'ELDER'} />;
}
