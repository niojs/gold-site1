import crypto from 'crypto';

// Подписанные сессии. Раньше в cookie лежал сырой user.id, поэтому любой
// мог выставить session=1 и стать администратором. Теперь cookie содержит
// HMAC-подписанный токен: подделать его без SESSION_SECRET нельзя.

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 часа (в секундах)

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // В проде без секрета токены будут подписываться дефолтом — это небезопасно.
      console.warn('⚠️ SESSION_SECRET не задан — используется небезопасный ключ по умолчанию. Задайте SESSION_SECRET в env!');
    }
    return 'dev-insecure-secret-change-me';
  }
  return secret;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest();
}

// Токен: base64url(payload) . base64url(hmac), payload = "<userId>:<issuedAtMs>"
export function signSession(userId) {
  const payload = `${userId}:${Date.now()}`;
  const sig = sign(payload);
  return `${b64url(payload)}.${b64url(sig)}`;
}

// Возвращает userId при валидной, непросроченной подписи — иначе null.
// Принимает то, что вернул cookieStore.get('session')?.value (или undefined).
export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;

  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let payload, providedSig;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return null;
  }

  const expectedSig = sign(payload);
  if (providedSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(providedSig, expectedSig)) return null;

  const sep = payload.lastIndexOf(':');
  if (sep === -1) return null;

  const userId = payload.slice(0, sep);
  const issuedAt = Number(payload.slice(sep + 1));
  if (!userId || !Number.isFinite(issuedAt)) return null;

  // Серверная проверка срока — даже скопированный cookie протухает.
  if (Date.now() - issuedAt > SESSION_MAX_AGE * 1000) return null;

  return userId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}
