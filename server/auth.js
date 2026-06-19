import crypto from 'node:crypto'

// Простая авторизация по паролю с долгоживущей подписанной cookie (без БД).
// Сессия — stateless: HMAC-подпись поверх срока действия. Переживает перезапуск,
// пока стабилен секрет (AUTH_SECRET или производный от пароля).

export const COOKIE_NAME = 'avto_sid'
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000 // 90 дней

// Разрешённые пароли: AUTH_PASSWORD (один) и/или AUTH_PASSWORDS (через запятую).
export function allowedPasswords() {
  const list = []
  if (process.env.AUTH_PASSWORD) list.push(process.env.AUTH_PASSWORD)
  if (process.env.AUTH_PASSWORDS) list.push(...process.env.AUTH_PASSWORDS.split(',').map((s) => s.trim()))
  return list.filter(Boolean)
}
export function authEnabled() {
  return allowedPasswords().length > 0
}

function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  // Стабильный запасной секрет из паролей — сессии живут между перезапусками.
  return crypto.createHash('sha256').update('avto:' + allowedPasswords().join('|')).digest('hex')
}

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest()
function timingEqual(a, b) {
  try {
    return a.length === b.length && crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function passwordValid(pw) {
  if (!pw) return false
  const h = sha256(pw)
  return allowedPasswords().some((p) => timingEqual(h, sha256(p)))
}

export function signSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE_MS })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}
export function verifySession(token) {
  if (!token || !token.includes('.')) return false
  const [payload, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  if (!timingEqual(Buffer.from(sig), Buffer.from(expected))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof exp === 'number' && Date.now() < exp
  } catch {
    return false
  }
}

export function parseCookies(req) {
  const out = {}
  const header = req.headers.cookie
  if (header) {
    for (const part of header.split(';')) {
      const i = part.indexOf('=')
      if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
    }
  }
  return out
}

export function sessionCookie(token, isProd) {
  const attrs = [`${COOKIE_NAME}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`]
  if (isProd) attrs.push('Secure')
  return attrs.join('; ')
}
export function clearСookieHeader(isProd) {
  const attrs = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (isProd) attrs.push('Secure')
  return attrs.join('; ')
}

// Middleware: пускает, если авторизация выключена или есть валидная сессия.
export function requireAuth(req, res, next) {
  if (!authEnabled()) return next()
  if (verifySession(parseCookies(req)[COOKIE_NAME])) return next()
  res.status(401).json({ error: 'Требуется вход.' })
}
