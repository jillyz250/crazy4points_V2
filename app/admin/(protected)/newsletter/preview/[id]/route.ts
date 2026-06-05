/**
 * Live HTML preview route — returns the rendered newsletter email as a
 * standalone HTML response so the editor can embed it in an iframe.
 *
 * Lives under /admin/(protected)/ so the layout's auth gate applies.
 *
 * URL: /admin/newsletter/preview/<newsletter-id>
 * Iframed by the editor's Live preview section. Reload the iframe to
 * see edits — every load re-fetches the latest slots from the DB +
 * live bonus list, so the preview always matches what would actually
 * go out.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
  renderNewsletterV2Html,
  formatNewsletterDate,
  type CurrentBonusRow,
} from '@/utils/ai/newsletterEmailV2'
import { getActiveBonusAlerts } from '@/utils/ai/getActiveBonusAlerts'
import type {
  NewsletterSlots,
  AlsoHappeningItem,
  NewsletterSweetSpot,
} from '@/utils/ai/newsletterSlots'

const SLOT_SELECT =
  'id, week_of, sent_at, display_date, subject, subject_options, status, hero_kicker, jill_prompt, big_story_ref_type, big_story_ref_id, big_story_html, sweet_spot, also_happening, active_offers, jills_take_html, game_slug, game_title, game_clue_text'

type Row = {
  id: string
  week_of: string
  sent_at: string | null
  display_date: string | null
  subject: string | null
  subject_options: string[] | null
  status: 'draft' | 'sent' | 'failed'
  hero_kicker: string | null
  jill_prompt: string | null
  big_story_ref_type: 'alert' | 'intel' | null
  big_story_ref_id: string | null
  big_story_html: string | null
  sweet_spot: NewsletterSweetSpot | null
  also_happening: AlsoHappeningItem[] | null
  active_offers: NewsletterSlots['active_offers']
  jills_take_html: string | null
  game_slug: string | null
  game_title: string | null
  game_clue_text: string | null
}

function rowToSlots(r: Row): NewsletterSlots {
  return {
    hero_kicker: r.hero_kicker,
    display_date: r.display_date,
    game: { slug: r.game_slug, title: r.game_title, clue_text: r.game_clue_text },
    big_story_ref_type: r.big_story_ref_type,
    big_story_ref_id: r.big_story_ref_id,
    big_story_html: r.big_story_html,
    sweet_spot: r.sweet_spot ?? null,
    also_happening: Array.isArray(r.also_happening) ? r.also_happening : [],
    active_offers: r.active_offers ?? null,
    jills_take_html: r.jills_take_html,
    jill_prompt: r.jill_prompt,
    subject: r.subject ?? r.subject_options?.[0] ?? '',
    subject_options: r.subject_options ?? [],
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('newsletters')
    .select(SLOT_SELECT)
    .eq('id', id)
    .single()
  if (error || !data) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;color:#666;">Newsletter not found.</body></html>`,
      { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } },
    )
  }

  const row = data as Row
  const slots = rowToSlots(row)
  const currentBonuses: CurrentBonusRow[] = await getActiveBonusAlerts(supabase)

  const html = renderNewsletterV2Html({
    slots,
    weekOf: formatNewsletterDate(row),
    isPreview: true,
    currentBonuses,
  })

  return new NextResponse(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // No caching — every reload must show the latest content.
      'cache-control': 'no-store, max-age=0',
    },
  })
}
