import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'grievease_session';

const AUTH_SECRET = process.env.AUTH_SECRET || 'grievease-demo-secret-change-me';
const ADMIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || 'Admin@123';
const DEPARTMENT_PASSWORD = process.env.DEPARTMENT_LOGIN_PASSWORD || 'Dept@123';

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
}

export function getDemoUsers() {
  return [
    {
      email: 'admin@grievease.com',
      password: ADMIN_PASSWORD,
      name: 'GrievEase Admin',
      role: 'admin',
      department: null,
    },
    {
      email: 'sanitation@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Sanitation Officer',
      role: 'department',
      department: 'Sanitation Department',
    },
    {
      email: 'electrical@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Electrical Officer',
      role: 'department',
      department: 'Electrical Department',
    },
    {
      email: 'publicworks@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Public Works Officer',
      role: 'department',
      department: 'Public Works Department',
    },
    {
      email: 'parks@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Parks Officer',
      role: 'department',
      department: 'Parks & Recreation',
    },
    {
      email: 'water@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Water Officer',
      role: 'department',
      department: 'Water & Sewerage Board',
    },
    {
      email: 'police@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Police Officer',
      role: 'department',
      department: 'Police Department',
    },
    {
      email: 'environment@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Environment Officer',
      role: 'department',
      department: 'Environmental Department',
    },
    {
      email: 'fire@grievease.com',
      password: DEPARTMENT_PASSWORD,
      name: 'Fire Officer',
      role: 'department',
      department: 'Fire Department',
    },
  ];
}

export function authenticateUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');

  return getDemoUsers().find((user) => (
    user.email === normalizedEmail && user.password === normalizedPassword
  )) || null;
}

export function createSessionToken(user) {
  const payload = base64UrlEncode(JSON.stringify({
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department || null,
    issuedAt: new Date().toISOString(),
  }));

  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function readSessionToken(token) {
  const rawToken = String(token || '');
  if (!rawToken.includes('.')) return null;

  const [payload, signature] = rawToken.split('.');
  if (!payload || !signature) return null;

  const expectedSignature = signPayload(payload);
  if (signature !== expectedSignature) return null;

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? readSessionToken(match[1]) : null;
}

export async function getSessionFromCookieStore(cookieStorePromise) {
  const cookieStore = await cookieStorePromise;
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return readSessionToken(token);
}

export function isAdmin(session) {
  return session?.role === 'admin';
}

export function isDepartmentUser(session) {
  return session?.role === 'department' && Boolean(session?.department);
}

export function canAccessDepartment(session, department) {
  if (isAdmin(session)) return true;
  return isDepartmentUser(session) && session.department === department;
}
