'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { logSystemError } from '@/utils/supabase/queries'
import { writeArticleBody } from '@/utils/ai/writeArticleBody'
import { verifyArticleBody } from '@/utils/ai/verifyArticleBody'
import { webVerifyClaims } from '@/utils/ai/verifyAlertDraft'
import { voiceCheckArticle } from '@/utils/ai/voiceCheckArticle'
import { originalityCheck } from '@/utils/ai/originalityCheck'
import { programsToSourceText, PROGRAM_FIELDS_FOR_SOURCE } from '@/utils/ai/programSourceText'
import type { Program } from '@/utils/supabase/queries'
import { preparePublishUpdates } from './_lib/preparePublish'
import { computeReadingTimeMinutes } from '@/lib/blog/readingTime'
import { isBlogCategorySlug, BLOG_CATEGORY_SLUGS } from '@/lib/blog/categories'

type ProgramSource = Pick<
  Program,
  | 'name'
  | 'slug'
  | 'type'
  | 'intro'
  | 'sweet_spots'
  | 'how_to_spend'
  | 'quirks'
  | 'lounge_access'
  | 'transfer_partners'
  | 'tier_benefits'
  | 'alliance'
  | 'hubs'
  | 'description'
>

/**
 * Returns Program rows linked to an idea — via its source_alert_id (if any)
 * through the alert_programs junction. Used as authoritative source material
 * for both the writer and the fact-checker, so anything we publish about
 * Flying Blue (etc.) is grounded in our own page content, not just an alert.
 */
async function getProgramsForIdea(
  supabase: ReturnType<typeof createAdminClient>,
  sourceAlertId: string | null,
): Promise<ProgramSource[]> {
  if (!sourceAlertId) return []
  const { data, error } = await supabase
    .from('alert_programs')
    .select(`programs!inner(${PROGRAM_FIELDS_FOR_SOURCE})`)
    .eq('alert_id', sourceAlertId)
  if (error || !data) return []
  // Supabase typed-array returns: each row has { programs: ProgramRow }
  return data
    .map((row) => (row as unknown as { programs: ProgramSource | null }).programs)
    .filter((p): p is ProgramSource => p !== null)
}

