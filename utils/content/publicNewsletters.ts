/**
 * Public newsletter archive data access. HARD GATE: an issue is public only if
 * status='sent' AND recipient_count>1 AND is_public=true. This guarantees a
 * test/preview send to just the owner (recipient_count=1) or a draft can never
 * surface. All rendering reads these STRUCTURED slot fields, never body_html
 * (the email HTML), so no tracking pixels / unsubscribe tokens / UTM params
 * ever reach a public page.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AlsoHappeningItem,
  ActiveOffers,
  ElevatedBonusItem,
  NewsletterSweetSpot,
} from '@/utils/ai/newsletterSlots'

export interface PublicNewsletterListItem {
  slug: string
  issue_number: number | null
  subject: string
  hero_kicker: string | null
  big_story_title: string | null
  sent_at: string | null
  week_of: string | null
}

export interface PublicNewsletter extends PublicNewsletterListItem {
  big_story_html: string | null
  sweet_spot: NewsletterSweetSpot | null
  also_happening: AlsoHappeningItem[]
  active_offers: ActiveOffers | null
  elevated_bonuses: ElevatedBonusItem[]
  jills_take_html: string | null
}

const PUBLIC_GATE = (q: any) => q.eq('status', 'sent').gt('recipient_count', 1).eq('is_public', true).not('slug', 'is', null)

const LIST_COLS = 'slug, issue_number, subject, hero_kicker, big_story_title, sent_at, week_of'

export async function getPublicNewsletters(supabase: SupabaseClient): Promise<PublicNewsletterListItem[]> {
  const { data } = await PUBLIC_GATE(supabase.from('newsletters').select(LIST_COLS))
    .order('sent_at', { ascending: false, nullsFirst: false })
  return (data ?? []) as PublicNewsletterListItem[]
}

export async function getPublicNewsletterBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicNewsletter | null> {
  const { data } = await PUBLIC_GATE(
    supabase
      .from('newsletters')
      .select(`${LIST_COLS}, big_story_html, sweet_spot, also_happening, active_offers, elevated_bonuses, jills_take_html`),
  )
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  const r = data as any
  return {
    slug: r.slug,
    issue_number: r.issue_number,
    subject: r.subject,
    hero_kicker: r.hero_kicker,
    big_story_title: r.big_story_title,
    sent_at: r.sent_at,
    week_of: r.week_of,
    big_story_html: r.big_story_html,
    sweet_spot: (r.sweet_spot as NewsletterSweetSpot) ?? null,
    also_happening: (r.also_happening as AlsoHappeningItem[]) ?? [],
    active_offers: (r.active_offers as ActiveOffers) ?? null,
    elevated_bonuses: (r.elevated_bonuses as ElevatedBonusItem[]) ?? [],
    jills_take_html: r.jills_take_html,
  }
}

/** Web title for an issue: prefer the editorial big-story title, else the email subject. */
export function issueTitle(n: PublicNewsletterListItem): string {
  return n.big_story_title || n.subject
}
