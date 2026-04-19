import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, firstName } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

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
    // Reactivate unsubscribed user
    const { error: reactivateError } = await supabase
      .from('subscribers')
      .update({ active: true, first_name: firstName?.trim() || null })
      .eq('id', existing.id)
    if (reactivateError) {
      console.error('[subscribe] Reactivate error:', reactivateError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  } else {
    // New subscriber
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert({ email: normalizedEmail, first_name: firstName?.trim() || null })
    if (dbError) {
      console.error('[subscribe] DB error:', dbError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }

  // Send welcome email
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'intel@mail.crazy4points.com',
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
        <a href="https://crazy4points.com/alerts" style="display: inline-block; margin-top: 8px; padding: 12px 24px; background: #6B2D8F; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Browse Current Alerts
        </a>
        <hr style="margin-top: 32px; border: none; border-top: 1px solid #E6DEEE;" />
        <p style="margin-top: 16px; font-size: 12px; color: #4A4A4A; line-height: 1.6;">
          You're receiving this because you signed up at crazy4points.com.<br/>
          crazy4points · New York, NY, USA<br/>
          <a href="https://crazy4points.com/api/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6B2D8F;">Unsubscribe</a>
        </p>
      </div>
    `,
  })

  if (emailError) {
    console.error('[subscribe] Resend error:', emailError)
  }

  return NextResponse.json({ success: true })
}
