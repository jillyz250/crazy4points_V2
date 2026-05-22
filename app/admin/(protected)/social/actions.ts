'use server'

/**
 * Phase 4.5 PR B — social variant generation server actions.
 *
 * generateSocialVariantsAction(topicId): fires all 4 generators (FB / IG /
 * LinkedIn / X) in parallel from one verified topic. All 4 variants land
 * with the same generation_group_id (uuid) so the bundle's narrative spine
 * is preserved on per-platform regenerate.
 *
 * regenerateSocialVariantAction(variantId): re-runs ONE platform's
 * generator, passing the other 3 in the bundle as sibling context so the
 * regen stays aligned with the group's framing (SV8).
 *
 * Preconditions (SV9): the parent topic must be `published`. Generating
 * before publish is blocked at the server-action level because it removes
 * the editorial gravity (humans skip alert review for the social copy/paste
 * shortcut otherwise).
 */
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/utils/supabase/server'
import { generateFacebook } from '@/utils/ai/variants/generateFacebook'
import { generateInstagram } from '@/utils/ai/variants/generateInstagram'
import { generateLinkedIn } from '@/utils/ai/variants/generateLinkedIn'
import { generateX } from '@/utils/ai/variants/generateX'
import { writeSocialVariant, type SocialFormat } from '@/utils/content/writeSocialVariant'
import type { GenerateSocialVariantArgs } from '@/utils/ai/variants/generateSocialVariant'

const SOCIAL_FORMATS: SocialFormat[] = ['facebook', 'instagram', 'linkedin', 'x']

interface TopicForSocial {
  id: string
  title: string
  summary: string | null
  fact_ledger: unknown
  primary_intent: string | null
  programs: string[]
  metadata: Record<string, unknown> | null
  status: string
}

async function loadTopic(supabase: SupabaseClient, topicId: string): Promise<TopicForSocial | null> {
  const { data } = await supabase
    .from('topics')
    .select('id, title, summary, fact_ledger, primary_intent, programs, metadata, status')
    .eq('id', topicId)
    .maybeSingle()
  return (data as TopicForSocial | null) ?? null
}

export async function generateSocialVariantsAction(
  topicId: string,
): Promise<{ ok: true; group_id: string; variants: { format: SocialFormat; variant_id: string }[] } | { ok: false; error: string }> {
  const supabase = createAdminClient()
  const topic = await loadTopic(supabase, topicId)
  if (!topic) return { ok: false, error: 'topic not found' }

  // SV9 — only generate when the topic's published variant has shipped.
  // Topic.status reflects "published" once any variant is published.
  if (topic.status !== 'published') {
    return {
      ok: false,
      error: `topic must be published before generating social variants (status=${topic.status}). Publish the alert first.`,
    }
  }

  const groupId = randomUUID()
  const baseArgs: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'> = {
    topic: {
      id: topic.id,
      title: topic.title,
      summary: topic.summary,
      fact_ledger: topic.fact_ledger,
      primary_intent: topic.primary_intent,
      programs: topic.programs ?? [],
      metadata: topic.metadata,
    },
  }

  try {
    const [fb, ig, li, x] = await Promise.all([
      generateFacebook(baseArgs),
      generateInstagram(baseArgs),
      generateLinkedIn(baseArgs),
      generateX(baseArgs),
    ])

    const results = await Promise.all([
      writeSocialVariant(supabase, { topic_id: topic.id, format: 'facebook', body: fb.body, hashtags: fb.hashtags, char_count: fb.char_count, generation_group_id: groupId }),
      writeSocialVariant(supabase, { topic_id: topic.id, format: 'instagram', body: ig.body, hashtags: ig.hashtags, char_count: ig.char_count, generation_group_id: groupId }),
      writeSocialVariant(supabase, { topic_id: topic.id, format: 'linkedin', body: li.body, hashtags: li.hashtags, char_count: li.char_count, generation_group_id: groupId }),
      writeSocialVariant(supabase, { topic_id: topic.id, format: 'x', body: x.body, hashtags: x.hashtags, char_count: x.char_count, generation_group_id: groupId }),
    ])

    revalidatePath('/admin/drafts')
    return {
      ok: true,
      group_id: groupId,
      variants: [
        { format: 'facebook', variant_id: results[0].variant_id },
        { format: 'instagram', variant_id: results[1].variant_id },
        { format: 'linkedin', variant_id: results[2].variant_id },
        { format: 'x', variant_id: results[3].variant_id },
      ],
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function regenerateSocialVariantAction(
  variantId: string,
): Promise<{ ok: true; variant_id: string; format: SocialFormat } | { ok: false; error: string }> {
  const supabase = createAdminClient()

  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, format, topic_id, generation_group_id')
    .eq('id', variantId)
    .maybeSingle()
  if (!variant) return { ok: false, error: 'variant not found' }
  if (!SOCIAL_FORMATS.includes(variant.format as SocialFormat)) {
    return { ok: false, error: `variant format=${variant.format} is not a social platform` }
  }

  const topic = await loadTopic(supabase, variant.topic_id as string)
  if (!topic) return { ok: false, error: 'topic not found' }
  if (topic.status !== 'published') {
    return { ok: false, error: `topic must be published (status=${topic.status})` }
  }

  // Load sibling variants from the same generation group — they're the
  // "narrative spine" that the regenerated variant must stay aligned with.
  const siblings: Array<{ platform: SocialFormat; body: string }> = []
  if (variant.generation_group_id) {
    const { data: sibs } = await supabase
      .from('content_variants')
      .select('format, body')
      .eq('generation_group_id', variant.generation_group_id)
      .neq('id', variantId)
    for (const s of sibs ?? []) {
      if (SOCIAL_FORMATS.includes(s.format as SocialFormat) && s.body) {
        siblings.push({ platform: s.format as SocialFormat, body: s.body as string })
      }
    }
  }

  const baseArgs = {
    topic: {
      id: topic.id,
      title: topic.title,
      summary: topic.summary,
      fact_ledger: topic.fact_ledger,
      primary_intent: topic.primary_intent,
      programs: topic.programs ?? [],
      metadata: topic.metadata,
    },
    siblings,
  }

  try {
    const fmt = variant.format as SocialFormat
    const gen = fmt === 'facebook' ? generateFacebook
      : fmt === 'instagram' ? generateInstagram
      : fmt === 'linkedin' ? generateLinkedIn
      : generateX
    const result = await gen(baseArgs)

    // Reuse the same generation_group_id — preserves spine across regenerate.
    const groupId = (variant.generation_group_id as string) ?? randomUUID()
    await writeSocialVariant(supabase, {
      topic_id: topic.id,
      format: fmt,
      body: result.body,
      hashtags: result.hashtags,
      char_count: result.char_count,
      generation_group_id: groupId,
    })

    revalidatePath('/admin/drafts')
    return { ok: true, variant_id: variantId, format: fmt }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
