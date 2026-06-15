'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import {
  createTopic,
  updateTopic,
  getTopicBySlug,
  upsertVariant,
  updateVariant,
  getVariant,
} from '@/utils/supabase/queries'
import type {
  TopicType,
  FactLedgerEntry,
  VariantFormat,
  ContentVariant,
} from '@/utils/supabase/queries'
import { extractFactLedger } from '@/utils/content/extractFactLedger'
import { verifyTopic as runVerifyChecks, type VerifyError } from '@/utils/content/verifyTopic'
import { generateVariantByFormat, getPromptVersion } from '@/utils/content/generators'
import { factGrepCheck, type FactGrepResult } from '@/utils/content/factGrepCheck'
import { BRAND_VOICE } from '@/utils/ai/editorialRules'
import { publishByFormat, unpublishByFormat } from '@/utils/content/publishers'

const TOPIC_TYPES: TopicType[] = [
  'promo',
  'devaluation',
  'sweet_spot',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'policy_change',
  'industry_news',
  'signup_bonus',
  'referral_bonus',
  'retention_offer',
  'shopping_portal_bonus',
  'award_sale',
  'companion_pass',
  'dining_bonus',
  'fee_change',
  'card_refresh',
  'milestone_bonus',
  'card_credit',
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'glitch',
  'transfer_bonus',
  'other',
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function parseMultiline(raw: string): string[] {
  return raw
    .split(/[\n,]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseMultiValue(formData: FormData, key: string): string[] {
  const all = formData.getAll(key).map((v) => String(v).trim()).filter(Boolean)
  if (all.length > 0) return Array.from(new Set(all))
  return []
}

export async function createTopicAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin()
  const title = String(formData.get('title') ?? '').trim()
  const explicitSlug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const slug = explicitSlug || slugify(title)
  const summary = String(formData.get('summary') ?? '').trim() || null
  const source_markdown =
    String(formData.get('source_markdown') ?? '').trim() || null
  const source_urls = parseMultiline(String(formData.get('source_urls') ?? ''))
  const programs = parseMultiValue(formData, 'programs')
  const cards = parseMultiValue(formData, 'cards')
  const topic_type = String(formData.get('topic_type') ?? '') as TopicType
  const end_date_raw = String(formData.get('end_date') ?? '').trim()
  const end_date = end_date_raw ? new Date(end_date_raw).toISOString() : null
  const created_by =
    String(formData.get('created_by') ?? '').trim() || 'admin'

  if (!title) return { error: 'Title is required.' }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens only.' }
  }
  if (!TOPIC_TYPES.includes(topic_type)) {
    return { error: 'Pick a topic type.' }
  }

  const supabase = createAdminClient()
  try {
    await createTopic(supabase, {
      slug,
      title,
      summary,
      source_markdown,
      source_urls,
      fact_ledger: [],
      fact_check_status: 'pending',
      verified_at: null,
      verified_by: null,
      programs,
      cards,
      topic_type,
      end_date,
      status: 'draft',
      created_by,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create topic.'
    return {
      error: msg.includes('duplicate') ? `Slug "${slug}" already exists.` : msg,
    }
  }

  revalidatePath('/admin/topics')
  redirect(`/admin/topics/${slug}/edit`)
}

export async function updateTopicAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!id) return { error: 'Missing topic id.' }

  const title = String(formData.get('title') ?? '').trim()
  const summary = String(formData.get('summary') ?? '').trim() || null
  const source_markdown =
    String(formData.get('source_markdown') ?? '').trim() || null
  const source_urls = parseMultiline(String(formData.get('source_urls') ?? ''))
  const programs = parseMultiValue(formData, 'programs')
  const cards = parseMultiValue(formData, 'cards')
  const topic_type = String(formData.get('topic_type') ?? '') as TopicType
  const end_date_raw = String(formData.get('end_date') ?? '').trim()
  const end_date = end_date_raw ? new Date(end_date_raw).toISOString() : null

  if (!title) return { error: 'Title is required.' }
  if (!TOPIC_TYPES.includes(topic_type)) {
    return { error: 'Pick a topic type.' }
  }

  const supabase = createAdminClient()
  try {
    await updateTopic(supabase, id, {
      title,
      summary,
      source_markdown,
      source_urls,
      programs,
      cards,
      topic_type,
      end_date,
    })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to update topic.',
    }
  }

  revalidatePath('/admin/topics')
  revalidatePath(`/admin/topics/${slug}/edit`)
  return {}
}

