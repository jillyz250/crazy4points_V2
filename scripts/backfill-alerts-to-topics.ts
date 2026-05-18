/**
 * Backfill legacy `alerts` + `content_ideas` rows into `topics` +
 * `content_variants` (the new content-system tables introduced by PR 1).
 *
 * See plans/content-system-rehaul.md and plans/content-system-backfill.md.
 *
 * Read-only against legacy tables. Writes to topics + content_variants
 * ONLY. Idempotent — safe to re-run. Defaults to dry-run.
 *
 * Usage:
 *   npx tsx scripts/backfill-alerts-to-topics.ts             # dry run (default)
 *   npx tsx scripts/backfill-alerts-to-topics.ts --dry-run   # dry run (explicit)
 *   npx tsx scripts/backfill-alerts-to-topics.ts --write     # actually insert rows
 *
 * Rollback:
 *   delete from topics where created_by = 'backfill-2026-05-18';
 *   (cascades to content_variants via FK on delete cascade)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ── env loader ────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    '/Users/jillzeller/Desktop/Github/crazy4points_V2/.env.local',
  ]
  const path = candidates.find((p) => existsSync(p))
  if (!path) return
  const text = readFileSync(path, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

// ── args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const DRY_RUN = !WRITE // default to dry-run

// ── constants ─────────────────────────────────────────────────────────────

const BACKFILL_TAG = 'backfill-2026-05-18'

// topics.topic_type CHECK list (mirror of migration 297)
const TOPIC_TYPES = new Set([
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
])

// ── types (loose — only what we read) ─────────────────────────────────────

interface LegacyAlert {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  type: string | null
  status: string | null
  source_url: string | null
  action_type: string | null
  end_date: string | null
  published_at: string | null
  impact_score: number | null
  value_score: number | null
  rarity_score: number | null
  impact_justification: string | null
  created_at: string
}

interface LegacyContentIdea {
  id: string
  type: string // 'newsletter' | 'blog'
  title: string
  pitch: string
  status: string
  source_alert_id: string | null
  notes: string | null
  slug: string | null
  published_at: string | null
  created_at: string
}

interface ProgramJunctionRow {
  alert_id: string
  programs: { slug: string } | null
}

interface ExistingTopic {
  id: string
  slug: string
}

interface ExistingVariant {
  topic_id: string
  format: string
}

// ── helpers ───────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function mapTopicType(legacy: string | null): string {
  if (!legacy) return 'other'
  return TOPIC_TYPES.has(legacy) ? legacy : 'other'
}

function mapTopicStatus(legacyStatus: string | null): 'active' | 'draft' {
  return legacyStatus === 'published' ? 'active' : 'draft'
}

function mapVariantStatus(legacyStatus: string | null): 'published' | 'draft' {
  return legacyStatus === 'published' ? 'published' : 'draft'
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.'
    )
    process.exit(1)
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })

  console.log(
    `${DRY_RUN ? '[DRY RUN] ' : '[WRITE] '}backfill-alerts-to-topics`
  )
  console.log('')

  // 1. Pull every legacy alert
  const { data: alertsRaw, error: alertsErr } = await sb
    .from('alerts')
    .select(
      'id, slug, title, summary, description, type, status, source_url, action_type, end_date, published_at, impact_score, value_score, rarity_score, impact_justification, created_at'
    )
    .order('created_at', { ascending: true })

  if (alertsErr) {
    console.error('Failed to fetch alerts:', alertsErr)
    process.exit(1)
  }
  const alerts = (alertsRaw ?? []) as LegacyAlert[]
  console.log(`Legacy alerts seen: ${alerts.length}`)

  // 2. Pull alert_programs joined with programs.slug for program tagging
  const { data: junctionRaw, error: jErr } = await sb
    .from('alert_programs')
    .select('alert_id, programs(slug)')

  if (jErr) {
    console.error('Failed to fetch alert_programs:', jErr)
    process.exit(1)
  }
  const programsByAlert = new Map<string, string[]>()
  for (const row of (junctionRaw ?? []) as ProgramJunctionRow[]) {
    const slug = row.programs?.slug
    if (!slug) continue
    const arr = programsByAlert.get(row.alert_id) ?? []
    if (!arr.includes(slug)) arr.push(slug)
    programsByAlert.set(row.alert_id, arr)
  }

  // 3. Pull content_ideas
  const { data: ideasRaw, error: ideasErr } = await sb
    .from('content_ideas')
    .select(
      'id, type, title, pitch, status, source_alert_id, notes, slug, published_at, created_at'
    )
    .eq('type', 'newsletter')
    .order('created_at', { ascending: true })

  if (ideasErr) {
    console.error('Failed to fetch content_ideas:', ideasErr)
    process.exit(1)
  }
  const ideas = (ideasRaw ?? []) as LegacyContentIdea[]
  console.log(`Legacy content_ideas (newsletter) seen: ${ideas.length}`)

  // 4. Pull existing topics + variants for idempotency
  const { data: existingTopicsRaw, error: tErr } = await sb
    .from('topics')
    .select('id, slug')
  if (tErr) {
    console.error('Failed to fetch existing topics:', tErr)
    process.exit(1)
  }
  const existingTopics = (existingTopicsRaw ?? []) as ExistingTopic[]
  const topicIdBySlug = new Map<string, string>()
  for (const t of existingTopics) topicIdBySlug.set(t.slug, t.id)

  const { data: existingVariantsRaw, error: vErr } = await sb
    .from('content_variants')
    .select('topic_id, format')
  if (vErr) {
    console.error('Failed to fetch existing content_variants:', vErr)
    process.exit(1)
  }
  const existingVariants = (existingVariantsRaw ?? []) as ExistingVariant[]
  const variantKey = (topicId: string, format: string) => `${topicId}:${format}`
  const existingVariantSet = new Set(
    existingVariants.map((v) => variantKey(v.topic_id, v.format))
  )

  // ── plan: build inserts ────────────────────────────────────────────────

  type TopicInsert = {
    slug: string
    title: string
    summary: string | null
    source_markdown: string | null
    source_urls: string[]
    fact_ledger: unknown[]
    fact_check_status: 'pending'
    programs: string[]
    cards: string[]
    topic_type: string
    end_date: string | null
    status: 'active' | 'draft'
    created_by: string
    created_at: string
  }

  type VariantInsert = {
    topic_id?: string // filled in after topic insert (or from existing)
    _topicSlug: string // internal marker so we can resolve topic_id after insert
    format: 'alert' | 'newsletter'
    title: string | null
    body: string | null
    metadata: Record<string, unknown>
    status: 'published' | 'draft'
    published_at: string | null
    publish_target_url: string | null
    generated_by: 'editor'
  }

  const topicsToInsert: TopicInsert[] = []
  const variantsToInsert: VariantInsert[] = []
  const errors: Array<{ slug: string; message: string }> = []

  let topicsSkipped = 0
  let variantsSkipped = 0

  // Track planned slugs (so a second alert with the same slug in this batch
  // doesn't try to insert twice — shouldn't happen but defensive).
  const plannedSlugs = new Set<string>()

  // ── alerts → topic + alert-variant ─────────────────────────────────────
  for (const a of alerts) {
    try {
      if (!a.slug || !a.title) {
        errors.push({
          slug: a.slug ?? a.id,
          message: 'missing slug or title',
        })
        continue
      }

      const alreadyExists =
        topicIdBySlug.has(a.slug) || plannedSlugs.has(a.slug)

      if (alreadyExists) {
        topicsSkipped++
      } else {
        const sourceUrls = a.source_url ? [a.source_url] : []
        topicsToInsert.push({
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          source_markdown: a.description,
          source_urls: sourceUrls,
          fact_ledger: [],
          fact_check_status: 'pending',
          programs: programsByAlert.get(a.id) ?? [],
          cards: [],
          topic_type: mapTopicType(a.type),
          end_date: a.end_date,
          status: mapTopicStatus(a.status),
          created_by: BACKFILL_TAG,
          created_at: a.created_at,
        })
        plannedSlugs.add(a.slug)
      }

      // Variant: only plan if a topic exists OR is about to be inserted, and
      // the (topic, 'alert') variant doesn't already exist. We can't know
      // the topic_id until insert, so we key on slug + resolve later.
      const existingTopicId = topicIdBySlug.get(a.slug)
      const variantAlreadyExists =
        existingTopicId !== undefined &&
        existingVariantSet.has(variantKey(existingTopicId, 'alert'))

      if (variantAlreadyExists) {
        variantsSkipped++
      } else {
        variantsToInsert.push({
          _topicSlug: a.slug,
          format: 'alert',
          title: a.title,
          body: a.description,
          metadata: {
            source_url: a.source_url,
            action_type: a.action_type,
            impact_score: a.impact_score,
            value_score: a.value_score,
            rarity_score: a.rarity_score,
            impact_justification: a.impact_justification,
          },
          status: mapVariantStatus(a.status),
          published_at: a.published_at,
          publish_target_url: `/alerts/${a.slug}`,
          generated_by: 'editor',
        })
      }
    } catch (e) {
      errors.push({
        slug: a.slug ?? a.id,
        message: (e as Error).message,
      })
    }
  }

  // ── content_ideas → variant (or standalone topic + variant) ───────────
  const alertById = new Map<string, LegacyAlert>()
  for (const a of alerts) alertById.set(a.id, a)

  for (const idea of ideas) {
    try {
      let topicSlug: string

      if (idea.source_alert_id) {
        const sourceAlert = alertById.get(idea.source_alert_id)
        if (!sourceAlert) {
          errors.push({
            slug: idea.slug ?? idea.id,
            message: `content_idea ${idea.id} references missing alert ${idea.source_alert_id}`,
          })
          continue
        }
        topicSlug = sourceAlert.slug
        // Topic will already be in topicsToInsert or topicIdBySlug; nothing
        // extra to do on the topic side.
      } else {
        // Standalone topic for orphan content_idea.
        const baseSlug = idea.slug ?? slugify(idea.title)
        if (!baseSlug) {
          errors.push({
            slug: idea.id,
            message: 'content_idea has no slug or slugifiable title',
          })
          continue
        }
        topicSlug = `idea-${baseSlug}`
        const alreadyExists =
          topicIdBySlug.has(topicSlug) || plannedSlugs.has(topicSlug)
        if (alreadyExists) {
          topicsSkipped++
        } else {
          topicsToInsert.push({
            slug: topicSlug,
            title: idea.title,
            summary: idea.pitch,
            source_markdown: idea.pitch,
            source_urls: [],
            fact_ledger: [],
            fact_check_status: 'pending',
            programs: [],
            cards: [],
            topic_type: 'other',
            end_date: null,
            status: idea.status === 'published' ? 'active' : 'draft',
            created_by: BACKFILL_TAG,
            created_at: idea.created_at,
          })
          plannedSlugs.add(topicSlug)
        }
      }

      // Newsletter variant.
      const existingTopicId = topicIdBySlug.get(topicSlug)
      const variantAlreadyExists =
        existingTopicId !== undefined &&
        existingVariantSet.has(variantKey(existingTopicId, 'newsletter'))

      if (variantAlreadyExists) {
        variantsSkipped++
      } else {
        variantsToInsert.push({
          _topicSlug: topicSlug,
          format: 'newsletter',
          title: idea.title,
          body: idea.pitch,
          metadata: { notes: idea.notes },
          status: mapVariantStatus(idea.status),
          published_at: idea.published_at,
          publish_target_url: null,
          generated_by: 'editor',
        })
      }
    } catch (e) {
      errors.push({
        slug: idea.slug ?? idea.id,
        message: (e as Error).message,
      })
    }
  }

  // ── report ────────────────────────────────────────────────────────────
  console.log('')
  console.log('Plan:')
  console.log(`  Topics to create:   ${topicsToInsert.length}`)
  console.log(`  Topics skipped:     ${topicsSkipped} (already exist)`)
  console.log(`  Variants to create: ${variantsToInsert.length}`)
  console.log(`  Variants skipped:   ${variantsSkipped} (already exist)`)
  console.log(`  Errors:             ${errors.length}`)
  if (topicsToInsert.length > 0) {
    console.log('')
    console.log('  Sample topic slugs:')
    for (const t of topicsToInsert.slice(0, 5)) {
      console.log(`    - ${t.slug}  [${t.topic_type}, ${t.status}]`)
    }
  }
  if (errors.length > 0) {
    console.log('')
    console.log('  Errors:')
    for (const e of errors.slice(0, 20)) {
      console.log(`    - ${e.slug}: ${e.message}`)
    }
  }

  if (DRY_RUN) {
    console.log('')
    console.log(
      'Done. Run with --write to apply, or --dry-run to confirm again.'
    )
    return
  }

  // ── write phase ───────────────────────────────────────────────────────
  console.log('')
  console.log('Writing…')

  // Insert topics, then look up ids to resolve variants.
  let topicsCreated = 0
  if (topicsToInsert.length > 0) {
    const BATCH = 100
    for (let i = 0; i < topicsToInsert.length; i += BATCH) {
      const slice = topicsToInsert.slice(i, i + BATCH)
      const { data: inserted, error: insertErr } = await sb
        .from('topics')
        .insert(slice)
        .select('id, slug')
      if (insertErr) {
        console.error(`Topic insert batch failed at ${i}:`, insertErr)
        process.exit(1)
      }
      for (const row of (inserted ?? []) as ExistingTopic[]) {
        topicIdBySlug.set(row.slug, row.id)
      }
      topicsCreated += slice.length
      process.stdout.write(
        `\r  Topics inserted: ${topicsCreated}/${topicsToInsert.length}`
      )
    }
    console.log('')
  }

  // Resolve topic_ids on variants and filter out any that lost their topic.
  const resolvedVariants: Array<Omit<VariantInsert, '_topicSlug'>> = []
  for (const v of variantsToInsert) {
    const topicId = topicIdBySlug.get(v._topicSlug)
    if (!topicId) {
      errors.push({
        slug: v._topicSlug,
        message: 'topic_id not resolvable post-insert (unexpected)',
      })
      continue
    }
    const { _topicSlug, ...rest } = v
    resolvedVariants.push({ ...rest, topic_id: topicId })
  }

  let variantsCreated = 0
  if (resolvedVariants.length > 0) {
    const BATCH = 100
    for (let i = 0; i < resolvedVariants.length; i += BATCH) {
      const slice = resolvedVariants.slice(i, i + BATCH)
      const { error: insertErr } = await sb
        .from('content_variants')
        .insert(slice)
      if (insertErr) {
        console.error(`Variant insert batch failed at ${i}:`, insertErr)
        process.exit(1)
      }
      variantsCreated += slice.length
      process.stdout.write(
        `\r  Variants inserted: ${variantsCreated}/${resolvedVariants.length}`
      )
    }
    console.log('')
  }

  console.log('')
  console.log('Done.')
  console.log(`  Topics created:   ${topicsCreated}`)
  console.log(`  Variants created: ${variantsCreated}`)
  console.log(`  Errors:           ${errors.length}`)
}

main().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})

// Suppress "declared but never used" on SupabaseClient for editor convenience.
export type _Sb = SupabaseClient
