import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'eilat-admin-2025';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Generate a cryptographically signed HMAC token for admin session (valid for 24 hours)
 */
export function generateAdminToken() {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
  });

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Validate incoming token or password
 */
export function verifyAdminToken(token) {
  if (!token) return false;

  // 1. Direct password match or legacy base64 password (backward compatibility)
  const legacyToken = Buffer.from(ADMIN_PASSWORD).toString('base64');
  if (token === ADMIN_PASSWORD || token === legacyToken) {
    return true;
  }

  // 2. Validate signed JWT-like token
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Constant-time compare to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.role !== 'admin') return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false; // Token expired
    }
    return true;
  } catch {
    return false;
  }
}
