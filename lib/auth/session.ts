/**
 * Signed admin-session tokens (HMAC-SHA256).
 *
 * Replaces the old forgeable `admin_session=true` cookie. The cookie now holds
 * `<base64url(payload)>.<base64url(hmac)>` where the HMAC is keyed on
 * SESSION_SECRET. A cookie can no longer be forged without the secret, and the
 * payload carries an expiry so old tokens stop working.
 *
 * Uses the Web Crypto API (crypto.subtle) so the SAME module works in both the
 * Node runtime (server actions, route handlers, server components) and the Edge
 * runtime (proxy.ts) — no node:crypto, no runtime pinning required.
 */

export const ADMIN_SESSION_COOKIE = 'admin_session'

// 30 days — solo admin on her own devices; long-lived so she isn't re-prompted
// constantly (Jill, 2026-09-02). The cookie maxAge is derived from this same value.
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AdminSessionPayload {
  /** Expiry, ms since epoch. */
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    // Fail closed: without a secret we cannot sign or verify anything.
    throw new Error('SESSION_SECRET is not set')
  }
  return secret
}

const encoder = new TextEncoder()

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const binary = atob(b64 + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Copy a view into a standalone ArrayBuffer (avoids Uint8Array<ArrayBufferLike> vs BufferSource). */
function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
}

async function importKey(usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encoder.encode(getSecret())),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  )
}

/**
 * Sign a fresh session token that expires SESSION_TTL_MS from now.
 * Returns the cookie value to store. Throws if SESSION_SECRET is unset.
 */
export async function signAdminSession(now = Date.now()): Promise<string> {
  const payload: AdminSessionPayload = { exp: now + SESSION_TTL_MS }
  const data = bytesToBase64Url(encoder.encode(JSON.stringify(payload)))
  const key = await importKey(['sign'])
  const sigBuf = await crypto.subtle.sign('HMAC', key, toArrayBuffer(encoder.encode(data)))
  const sig = bytesToBase64Url(new Uint8Array(sigBuf))
  return `${data}.${sig}`
}

/**
 * Verify a cookie value. Returns the payload if the signature is valid AND the
 * token is unexpired; otherwise null. Never throws on malformed input (a bad
 * token is simply unauthenticated), but DOES surface a missing-secret as null
 * so a misconfigured deploy fails closed rather than open.
 */
export async function verifyAdminSession(
  token: string | undefined | null,
  now = Date.now()
): Promise<AdminSessionPayload | null> {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const data = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!data || !sig) return null

  let valid: boolean
  try {
    const key = await importKey(['verify'])
    valid = await crypto.subtle.verify(
      'HMAC',
      key,
      toArrayBuffer(base64UrlToBytes(sig)),
      toArrayBuffer(encoder.encode(data))
    )
  } catch {
    // Missing secret or malformed base64 → unauthenticated, fail closed.
    return null
  }
  if (!valid) return null

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(data))
    ) as AdminSessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}