export async function extractFactLedgerAction(
  formData: FormData,
): Promise<{ error?: string; entries?: FactLedgerEntry[] }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!id) return { error: 'Missing topic id.' }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, slug)
  if (!topic) return { error: 'Topic not found.' }

  const result = await extractFactLedger({
    topicId: topic.id,
    sourceMarkdown: topic.source_markdown ?? '',
    sourceUrls: topic.source_urls,
  })
  if (!result.ok) return { error: result.error }

  try {
    await updateTopic(supabase, topic.id, {
      fact_ledger: result.entries,
      // Re-extracting resets the verification gate.
      fact_check_status: 'pending',
      verified_at: null,
      verified_by: null,
    })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save fact ledger.',
    }
  }

  revalidatePath(`/admin/topics/${slug}/edit`)
  return { entries: result.entries }
}

export async function updateFactLedgerAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const ledgerJson = String(formData.get('fact_ledger') ?? '').trim()
  if (!id) return { error: 'Missing topic id.' }

  let entries: FactLedgerEntry[]
  try {
    entries = JSON.parse(ledgerJson) as FactLedgerEntry[]
    if (!Array.isArray(entries)) throw new Error('fact_ledger must be an array')
  } catch (e) {
    return {
      error: 'Invalid fact_ledger JSON: ' + (e instanceof Error ? e.message : 'parse failed'),
    }
  }

  const supabase = createAdminClient()
  try {
    await updateTopic(supabase, id, {
      fact_ledger: entries,
      fact_check_status: 'pending',
      verified_at: null,
      verified_by: null,
    })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save fact ledger.',
    }
  }

  revalidatePath(`/admin/topics/${slug}/edit`)
  return {}
}

export async function verifyTopicAction(
  formData: FormData,
): Promise<{ status?: 'verified' | 'partially_verified' | 'failed'; errors?: VerifyError[]; error?: string }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const verified_by =
    String(formData.get('verified_by') ?? '').trim() || 'admin'
  if (!id) return { error: 'Missing topic id.' }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, slug)
  if (!topic) return { error: 'Topic not found.' }

  if (!topic.fact_ledger || topic.fact_ledger.length === 0) {
    return {
      error:
        'Fact ledger is empty — run "Extract facts" before verifying.',
    }
  }

  const result = runVerifyChecks({
    sourceMarkdown: topic.source_markdown ?? '',
    sourceUrls: topic.source_urls,
    factLedger: topic.fact_ledger,
  })

  const now = new Date().toISOString()
  try {
    if (result.status === 'failed') {
      await updateTopic(supabase, topic.id, {
        fact_check_status: 'failed',
        verified_at: null,
        verified_by: null,
      })
    } else {
      await updateTopic(supabase, topic.id, {
        fact_check_status: result.status,
        verified_at: now,
        verified_by,
      })
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to save verification.',
    }
  }

  revalidatePath('/admin/topics')
  revalidatePath(`/admin/topics/${slug}/edit`)
  return { status: result.status, errors: result.errors }
}

export async function archiveTopicAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!id) return { error: 'Missing topic id.' }

  const supabase = createAdminClient()
  try {
    await updateTopic(supabase, id, { status: 'archived' })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to archive topic.',
    }
  }

  revalidatePath('/admin/topics')
  if (slug) revalidatePath(`/admin/topics/${slug}/edit`)
  return {}
}

// ─── Variant actions (PR 3) ────────────────────────────────────────────────

const VARIANT_FORMATS: VariantFormat[] = [
  'alert',
  'blog',
  'newsletter',
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'threads',
]