type IdeaStatus = 'new' | 'queued' | 'drafted' | 'published' | 'dismissed'
const VALID: IdeaStatus[] = ['new', 'queued', 'drafted', 'published', 'dismissed']

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  title: string,
  ideaId: string,
): Promise<string> {
  const base = slugify(title) || 'post'
  let candidate = base
  for (let i = 0; i < 50; i++) {
    const { data } = await supabase
      .from('content_ideas')
      .select('id')
      .eq('slug', candidate)
      .neq('id', ideaId)
      .limit(1)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${base}-${i + 2}`
  }
  return `${base}-${Date.now()}`
}

export async function updateContentIdeaStatusAction(
  id: string,
  status: string
): Promise<void> {
  if (!VALID.includes(status as IdeaStatus)) {
    throw new Error(`Invalid status: ${status}`)
  }
  const supabase = createAdminClient()

  // Publish gate: extracted to preparePublishUpdates() so the validation logic is
  // testable. Hard blocks (article body, excerpt-or-pitch) cannot be overridden.
  // Soft gates (category, fact-check, voice, originality) can be overridden by
  // setting override_reason on the idea row.
  if (status === 'published') {
    const { data: idea, error: fetchErr } = await supabase
      .from('content_ideas')
      .select('id, title, type, slug, pitch, excerpt, category, article_body, written_at, fact_checked_at, fact_check_claims, voice_checked_at, voice_pass, originality_checked_at, originality_pass, override_reason')
      .eq('id', id)
      .single()
    if (fetchErr || !idea) throw new Error(fetchErr?.message ?? 'Idea not found')

    const plan = preparePublishUpdates(idea as Parameters<typeof preparePublishUpdates>[0])
    const overridden = (idea.override_reason ?? '').trim().length > 0

    if (plan.blockers.length > 0) {
      throw new Error(`Cannot publish — ${plan.blockers.join('; ')}.`)
    }
    if (plan.missing.length > 0 && !overridden) {
      throw new Error(`Cannot publish — ${plan.missing.join('; ')}. (Set Override Reason on the idea to publish anyway.)`)
    }
    if (plan.missing.length > 0 && overridden) {
      console.log(`[content-ideas] override publishing idea ${id} despite: ${plan.missing.join('; ')} — reason: ${idea.override_reason}`)
    }

    const now = new Date().toISOString()
    const slug = idea.slug ?? (await uniqueSlug(supabase, idea.title, id))
    const { error: pubErr } = await supabase
      .from('content_ideas')
      .update({
        status,
        slug,
        published_at: now,
        updated_at: now,
        excerpt: plan.updates.excerpt,
        reading_time_minutes: plan.updates.reading_time_minutes,
      })
      .eq('id', id)
    if (pubErr) throw pubErr
    revalidatePath('/admin/content-ideas')
    if (idea.type === 'blog') {
      revalidatePath('/blog')
      revalidatePath(`/blog/${slug}`)
    }
    return
  }

  const { error } = await supabase
    .from('content_ideas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/content-ideas')
}

export type WriteArticleResult =
  | { ok: true }
  | { ok: false; error: string }

export async function writeArticleAction(id: string): Promise<WriteArticleResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, type, title, pitch, source_alert_id')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }
  if (idea.type !== 'newsletter' && idea.type !== 'blog') {
    return { ok: false, error: `Unsupported idea type: ${idea.type}` }
  }

  let sourceAlert = null
  if (idea.source_alert_id) {
    const { data: alert } = await supabase
      .from('alerts')
      .select('title, summary, description, end_date')
      .eq('id', idea.source_alert_id)
      .single()
    if (alert) sourceAlert = alert
  }

  const programs = await getProgramsForIdea(supabase, idea.source_alert_id)
  const programContext = programs.length > 0 ? programsToSourceText(programs) : null

  const draft = await writeArticleBody({
    type: idea.type,
    title: idea.title,
    pitch: idea.pitch,
    source_alert: sourceAlert,
    program_context: programContext,
  })
  if (!draft) return { ok: false, error: 'Writer returned no draft (check logs / API key)' }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      article_body: draft.body,
      written_by: draft.written_by,
      written_at: now,
      // Recompute reading time whenever the body changes — keeps it accurate
      // if the writer step ever runs again on a published post.
      reading_time_minutes: computeReadingTimeMinutes(draft.body),
      fact_checked_at: null,
      fact_check_claims: null,
      voice_checked_at: null,
      voice_notes: null,
      voice_pass: null,
      originality_checked_at: null,
      originality_notes: null,
      originality_pass: null,
      updated_at: now,
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/admin/content-ideas')
  return { ok: true }
}

export type FactCheckResult =
  | { ok: true; flagged: number }
  | { ok: false; error: string }

export async function factCheckArticleAction(id: string): Promise<FactCheckResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, title, article_body, source_alert_id, source_intel_id')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }
  if (!idea.article_body) return { ok: false, error: 'No article body to check — draft first.' }

  let sourceText = ''
  let sourceUrl: string | null = null
  if (idea.source_alert_id) {
    const { data: alert } = await supabase
      .from('alerts')
      .select('title, summary, description')
      .eq('id', idea.source_alert_id)
      .single()
    if (alert) {
      sourceText = [alert.title, alert.summary, alert.description].filter(Boolean).join('\n\n')
    }
  }
  if (idea.source_intel_id) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text, source_url')
      .eq('id', idea.source_intel_id)
      .single()
    if (intel) {
      if (intel.raw_text) sourceText = `${sourceText}\n\n${intel.raw_text}`.trim()
      sourceUrl = intel.source_url ?? null
    }
  }
  const programs = await getProgramsForIdea(supabase, idea.source_alert_id)
  if (programs.length > 0) {
    sourceText = `${sourceText}\n\n═══ OFFICIAL PROGRAM PAGE CONTENT ═══\n\n${programsToSourceText(programs)}`.trim()
  }

  const verifyRes = await verifyArticleBody({
    title: idea.title,
    article_body: idea.article_body,
    source_text: sourceText || null,
  })
  if (!verifyRes) return { ok: false, error: 'Fact-check call failed (see logs)' }

  let grounded = verifyRes.claims
  try {
    grounded = await webVerifyClaims({
      claims: verifyRes.claims,
      context: { title: idea.title, source_url: sourceUrl },
    })
  } catch (err) {
    await logSystemError(supabase, 'content-ideas:webVerifyClaims', err, {
      idea_id: id,
      title: idea.title,
    })
    grounded = verifyRes.claims.map((c) =>
      c.supported
        ? c
        : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
    )
  }

  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      fact_checked_at: verifyRes.checked_at,
      fact_check_claims: grounded,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/admin/content-ideas')
  const flagged = grounded.filter((c) => !c.supported && c.severity === 'high').length
  return { ok: true, flagged }
}

export type VoiceCheckResult =
  | { ok: true; pass: boolean }
  | { ok: false; error: string }

export async function voiceCheckArticleAction(id: string): Promise<VoiceCheckResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, title, article_body')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }
  if (!idea.article_body) return { ok: false, error: 'No article body to check — draft first.' }

  const res = await voiceCheckArticle({ title: idea.title, article_body: idea.article_body })
  if (!res) return { ok: false, error: 'Voice-check call failed (see logs)' }

  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      voice_checked_at: res.checked_at,
      voice_notes: res.notes,
      voice_pass: res.pass,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/admin/content-ideas')
  return { ok: true, pass: res.pass }
}

// Kept for backward compatibility with anything still referencing the combined
// action — runs fact-check + voice-check in parallel.
export type CheckArticleResult =
  | { ok: true; factFlagged: number; voicePass: boolean }
  | { ok: false; error: string }

export async function checkArticleAction(id: string): Promise<CheckArticleResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, title, article_body, source_alert_id, source_intel_id')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }
  if (!idea.article_body) return { ok: false, error: 'No article body to check — draft first.' }

  // Build source text from the linked alert + (optional) raw intel, so the
  // verifier has something to ground against beyond "the article itself."
  let sourceText = ''
  let sourceUrl: string | null = null
  if (idea.source_alert_id) {
    const { data: alert } = await supabase
      .from('alerts')
      .select('title, summary, description')
      .eq('id', idea.source_alert_id)
      .single()
    if (alert) {
      sourceText = [alert.title, alert.summary, alert.description].filter(Boolean).join('\n\n')
    }
  }
  if (idea.source_intel_id) {
    const { data: intel } = await supabase
      .from('intel_items')
      .select('raw_text, source_url')
      .eq('id', idea.source_intel_id)
      .single()
    if (intel) {
      if (intel.raw_text) sourceText = `${sourceText}\n\n${intel.raw_text}`.trim()
      sourceUrl = intel.source_url ?? null
    }
  }

  // Treat the official program page(s) as authoritative source material.
  // Anything we wrote on the Page (sweet spots, transfer partners, hubs, etc.)
  // becomes legal grounding for fact-check claims.
  const programs = await getProgramsForIdea(supabase, idea.source_alert_id)
  if (programs.length > 0) {
    sourceText = `${sourceText}\n\n═══ OFFICIAL PROGRAM PAGE CONTENT ═══\n\n${programsToSourceText(programs)}`.trim()
  }

  const [verifyRes, voiceRes] = await Promise.all([
    verifyArticleBody({
      title: idea.title,
      article_body: idea.article_body,
      source_text: sourceText || null,
    }),
    voiceCheckArticle({ title: idea.title, article_body: idea.article_body }),
  ])
  if (!verifyRes) return { ok: false, error: 'Fact-check call failed (see logs)' }
  if (!voiceRes) return { ok: false, error: 'Voice-check call failed (see logs)' }

  // Web-grounding pass for unsupported claims (same pattern as alerts).
  let grounded = verifyRes.claims
  try {
    grounded = await webVerifyClaims({
      claims: verifyRes.claims,
      context: { title: idea.title, source_url: sourceUrl },
    })
  } catch (err) {
    await logSystemError(supabase, 'content-ideas:webVerifyClaims', err, {
      idea_id: id,
      title: idea.title,
    })
    grounded = verifyRes.claims.map((c) =>
      c.supported
        ? c
        : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
    )
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      fact_checked_at: verifyRes.checked_at,
      fact_check_claims: grounded,
      voice_checked_at: voiceRes.checked_at,
      voice_notes: voiceRes.notes,
      voice_pass: voiceRes.pass,
      updated_at: now,
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/admin/content-ideas')
  const factFlagged = grounded.filter((c) => !c.supported && c.severity === 'high').length
  return { ok: true, factFlagged, voicePass: voiceRes.pass }
}

/**
 * Phase 5 — one-click pipeline. Runs (write if missing) → fact-check + voice-check
 * + originality-check in parallel where possible. Returns an aggregate result so
 * the UI can show "Ready to publish" or surface what failed without you clicking
 * 4 buttons in sequence.
 */
export type PipelineResult =
  | {
      ok: true
      wrote: boolean
      facts: { ran: boolean; flagged: number; error?: string }
      voice: { ran: boolean; pass: boolean; error?: string }
      originality: { ran: boolean; pass: boolean; error?: string }
      ready: boolean
    }
  | { ok: false; error: string }

export async function runAllChecksAction(id: string): Promise<PipelineResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, article_body, written_at')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }

  // Write only if missing — keeps re-running the pipeline cheap. If you want
  // a fresh draft, click Rewrite separately.
  let wrote = false
  if (!idea.article_body || !idea.written_at) {
    const writeRes = await writeArticleAction(id)
    if (!writeRes.ok) {
      return { ok: false, error: `write failed — ${writeRes.error}` }
    }
    wrote = true
  }

  // Run the three checks in parallel — they're independent, all read the
  // same article_body, and total wall time drops from ~3min to ~60s.
  const [factRes, voiceRes, origRes] = await Promise.all([
    factCheckArticleAction(id),
    voiceCheckArticleAction(id),
    checkOriginalityAction(id),
  ])

  const facts = factRes.ok
    ? { ran: true, flagged: factRes.flagged }
    : { ran: false, flagged: 0, error: factRes.error }
  const voice = voiceRes.ok
    ? { ran: true, pass: voiceRes.pass }
    : { ran: false, pass: false, error: voiceRes.error }
  const originality = origRes.ok
    ? { ran: true, pass: origRes.pass }
    : { ran: false, pass: false, error: origRes.error }

  const ready = facts.ran && facts.flagged === 0 && voice.ran && voice.pass && originality.ran && originality.pass
  revalidatePath('/admin/content-ideas')
  return { ok: true, wrote, facts, voice, originality, ready }
}

export type OriginalityActionResult =
  | { ok: true; pass: boolean; notes: string }
  | { ok: false; error: string }

export async function checkOriginalityAction(id: string): Promise<OriginalityActionResult> {
  const supabase = createAdminClient()
  const { data: idea, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('id, title, article_body')
    .eq('id', id)
    .single()
  if (fetchErr || !idea) return { ok: false, error: fetchErr?.message ?? 'Idea not found' }
  if (!idea.article_body) return { ok: false, error: 'No article body to check — draft first.' }

  const res = await originalityCheck({ title: idea.title, article_body: idea.article_body })
  if (!res) return { ok: false, error: 'Originality check failed (see logs)' }

  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      originality_checked_at: res.checked_at,
      originality_notes: res.notes,
      originality_pass: res.pass,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (updateErr) return { ok: false, error: updateErr.message }

  revalidatePath('/admin/content-ideas')
  return { ok: true, pass: res.pass, notes: res.notes }
}

export async function updateContentIdeaNotesAction(
  id: string,
  formData: FormData
): Promise<void> {
  const notes = (formData.get('notes') as string | null) ?? ''
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('content_ideas')
    .update({ notes: notes.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/content-ideas')
}

/**
 * Save / clear the editorial override reason. When non-empty, lets the
 * publish gate bypass the 4-pill check (other than article-drafted, which
 * is required regardless).
 */
export async function updateContentIdeaOverrideAction(
  id: string,
  formData: FormData
): Promise<void> {
  const value = (formData.get('override_reason') as string | null)?.trim() ?? ''
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('content_ideas')
    .update({ override_reason: value || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/admin/content-ideas')
}

/**
 * Save the blog-publishing metadata fields on a content_ideas row.
 * Used by the inline form on the content-ideas admin card.
 *
 * Validates category against the 6 allowed slugs (or null). Coerces empty
 * strings to null so the DB CHECK constraint can compare cleanly.
 */
export async function updateContentIdeaBlogFieldsAction(
  id: string,
  formData: FormData
): Promise<void> {
  const supabase = createAdminClient()

  const rawCategory = (formData.get('category') as string | null)?.trim() ?? ''
  const rawExcerpt = (formData.get('excerpt') as string | null)?.trim() ?? ''
  const rawHeroImageUrl = (formData.get('hero_image_url') as string | null)?.trim() ?? ''
  const rawProgramSlug = (formData.get('primary_program_slug') as string | null)?.trim() ?? ''
  const featured = formData.get('featured') === 'on'
  const rawFeaturedRank = (formData.get('featured_rank') as string | null)?.trim() ?? ''

  // Validate category if provided. We accept '' (drafts) or one of the 6 slugs.
  if (rawCategory && !isBlogCategorySlug(rawCategory)) {
    throw new Error(
      `Invalid category "${rawCategory}". Must be one of: ${BLOG_CATEGORY_SLUGS.join(', ')}.`
    )
  }

  // Hero image URL must be https when present.
  if (rawHeroImageUrl) {
    try {
      const u = new URL(rawHeroImageUrl)
      if (u.protocol !== 'https:') throw new Error('http:// not allowed')
    } catch {
      throw new Error('Hero image URL must be a valid https:// URL.')
    }
  }

  let featured_rank: number | null = null
  if (rawFeaturedRank) {
    const n = parseInt(rawFeaturedRank, 10)
    if (!Number.isFinite(n)) throw new Error('Featured rank must be a whole number.')
    featured_rank = n
  }

  const { error } = await supabase
    .from('content_ideas')
    .update({
      category: rawCategory || null,
      excerpt: rawExcerpt || null,
      hero_image_url: rawHeroImageUrl || null,
      primary_program_slug: rawProgramSlug || null,
      featured,
      featured_rank,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/content-ideas')
}
