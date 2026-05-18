'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import {
  createTopic,
  updateTopic,
  getTopicBySlug,
} from '@/utils/supabase/queries'
import type {
  TopicType,
  FactLedgerEntry,
} from '@/utils/supabase/queries'
import { extractFactLedger } from '@/utils/content/extractFactLedger'
import { verifyTopic as runVerifyChecks, type VerifyError } from '@/utils/content/verifyTopic'

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

export async function activateTopicAction(
  formData: FormData,
): Promise<{ error?: string }> {
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