export async function generateVariantAction(
  formData: FormData,
): Promise<{
  ok: boolean
  error?: string
  variantId?: string
  factGrepResult?: FactGrepResult
  status?: ContentVariant['status']
}> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const format = String(formData.get('format') ?? '').trim() as VariantFormat
  if (!slug) return { ok: false, error: 'Missing topic slug.' }
  if (!VARIANT_FORMATS.includes(format)) {
    return { ok: false, error: `Unknown variant format: ${format}` }
  }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, slug)
  if (!topic) return { ok: false, error: 'Topic not found.' }

  if (
    topic.fact_check_status !== 'verified' &&
    topic.fact_check_status !== 'partially_verified'
  ) {
    return {
      ok: false,
      error:
        'Topic must be verified (or partially verified) before generating variants. Run "Verify topic" first.',
    }
  }
  if (!topic.fact_ledger || topic.fact_ledger.length === 0) {
    return { ok: false, error: 'Fact ledger is empty.' }
  }

  // Pull display names for cards + programs so factGrepCheck knows they're legit.
  let knownCardNames: string[] = []
  let knownProgramNames: string[] = []
  if (topic.cards.length > 0) {
    const { data } = await supabase
      .from('credit_cards')
      .select('name')
      .in('slug', topic.cards)
    knownCardNames = ((data ?? []) as Array<{ name: string }>).map((r) => r.name)
  }
  if (topic.programs.length > 0) {
    const { data } = await supabase
      .from('programs')
      .select('name')
      .in('slug', topic.programs)
    knownProgramNames = ((data ?? []) as Array<{ name: string }>).map((r) => r.name)
  }

  // Generate.
  let generated
  try {
    generated = await generateVariantByFormat(format, {
      topic,
      factLedger: topic.fact_ledger,
      brandVoice: BRAND_VOICE,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Generator failed.',
    }
  }

  // Fact-grep.
  const grep = factGrepCheck(
    generated.body,
    topic.fact_ledger,
    knownCardNames,
    knownProgramNames,
  )

  const status: ContentVariant['status'] = grep.ok ? 'draft' : 'needs_review'
  const metadata = {
    ...generated.metadata,
    fact_grep_unmatched: grep.unmatched,
  }

  try {
    const saved = await upsertVariant(supabase, {
      topic_id: topic.id,
      format,
      title: generated.title,
      body: generated.body,
      metadata,
      brand_voice_run: false,
      fact_check_run: false,
      fact_check_results: null,
      status,
      published_at: null,
      publish_target_url: null,
      generated_by: 'sonnet',
      generation_prompt_version: getPromptVersion(format),
    })
    revalidatePath(`/admin/topics/${slug}/edit`)
    return {
      ok: true,
      variantId: saved.id,
      factGrepResult: grep,
      status: saved.status,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to save variant.',
    }
  }
}

export async function updateVariantBodyAction(
  formData: FormData,
): Promise<{
  ok: boolean
  error?: string
  factGrepResult?: FactGrepResult
  status?: ContentVariant['status']
}> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const format = String(formData.get('format') ?? '').trim() as VariantFormat
  const body = String(formData.get('body') ?? '')
  const title = String(formData.get('title') ?? '').trim() || null
  if (!slug) return { ok: false, error: 'Missing topic slug.' }
  if (!VARIANT_FORMATS.includes(format)) {
    return { ok: false, error: `Unknown variant format: ${format}` }
  }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, slug)
  if (!topic) return { ok: false, error: 'Topic not found.' }

  const existing = await getVariant(supabase, topic.id, format)
  if (!existing) {
    return { ok: false, error: 'Variant does not exist yet. Generate first.' }
  }

  // Re-run fact-grep against the edited body.
  let knownCardNames: string[] = []
  let knownProgramNames: string[] = []
  if (topic.cards.length > 0) {
    const { data } = await supabase
      .from('credit_cards')
      .select('name')
      .in('slug', topic.cards)
    knownCardNames = ((data ?? []) as Array<{ name: string }>).map((r) => r.name)
  }
  if (topic.programs.length > 0) {
    const { data } = await supabase
      .from('programs')
      .select('name')
      .in('slug', topic.programs)
    knownProgramNames = ((data ?? []) as Array<{ name: string }>).map((r) => r.name)
  }
  const grep = factGrepCheck(body, topic.fact_ledger, knownCardNames, knownProgramNames)

  // If the variant was already approved/published, editor edits should knock
  // it back to draft for re-review. We don't auto-publish from this action.
  const nextStatus: ContentVariant['status'] = grep.ok
    ? existing.status === 'published'
      ? 'published' // editor edit of a published variant: keep it; PR 4 handles republish flow
      : 'draft'
    : 'needs_review'

  const metadata = {
    ...(existing.metadata ?? {}),
    fact_grep_unmatched: grep.unmatched,
  }

  try {
    await updateVariant(supabase, existing.id, {
      title,
      body,
      metadata,
      status: nextStatus,
      generated_by: 'editor',
    })
    revalidatePath(`/admin/topics/${slug}/edit`)
    return { ok: true, factGrepResult: grep, status: nextStatus }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to save variant.',
    }
  }
}

// ─── Publish / unpublish per variant (PR 4) ────────────────────────────────

