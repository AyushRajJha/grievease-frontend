import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OperationsDashboard from '@/components/OperationsDashboard';
import { getSessionFromCookieStore, isAdmin } from '@/lib/auth';

export default async function AdminPage() {
  const session = await getSessionFromCookieStore(cookies());

  if (!session) {
    redirect('/login?next=/admin');
  }

  if (!isAdmin(session)) {
    redirect('/department');
  }

  return <OperationsDashboard initialSession={session} portalType="admin" />;
}
