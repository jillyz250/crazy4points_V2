'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { generateFacebook } from '@/utils/ai/variants/generateFacebook'

const SWEEPS_PAGE_URL = 'https://www.crazy4points.com/sweepstakes'

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
