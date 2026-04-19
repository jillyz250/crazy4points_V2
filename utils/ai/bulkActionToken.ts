import crypto from 'node:crypto'

export type BulkActionKind = 'approve' | 'reject' | 'reject_all' | 'feature_replace'

export interface BulkActionPayload {
  brief_id: string
  action: BulkActionKind
  target_id: string // intel_id for approve/reject, alert_id for feature_replace, 'ALL' for reject_all
  slot?: 1 | 2 | 3 | 4 // only for feature_replace
}

function getSecret(): string {
  const secret = process.env.BULK_ACTION_SECRET
  if (!secret) throw new Error('BULK_ACTION_SECRET is not set')
  return secret
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export function signBulkActionToken(payload: BulkActionPayload): string {
  const body = base64url(Buffer.from(JSON.stringify(payload)))
  const mac = crypto.createHmac('sha256', getSecret()).update(body).digest()
  return `${body}.${base64url(mac)}`
}

export function verifyBulkActionToken(token: string): BulkActionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest()
  const provided = fromBase64url(sig)
  if (expected.length !== provided.length) return null
  if (!crypto.timingSafeEqual(expected, provided)) return null

  try {
    return JSON.parse(fromBase64url(body).toString('utf-8')) as BulkActionPayload
  } catch {
    return null
  }
}