export async function publishVariantAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string; publishTargetUrl?: string | null }> {
  await assertAdmin()
  const topicSlug = String(formData.get('topicSlug') ?? formData.get('slug') ?? '').trim()
  const format = String(formData.get('format') ?? '').trim() as VariantFormat
  const publishTargetUrlInput =
    String(formData.get('publishTargetUrl') ?? '').trim() || null

  if (!topicSlug) return { ok: false, error: 'Missing topic slug.' }
  if (!VARIANT_FORMATS.includes(format)) {
    return { ok: false, error: `Unknown variant format: ${format}` }
  }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, topicSlug)
  if (!topic) return { ok: false, error: 'Topic not found.' }

  // HARD GATE 1 — topic must be verified.
  if (
    topic.fact_check_status !== 'verified' &&
    topic.fact_check_status !== 'partially_verified'
  ) {
    return {
      ok: false,
      error: 'Topic must be verified before publishing variants.',
    }
  }

  const variant = await getVariant(supabase, topic.id, format)
  if (!variant) return { ok: false, error: 'Variant does not exist yet.' }

  // HARD GATE 2 — variant must be approved.
  if (variant.status !== 'approved') {
    return {
      ok: false,
      error: 'Variant must be approved before publishing.',
    }
  }

  // Dispatch to format-specific publisher.
  let publishTargetUrl: string | null
  try {
    const result = await publishByFormat(format, {
      supabase,
      topic,
      variant,
      publishTargetUrl: publishTargetUrlInput,
    })
    publishTargetUrl = result.publishTargetUrl
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Publish handler failed.',
    }
  }

  // Update the variant row.
  try {
    await updateVariant(supabase, variant.id, {
      status: 'published',
      published_at: new Date().toISOString(),
      publish_target_url: publishTargetUrl,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to update variant.',
    }
  }

  revalidatePath(`/admin/topics/${topicSlug}/edit`)
  if (format === 'alert') revalidatePath(`/alerts/${topicSlug}`)
  if (format === 'blog') revalidatePath(`/blog/${topicSlug}`)
  return { ok: true, publishTargetUrl }
}

export async function unpublishVariantAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin()
  const topicSlug = String(formData.get('topicSlug') ?? formData.get('slug') ?? '').trim()
  const format = String(formData.get('format') ?? '').trim() as VariantFormat

  if (!topicSlug) return { ok: false, error: 'Missing topic slug.' }
  if (!VARIANT_FORMATS.includes(format)) {
    return { ok: false, error: `Unknown variant format: ${format}` }
  }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, topicSlug)
  if (!topic) return { ok: false, error: 'Topic not found.' }

  const variant = await getVariant(supabase, topic.id, format)
  if (!variant) return { ok: false, error: 'Variant not found.' }
  if (variant.status !== 'published') {
    return { ok: false, error: 'Variant is not currently published.' }
  }

  try {
    await unpublishByFormat(format, { supabase, topic, variant })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unpublish handler failed.',
    }
  }

  try {
    await updateVariant(supabase, variant.id, {
      status: 'approved',
      published_at: null,
      publish_target_url: null,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to update variant.',
    }
  }

  revalidatePath(`/admin/topics/${topicSlug}/edit`)
  if (format === 'alert') revalidatePath(`/alerts/${topicSlug}`)
  if (format === 'blog') revalidatePath(`/blog/${topicSlug}`)
  return { ok: true }
}

// Lightweight admin helper — flip an approved-eligible variant to 'approved'.
// Editors need a way to move 'draft' → 'approved' so the publish gate can pass.
export async function approveVariantAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin()
  const topicSlug = String(formData.get('topicSlug') ?? formData.get('slug') ?? '').trim()
  const format = String(formData.get('format') ?? '').trim() as VariantFormat
  if (!topicSlug) return { ok: false, error: 'Missing topic slug.' }
  if (!VARIANT_FORMATS.includes(format)) {
    return { ok: false, error: `Unknown variant format: ${format}` }
  }

  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, topicSlug)
  if (!topic) return { ok: false, error: 'Topic not found.' }
  const variant = await getVariant(supabase, topic.id, format)
  if (!variant) return { ok: false, error: 'Variant not found.' }
  if (variant.status !== 'draft' && variant.status !== 'needs_review') {
    return {
      ok: false,
      error: `Only draft / needs_review variants can be approved (current: ${variant.status}).`,
    }
  }

  try {
    await updateVariant(supabase, variant.id, { status: 'approved' })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to approve variant.',
    }
  }
  revalidatePath(`/admin/topics/${topicSlug}/edit`)
  return { ok: true }
}

export async function activateTopicAction(
  formData: FormData,
): Promise<{ error?: string }> {
  await assertAdmin()
  const id = String(formData.get('id') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!id) return { error: 'Missing topic id.' }

  const supabase = createAdminClient()
  try {
    await updateTopic(supabase, id, { status: 'active' })
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Failed to activate topic.',
    }
  }

  revalidatePath('/admin/topics')
  if (slug) revalidatePath(`/admin/topics/${slug}/edit`)
  return {}
}
