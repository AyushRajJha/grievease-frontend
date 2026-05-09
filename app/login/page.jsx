import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getSessionFromCookieStore } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getSessionFromCookieStore(cookies());

  if (session?.role === 'admin') {
    redirect('/admin');
  }

  if (session?.role === 'department') {
    redirect('/department');
  }

  return <LoginForm />;
}
