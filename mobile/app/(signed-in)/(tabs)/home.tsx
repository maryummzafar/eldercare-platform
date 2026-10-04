import { useAuth } from '../../../src/auth/AuthContext';
import { AdminHome } from '../../../src/screens/AdminHome';
import { ElderHome } from '../../../src/screens/ElderHome';
import { HelperHome } from '../../../src/screens/HelperHome';

export default function HomeTab() {
  const { session } = useAuth();
  if (session?.role === 'ADMIN') return <AdminHome />;
  if (session?.role === 'HELPER') return <HelperHome />;
  return <ElderHome />;
}
