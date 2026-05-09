import crypto from 'node:crypto';

const OTP_SECRET = process.env.CONTACT_VERIFICATION_SECRET || process.env.AUTH_SECRET || 'grievease-contact-verification-secret';
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
export const OTP_MAX_REQUESTS_PER_WINDOW = 3;
export const OTP_MAX_ATTEMPTS = 5;
export const VERIFICATION_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
export const TRACKING_ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sign(input) {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(input)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function createOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashValue(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

export function createVerificationToken(payload) {
  const safePayload = {
    ...payload,
    type: 'complaint_submission',
    exp: Date.now() + VERIFICATION_TOKEN_TTL_MS,
  };

  const encodedPayload = base64url(JSON.stringify(safePayload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyVerificationToken(token) {
  const [encodedPayload, signature] = String(token || '').split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createTrackingAccessToken(payload) {
  const safePayload = {
    ...payload,
    type: 'complaint_tracking',
    exp: Date.now() + TRACKING_ACCESS_TOKEN_TTL_MS,
  };

  const encodedPayload = base64url(JSON.stringify(safePayload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function normalizeTextFingerprint(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 400);
}
