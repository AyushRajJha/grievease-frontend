"use client";

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

const LOGIN_PRESETS = {
  admin: { email: 'admin@grievease.com', password: 'Admin@123' },
  department: { email: 'sanitation@grievease.com', password: 'Dept@123' },
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next && next.startsWith('/') ? next : '/admin';
  }, [searchParams]);

  const [rolePreset, setRolePreset] = useState('admin');
  const [email, setEmail] = useState(LOGIN_PRESETS.admin.email);
  const [password, setPassword] = useState(LOGIN_PRESETS.admin.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    setRolePreset(preset);
    setEmail(LOGIN_PRESETS[preset].email);
    setPassword(LOGIN_PRESETS[preset].password);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Invalid login');
      }

      const destination = data.user?.role === 'admin' ? nextPath : '/department';
      window.location.href = destination;
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-stretch">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 lg:p-10">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
            Phase 1 Security Upgrade
          </span>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Protected GrievEase Portals</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            The public complaint form stays open for citizens, but admin and department operations now require sign-in.
            This Phase 1 upgrade adds role-based access, department-scoped dashboards, and protected complaint handling workflows.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Role-Based Access</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Separate protected entry for admin and department users.</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-5">
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Scoped Dashboards</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Department officers only see complaints mapped to their department.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Protected Updates</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Status changes are restricted to authorized users and tracked centrally.</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Portal Login</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Use the demo credentials below to enter the protected workflow locally.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => applyPreset('admin')}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                rolePreset === 'admin'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
                  : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
              }`}
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => applyPreset('department')}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                rolePreset === 'department'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
                  : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
              }`}
            >
              Department Demo
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="portalEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="portalEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="portalPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="portalPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all"
            >
              {loading ? 'Signing in...' : 'Enter Protected Portal'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Demo credentials</p>
            <p>Admin: <span className="font-mono">admin@grievease.com / Admin@123</span></p>
            <p>Department: <span className="font-mono">sanitation@grievease.com / Dept@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
