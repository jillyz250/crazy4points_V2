import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { unsubscribeUrlFor } from '@/utils/email/unsubscribeToken'
import { isRateLimited, ipHashFromRequest } from '@/utils/security/rateLimit'

const resend = new Resend(process.env.RESEND_API_KEY)

// Bot defense: Gmail dot-trick detector. Real Gmail users almost never have
// 4+ dots in the local part. Bots use the dot-trick to test if the form
// dedupes (Gmail ignores dots, so sid.uf.a.lip.e79@gmail.com and
// siduflalipe79@gmail.com hit the same inbox). 4+ dots is overwhelmingly bot.
// Caught two of these (2026-04-26, 2026-05-20) before adding this check.
function looksLikeDotTrickBot(email: string): boolean {
  const local = (email.split('@')[0] || '').toLowerCase()
  const dotCount = (local.match(/\./g) ?? []).length
  return dotCount >= 4
}

// Allowed signup_source values. Anything else gets coerced to 'api_direct'
// so we can distinguish form submits from raw API hits.
const ALLOWED_SOURCES = new Set([
  'homepage_hero',
  'footer',
  'hub_hero',
  'inline_alert',
  'newsletter_link',
  'manual',
  'api_direct',
])

export async function POST(req: NextRequest) {
  const { email, firstName, lastName, website, source } = await req.json()

  // Honeypot — bots fill hidden fields; humans don't see it.
  if (website && String(website).trim() !== '') {
    return NextResponse.json({ success: true })
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
  }

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return NextResponse.json({ error: 'First name required.' }, { status: 400 })
  }

  // Bot defense layer 2 — Gmail dot-trick pattern. Silently 200 so the bot
  // doesn't learn we filter on this signature.
  if (looksLikeDotTrickBot(email)) {
    console.warn(`[subscribe] dot-trick bot rejected: ${email}`)
    return NextResponse.json({ success: true })
  }

  const validatedSource =
    typeof source === 'string' && ALLOWED_SOURCES.has(source) ? source : 'api_direct'

  const supabase = createAdminClient()

  // Rate limit: 10 subscribe attempts per IP per hour. Cheap insurance
  // against bots that defeat the honeypot. Hash the IP so the raw value
  // never lands in our DB.
  const ipKey = ipHashFromRequest(req.headers)
  if (ipKey) {
    const blocked = await isRateLimited(supabase, {
      key: ipKey,
      kind: 'subscribe',
      max: 10,
      windowMinutes: 60,
    })
    if (blocked) {
      console.warn(`[subscribe] rate-limited ip=${ipKey.slice(0, 8)} email=${email}`)
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 },
      )
    }
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if subscriber already exists
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, active')
    .eq('email', normalizedEmail)
    .single()

  if (existing) {
    if (existing.active) {
      return NextResponse.json({ error: 'You\'re already subscribed!' }, { status: 409 })
    }
    // Reactivate unsubscribed user. Preserve the original signup_source
    // (don't overwrite history); only stamp it if it was NULL on the legacy row.
    const { error: reactivateError } = await supabase
      .from('subscribers')
      .update({
        active: true,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
      })
      .eq('id', existing.id)
    if (reactivateError) {
      console.error('[subscribe] Reactivate error:', reactivateError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  } else {
    // New subscriber
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert({
        email: normalizedEmail,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        signup_source: validatedSource,
      })
    if (dbError) {
      console.error('[subscribe] DB error:', dbError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }

  // Send welcome email
  const { error: emailError } = await resend.emails.send({
    from: process.env.WELCOME_FROM ?? 'crazy4points <welcome@crazy4points.com>',
    replyTo: process.env.WELCOME_REPLY_TO ?? 'support@crazy4points.com',
    to: email,
    subject: "You're in! Welcome to Crazy4Points",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1A1A1A;">
        <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName || 'there'},</p>
        <p style="font-size: 16px; line-height: 1.6;">Love this for you.</p>
        <p style="font-size: 16px; line-height: 1.6;">
          You're officially part of Crazy4Points — the place where we treat travel rewards like a game and celebrate every clever move.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">If you want to see what's happening right now, start here:</p>
        <a href="https://www.crazy4points.com/alerts" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background: #6B2D8F; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Browse Current Alerts
        </a>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #E6DEEE;" />
        <p style="margin-top: 16px; font-size: 12px; color: #4A4A4A; line-height: 1.6;">
          You're receiving this because you signed up at crazy4points.com.<br/>
          crazy4points · New York, NY, USA<br/>
          <a href="${unsubscribeUrlFor(email)}" style="color: #6B2D8F;">Unsubscribe</a>
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('[subscribe] Resend error:', emailError)
  }

  return NextResponse.json({ success: true })
}
