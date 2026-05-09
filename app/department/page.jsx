import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OperationsDashboard from '@/components/OperationsDashboard';
import { getSessionFromCookieStore, isAdmin, isDepartmentUser } from '@/lib/auth';

export default async function DepartmentPage() {
  const session = await getSessionFromCookieStore(cookies());

  if (!session) {
    redirect('/login?next=/department');
  }

  if (isAdmin(session)) {
    redirect('/admin');
  }

  if (!isDepartmentUser(session)) {
    redirect('/login');
  }

  return <OperationsDashboard initialSession={session} portalType="department" />;
}
