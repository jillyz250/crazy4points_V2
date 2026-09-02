'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { generateFacebook } from '@/utils/ai/variants/generateFacebook'

const SWEEPS_PAGE_URL = 'https://www.crazy4points.com/sweepstakes'

/**
 * Add a sweepstakes to the social calendar (Jill, 2026-09-02), mirroring the
 * experiences button. Creates TWO posts per sweep: an **awareness** post right away
 * (tomorrow — a giveaway has no sell-out/bidding, so max runway = max entries) AND
 * a **last-chance-to-enter** post ~3 days before the deadline. Distinct source_refs
 * (`:now` / `:last`) so both survive dedup; the last-chance one is skipped if there's
 * no future deadline or it would fall on/before the awareness post. Adding also marks
 * the sweep reviewed.
 */
export async function addSweepToSocialCalendar(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  const { data: s } = await supabase.from('sweepstakes').select('id, title, ends_at').eq('id', id).single()
  if (!s) return

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const addDays = (iso: string, n: number) => { const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
  const nowDate = addDays(today, 1) // awareness: tomorrow
  const title = String(s.title).slice(0, 110)
  const ends = s.ends_at ? String(s.ends_at).slice(0, 10) : null

  const rows: Record<string, unknown>[] = [{
    post_date: nowDate, platform: 'facebook', topic: title, category: 'sweepstakes',
    source_type: 'sweepstakes', source_ref: `sweep:${id}:now`, status: 'planned', link_url: '/sweepstakes',
    notes: ends ? `Enter-to-win awareness post. Ends ${ends}. Honest points-giveaway framing.` : 'Enter-to-win awareness post. Honest framing.',
  }]
  // Last-chance post ~3 days before the deadline, only if it lands after the awareness post.
  if (ends) {
    const lastDate = addDays(ends, -3)
    if (lastDate > nowDate) {
      rows.push({
        post_date: lastDate, platform: 'facebook', topic: `Last chance to enter: ${title}`, category: 'sweepstakes',
        source_type: 'sweepstakes', source_ref: `sweep:${id}:last`, status: 'planned', link_url: '/sweepstakes',
        notes: `Last-chance-to-enter post before it closes ${ends}. Honest framing.`,
      })
    }
  }

  const { data: existing } = await supabase.from('social_calendar').select('source_ref').like('source_ref', `sweep:${id}%`)
  const have = new Set((existing ?? []).map((r) => r.source_ref))
  const fresh = rows.filter((r) => !have.has(r.source_ref as string))
  if (fresh.length) await supabase.from('social_calendar').insert(fresh)

  await supabase.from('sweepstakes').update({ reviewed_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/admin/social-calendar')
}

/** Toggle whether a sweepstakes is ⭐ Featured on the public /sweepstakes page. */
export async function toggleSweepFeatured(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const next = String(formData.get('next') ?? '') === 'true'
  if (!id) return
  const supabase = createAdminClient()
  await supabase
    .from('sweepstakes')
    .update({ featured: next, featured_at: next ? new Date().toISOString() : null })
    .eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/sweepstakes')
}

/**
 * Toggle whether a sweepstakes has been Reviewed (Jill has looked at it and made
 * a call, whether or not she Featured it). Mirrors the Experiences review flow:
 * reviewed rows drop out of the "still to look at" view so the board shrinks as
 * she curates. Separate from featured/posted_social.
 */
export async function toggleSweepReviewed(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const next = String(formData.get('next') ?? '') === 'true'
  if (!id) return
  const supabase = createAdminClient()
  await supabase
    .from('sweepstakes')
    .update({ reviewed_at: next ? new Date().toISOString() : null })
    .eq('id', id)
  revalidatePath('/admin/sweepstakes')
}

/**
 * Generate a Facebook post draft for one sweepstakes, on demand.
 *
 * Feeds the sweep's VERIFIED facts (program, prize, deadline, mechanic) to the
 * shared brand-voice Facebook generator as the fact ledger, so the post can't
 * invent a prize or date. Per the facebook-post rules the entry link lives in
 * the FIRST COMMENT, not the body — we point it at our own /sweepstakes page
 * (the FB-giveaway landing tactic) and note the direct entry link too. The
 * draft is stored on the row so it persists and can be regenerated.
 */
export async function draftSweepstakesPostAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  const { data: s } = await supabase
    .from('sweepstakes')
    .select('program, title, prize, entry_url, mechanic, ends_at')
    .eq('id', id)
    .maybeSingle()
  if (!s) return

  const daily = s.mechanic === 'daily_entry'
  const facts = [
    `Program running it: ${s.program}`,
    s.prize ? `Prize you can win: ${s.prize}` : null,
    s.ends_at ? `Enter by (deadline): ${s.ends_at}` : null,
    daily ? 'You can enter once per day' : null,
    'Free to enter, no purchase necessary',
  ].filter(Boolean) as string[]

  let body: string
  try {
    const fb = await generateFacebook({
      topic: {
        id: `sweepstakes-${id}`,
        title: `${s.program}: ${s.title}`,
        summary:
          `${s.program} is running a free sweepstakes` +
          (s.prize ? ` where you can win ${s.prize}` : '') +
          (s.ends_at ? `, open through ${s.ends_at}` : '') +
          `. It is free to enter${daily ? ' and you can enter every single day' : ''}. ` +
          `Crazy4Points tracks live points and miles sweepstakes so readers never miss one.`,
        fact_ledger: facts,
        primary_intent: 'urgency',
        programs: [],
        metadata: null,
      },
    })
    // Strip any fancy Unicode bold the shared generator emits: it breaks UTM
    // tracking and throttles ad delivery, and the sweepstakes tactic points ADS
    // at the /sweepstakes page. NFKC folds Mathematical Bold back to plain ASCII.
    body = fb.body.trim().normalize('NFKC')
  } catch (e) {
    body = `(Draft failed: ${e instanceof Error ? e.message : String(e)} - try again, or write it via the facebook-post skill.)`
  }

  const entry = (s.entry_url ?? '').trim()
  const directLine =
    /^https?:\/\//i.test(entry) && !entry.endsWith('#') ? `\n(Direct entry link: ${entry})` : ''
  const draft = `${body}\n\n--- First comment (paste right after posting) ---\nEnter here: ${SWEEPS_PAGE_URL}${directLine}`

  await supabase
    .from('sweepstakes')
    .update({ social_draft: draft, social_draft_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/admin/sweepstakes')
}

/** Clear a stored Facebook draft (once posted, or to declutter). */
export async function clearSweepstakesDraftAction(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('sweepstakes').update({ social_draft: null, social_draft_at: null }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
}

/**
 * Toggle whether a sweepstakes has been posted to social.
 *
 * The dashboard "Sweepstakes running" tile nudges when running sweepstakes
 * still need a post (posted_social=false). Marking one posted clears it from
 * that nudge. The daily watcher never touches posted_social, so a human toggle
 * is the source of truth here.
 */
export async function togglePosted(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const posted = String(formData.get('posted') ?? '') === 'true'
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('sweepstakes').update({ posted_social: posted }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/admin')
}

/**
 * Manually end a sweepstakes (e.g. a source we can't reliably scrape, or one
 * the watcher keeps re-seeing after it actually closed). Removes it from the
 * running count without waiting for the watcher to notice it vanished.
 */
export async function endSweep(formData: FormData): Promise<void> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from('sweepstakes').update({ status: 'ended' }).eq('id', id)
  revalidatePath('/admin/sweepstakes')
  revalidatePath('/admin')
}
