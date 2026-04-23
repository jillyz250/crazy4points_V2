'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { logSystemError } from '@/utils/supabase/queries'
import { writeArticleBody } from '@/utils/ai/writeArticleBody'
import { verifyArticleBody } from '@/utils/ai/verifyArticleBody'
import { webVerifyClaims } from '@/utils/ai/verifyAlertDraft'
import { voiceCheckArticle } from '@/utils/ai/voiceCheckArticle'
import { originalityCheck } from '@/utils/ai/originalityCheck'

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

  // Publish gate: to flip to 'published', all four verification pills must be
  // green. Written = has body + written_at. Fact-checked = checked and no
  // high-severity unsupported claim. Voice = checked and voice_pass. Original
  // = checked and originality_pass.
  if (status === 'published') {
    const { data: idea, error: fetchErr } = await supabase
      .from('content_ideas')
      .select('title, type, slug, article_body, written_at, fact_checked_at, fact_check_claims, voice_checked_at, voice_pass, originality_checked_at, originality_pass')
      .eq('id', id)
      .single()
    if (fetchErr || !idea) throw new Error(fetchErr?.message ?? 'Idea not found')

    const missing: string[] = []
    if (!idea.article_body || !idea.written_at) missing.push('article not drafted')
    if (!idea.fact_checked_at) {
      missing.push('fact-check not run')
    } else {
      const claims = Array.isArray(idea.fact_check_claims)
        ? (idea.fact_check_claims as { supported?: boolean; severity?: string; acknowledged?: boolean }[])
        : []
      const openHigh = claims.some((c) => !c.supported && c.severity === 'high' && !c.acknowledged)
      if (openHigh) missing.push('unresolved high-severity fact-check claim')
    }
    if (!idea.voice_checked_at || idea.voice_pass !== true) missing.push('voice check not passing')
    if (!idea.originality_checked_at || idea.originality_pass !== true) missing.push('originality check not passing')

    if (missing.length > 0) {
      throw new Error(`Cannot publish — ${missing.join('; ')}`)
    }

    const now = new Date().toISOString()
    const slug = idea.slug ?? (await uniqueSlug(supabase, idea.title, id))
    const { error: pubErr } = await supabase
      .from('content_ideas')
      .update({ status, slug, published_at: now, updated_at: now })
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

  const draft = await writeArticleBody({
    type: idea.type,
    title: idea.title,
    pitch: idea.pitch,
    source_alert: sourceAlert,
  })
  if (!draft) return { ok: false, error: 'Writer returned no draft (check logs / API key)' }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('content_ideas')
    .update({
      article_body: draft.body,
      written_by: draft.written_by,
      written_at: now,
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
