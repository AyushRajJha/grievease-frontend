export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
}

export function normalizePhone(value) {
  const input = String(value || '').trim();
  const digits = input.replace(/\D/g, '');

  if (!digits) return '';

  if (input.startsWith('+')) {
    return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : '';
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : '';
}

export function isValidPhone(value) {
  return Boolean(normalizePhone(value));
}

export function getPreferredVerificationChannel({ email, phone }) {
  if (isValidPhone(phone)) return 'phone';
  if (isValidEmail(email)) return 'email';
  return null;
}

export function getNormalizedContact({ channel, email, phone }) {
  if (channel === 'phone') {
    const normalizedPhone = normalizePhone(phone);
    return normalizedPhone || null;
  }

  if (channel === 'email') {
    const normalizedEmail = normalizeEmail(email);
    return isValidEmail(normalizedEmail) ? normalizedEmail : null;
  }

  return null;
}

export function hasReachableContact({ email, phone }) {
  return isValidEmail(email) || isValidPhone(phone);
}

export function maskContact(channel, value) {
  const contact = String(value || '').trim();
  if (!contact) return 'N/A';

  if (channel === 'phone') {
    const normalized = normalizePhone(contact);
    if (!normalized) return 'N/A';
    return `${normalized.slice(0, 3)}******${normalized.slice(-2)}`;
  }

  const email = normalizeEmail(contact);
  if (!email.includes('@')) return 'N/A';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'N/A';

  const safeLocal = localPart.length <= 2
    ? `${localPart[0] || '*'}*`
    : `${localPart.slice(0, 2)}***`;

  return `${safeLocal}@${domain}`;
}

