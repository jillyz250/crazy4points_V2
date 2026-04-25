import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/utils/supabase/server'
import { buildBriefEmail } from '@/utils/ai/briefEmail'
import type { BriefFinding } from '@/utils/ai/briefEmail'
import {
  generateEditorialPlan,
  type PlanIntelItem,
} from '@/utils/ai/generateEditorialPlan'
import { writeAlertDraft, type WriteDraftProgram } from '@/utils/ai/writeAlertDraft'
import { editAlertDraft } from '@/utils/ai/editAlertDraft'
import { verifyAlertDraft, webVerifyClaims, highSeverityUnsupported } from '@/utils/ai/verifyAlertDraft'
import { reviseAlertDraft, type RevisionLogEntry } from '@/utils/ai/reviseAlertDraft'
import type { ApproveMeta } from '@/utils/ai/briefEmail'
import { updateAlert, setAlertPrograms, logSystemError } from '@/utils/supabase/queries'

const resend = new Resend(process.env.RESEND_API_KEY)

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [intelRes, recentRes, programsRes] = await Promise.all([
    supabase
      .from('intel_items')
      .select('id, headline, raw_text, source_name, source_url, confidence, alert_type, programs, expires_at')
      .gte('created_at', since24h)
      .is('rejected_at', null)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('alerts')
      .select('id, title, summary, published_at')
      .eq('status', 'published')
      .gte('published_at', since30d)
      .order('published_at', { ascending: false })
      .limit(3),
    supabase.from('programs').select('id, slug, name, type'),
  ])

  if (intelRes.error) {
    console.error('[build-brief] intel_items fetch failed:', intelRes.error)
    return NextResponse.json({ error: 'DB error (intel)' }, { status: 500 })
  }
  if (recentRes.error) {
    console.error('[build-brief] recent alerts fetch failed:', recentRes.error)
    return NextResponse.json({ error: 'DB error (alerts)' }, { status: 500 })
  }
  if (programsRes.error) {
    console.error('[build-brief] programs fetch failed:', programsRes.error)
    return NextResponse.json({ error: 'DB error (programs)' }, { status: 500 })
  }

  const allItems = intelRes.data ?? []
  const recentAlertRows = recentRes.data ?? []

  // Filter out intel items whose deal has already expired — they shouldn't
  // clutter the Scout brief or get approved. The program archive page is the
  // permanent home for expired offers.
  const nowTs = Date.now()
  const items = allItems.filter((row) => {
    const exp = row.expires_at as string | null
    if (!exp) return true
    const t = new Date(exp).getTime()
    if (isNaN(t)) return true
    return t >= nowTs
  })
  const droppedExpired = allItems.length - items.length
  if (droppedExpired > 0) {
    console.log(`[build-brief] dropped ${droppedExpired} expired intel item(s) before Sonnet`)
  }

  // Findings for the Today's Intel section (unchanged shape)
  const findings: BriefFinding[] = items.map((row) => ({
    intel_id: row.id as string,
    headline: row.headline,
    raw_text: row.raw_text,
    source_name: row.source_name,
    source_url: row.source_url,
    confidence: row.confidence as 'high' | 'medium' | 'low',
    alert_type: row.alert_type,
    programs: row.programs,
  }))

  // Inputs for Sonnet
  const todayIntel: PlanIntelItem[] = items.map((r) => ({
    intel_id: r.id as string,
    headline: r.headline,
    source_name: r.source_name,
    source_url: r.source_url,
    confidence: r.confidence as 'high' | 'medium' | 'low',
    alert_type: r.alert_type,
    programs: r.programs,
    raw_text: r.raw_text,
  }))

  // Voice samples — recently published alerts Sonnet should match in tone
  const voiceSamples = recentAlertRows.slice(0, 3).map((r) => ({
    title: (r.title as string) ?? '',
    summary: (r.summary as string) ?? '',
  }))

  // Call Sonnet (best-effort — if it fails, fall back to the old layout)
  const plan = await generateEditorialPlan({
    today_intel: todayIntel,
    voice_samples: voiceSamples,
  })

  // Persist the brief — even on plan failure, so actions log still works (empty plan)
  let briefId: string | undefined
  if (plan) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: inserted, error: insertErr } = await supabase
      .from('daily_briefs')
      .upsert(
        {
          brief_date: today,
          editorial_plan: plan,
          intel_count: findings.length,
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'brief_date' }
      )
      .select('id')
      .single()

    if (insertErr) {
      console.error('[build-brief] daily_briefs insert failed:', insertErr)
    } else {
      briefId = inserted?.id as string | undefined
    }
  }

  // Writer pass — for every approve-recommended intel, polish the pending_review alert
  const allPrograms = (programsRes.data ?? []) as WriteDraftProgram[]
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const intelById = new Map(items.map((i) => [i.id as string, i]))

  let drafts_written = 0
  let writer_null_drafts = 0
  let writer_no_pending_alert = 0
  let writer_update_errors = 0
  let editor_run = 0
  let editor_null = 0
  let fact_checks_run = 0
  let fact_checks_flagged = 0
  let web_verify_runs = 0
  let web_verify_likely_wrong = 0
  let revisions_run = 0
  let revisions_succeeded = 0
  let revisions_failed = 0
  let revisions_resolved = 0
  let revisions_persistent = 0
  const REVISE_MAX_ITERS = 2
  const alertIdByIntelId: Record<string, string> = {}
  const approveMetaByIntelId: Record<string, ApproveMeta> = {}
  if (plan && plan.approve.length) {
    const recentSamples = voiceSamples

    for (const a of plan.approve) {
      const intel = intelById.get(a.intel_id)
      if (!intel) continue

      // Seed meta from the raw intel so badges + deadline chip render even if
      // the writer call or pending-alert lookup later fails.
      const intelSlugs = (intel.programs as string[] | null) ?? []
      const seedPrograms = intelSlugs
        .map((slug) => {
          const p = programBySlug.get(slug)
          return p ? { name: p.name, slug: p.slug } : null
        })
        .filter((x): x is { name: string; slug: string } => x !== null)
      approveMetaByIntelId[intel.id as string] = {
        endDate: (intel.expires_at as string | null) ?? null,
        programNames: seedPrograms.map((p) => p.name),
        programs: seedPrograms,
        sourceName: (intel.source_name as string | null) ?? null,
        sourceUrl: (intel.source_url as string | null) ?? null,
      }

      // Also try to resolve the staged alert id up-front so Review & Publish
      // links survive even when the writer call itself fails.
      {
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id, computed_score')
          .eq('source_intel_id', intel.id as string)
          .maybeSingle()
        if (existingAlert?.id) {
          const alertId = existingAlert.id as string
          alertIdByIntelId[intel.id as string] = alertId
          approveMetaByIntelId[intel.id as string].alertId = alertId
          approveMetaByIntelId[intel.id as string].computedScore =
            (existingAlert.computed_score as number | null) ?? null
        }
      }

      const draft = await writeAlertDraft({
        intel: {
          intel_id: intel.id as string,
          headline: intel.headline as string,
          raw_text: (intel.raw_text as string | null) ?? null,
          source_name: intel.source_name as string,
          source_url: (intel.source_url as string | null) ?? null,
          alert_type: intel.alert_type,
          programs: intel.programs as string[] | null,
        },
        programs: allPrograms,
        recent_samples: recentSamples,
      })
      if (!draft) {
        writer_null_drafts++
        continue
      }

      // Editor pass (Phase 1, polish-only) — remove AI-tells, tighten voice.
      // Does not change source facts. Never proposes value-add in this phase.
      // Falls back to Writer draft on failure so the pipeline keeps moving.
      editor_run++
      const edited = await editAlertDraft({
        title: draft.title,
        summary: draft.summary,
        description: draft.description,
      })
      if (!edited) {
        editor_null++
      } else {
        draft.summary = edited.summary
        draft.description = edited.description
      }

      const { data: pending } = await supabase
        .from('alerts')
        .select('id')
        .eq('source_intel_id', intel.id as string)
        .eq('status', 'pending_review')
        .maybeSingle()
      if (!pending) {
        writer_no_pending_alert++
        continue
      }
      const alertId = pending.id as string
      alertIdByIntelId[intel.id as string] = alertId

      const primaryId = draft.primary_program_slug
        ? programBySlug.get(draft.primary_program_slug)?.id ?? null
        : null
      const secondaryIds = draft.secondary_program_slugs
        .map((s) => programBySlug.get(s)?.id)
        .filter((x): x is string => typeof x === 'string')

      try {
        await updateAlert(supabase, alertId, {
          title: draft.title,
          summary: draft.summary,
          description: draft.description,
          action_type: draft.action_type,
          primary_program_id: primaryId,
          start_date: draft.start_date,
          end_date: draft.end_date,
          // Phase 3 — persist Sonnet's why_publish onto the alert so the
          // public page, the newsletter blurb, and Decision Engine context
          // all draw from one editable source.
          why_this_matters: a.why_publish ?? null,
        })
        await setAlertPrograms(supabase, alertId, { primaryId, secondaryIds })
        drafts_written++

        // Fact-check pass: ground every factual claim in the draft against
        // the intel raw_text. Unsupported high-severity claims surface as
        // red warnings in admin review before publish.
        const verify = await verifyAlertDraft({
          draft: { title: draft.title, summary: draft.summary, description: draft.description },
          raw_text: (intel.raw_text as string | null) ?? null,
          source_url: (intel.source_url as string | null) ?? null,
          alert_type: intel.alert_type,
        })
        if (verify) {
          fact_checks_run++
          if (highSeverityUnsupported(verify.claims).length > 0) fact_checks_flagged++

          // Phase 3.6 — for any claim the source didn't support, ask Sonnet
          // (with web search) whether the web agrees. Never blocks publish:
          // admin UI shows the verdict + snippet + URL so the human decides.
          let finalClaims = verify.claims
          const hasUnsupported = verify.claims.some((c) => !c.supported)
          if (hasUnsupported) {
            web_verify_runs++
            try {
              finalClaims = await webVerifyClaims({
                claims: verify.claims,
                context: { title: draft.title, source_url: (intel.source_url as string | null) ?? null },
              })
              if (finalClaims.some((c) => c.web_verdict === 'likely_wrong')) web_verify_likely_wrong++
            } catch (err) {
              await logSystemError(supabase, 'build-brief:webVerifyClaims', err, {
                alert_id: alertId,
                intel_id: intel.id,
                title: draft.title,
                unsupported_count: verify.claims.filter((c) => !c.supported).length,
              })
              // Mark every unsupported claim as "checked but verdict unknown" so
              // the UI can distinguish from "never checked" (missing field).
              finalClaims = verify.claims.map((c) =>
                c.supported
                  ? c
                  : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
              )
            }
          }

          // Phase 2 — loop the reviser up to REVISE_MAX_ITERS times. Each pass
          // rewrites likely_wrong claims, persists the revised copy, then re-runs
          // verify + webVerify so the next iteration sees fresh claims. Exit as
          // soon as no likely_wrong remain. If still flagged after the cap, we
          // persist what we have and let the existing chip surface the residual.
          let revisionLog: RevisionLogEntry[] = []
          let workingDraft = {
            title: draft.title,
            summary: draft.summary,
            description: draft.description,
          }
          const initialLikelyWrong = finalClaims.filter((c) => c.web_verdict === 'likely_wrong').length
          if (initialLikelyWrong > 0) {
            revisions_run++
            let iter = 0
            let aborted = false
            while (iter < REVISE_MAX_ITERS) {
              const likelyWrong = finalClaims.filter((c) => c.web_verdict === 'likely_wrong')
              if (likelyWrong.length === 0) break
              iter++
              try {
                const revised = await reviseAlertDraft({
                  draft: workingDraft,
                  problem_claims: likelyWrong,
                  source_url: (intel.source_url as string | null) ?? null,
                  iter,
                })
                workingDraft = revised.revised
                revisionLog = [...revisionLog, ...revised.log]

                // Persist revised copy after each iteration so admin review +
                // the site always show the latest corrected text, even if a
                // later iteration fails.
                await updateAlert(supabase, alertId, {
                  title: workingDraft.title,
                  summary: workingDraft.summary,
                  description: workingDraft.description,
                })

                const reverify = await verifyAlertDraft({
                  draft: workingDraft,
                  raw_text: (intel.raw_text as string | null) ?? null,
                  source_url: (intel.source_url as string | null) ?? null,
                  alert_type: intel.alert_type,
                })
                if (!reverify) break
                let reverified = reverify.claims
                if (reverified.some((c) => !c.supported)) {
                  try {
                    reverified = await webVerifyClaims({
                      claims: reverified,
                      context: {
                        title: workingDraft.title,
                        source_url: (intel.source_url as string | null) ?? null,
                      },
                    })
                  } catch (err) {
                    await logSystemError(supabase, 'build-brief:webVerifyClaims:post-revise', err, {
                      alert_id: alertId,
                      intel_id: intel.id,
                      iter,
                    })
                    reverified = reverified.map((c) =>
                      c.supported
                        ? c
                        : { ...c, web_verdict: 'unverifiable' as const, web_evidence: null, web_url: null }
                    )
                    // web-verify failed — can't trust the next iteration's
                    // likely_wrong read. Stop the loop and ship what we have.
                    finalClaims = reverified
                    aborted = true
                    break
                  }
                }
                finalClaims = reverified
              } catch (err) {
                aborted = true
                await logSystemError(supabase, 'build-brief:reviseAlertDraft', err, {
                  alert_id: alertId,
                  intel_id: intel.id,
                  title: draft.title,
                  likely_wrong_count: likelyWrong.length,
                  iter,
                })
                break
              }
            }

            // Per-alert outcome after the loop:
            //   succeeded = at least one iteration completed without throwing
            //   resolved  = no likely_wrong remain in finalClaims
            //   persistent = revised but flags still remain (reviser couldn't fix)
            //   failed    = all iterations threw and we have no revisions
            const residualLikelyWrong = finalClaims.some((c) => c.web_verdict === 'likely_wrong')
            if (revisionLog.length > 0) {
              revisions_succeeded++
              if (residualLikelyWrong) revisions_persistent++
              else revisions_resolved++
            } else if (aborted) {
              revisions_failed++
            }
          }

          try {
            await updateAlert(supabase, alertId, {
              fact_check_claims: finalClaims,
              fact_check_at: verify.checked_at,
              revision_log: revisionLog.length > 0 ? revisionLog : null,
            })
          } catch (err) {
            console.error('[build-brief] fact-check write failed for alert', alertId, err)
          }

          // Populate the email-chip summary. Filter to high-severity only so the
          // chip flags claims that could actually mislead a reader; low-severity
          // descriptive color (geography, property counts) and 'unverifiable'
          // procedural steps stay in the admin view but don't spam the email.
          const openUnsupported = finalClaims.filter(
            (c) => !c.supported && !c.acknowledged && c.severity === 'high'
          )
          const existingMeta = approveMetaByIntelId[intel.id as string] ?? {}
          approveMetaByIntelId[intel.id as string] = {
            ...existingMeta,
            factCheck: {
              openClaimCount: openUnsupported.length,
              likelyWrongCount: openUnsupported.filter((c) => c.web_verdict === 'likely_wrong').length,
              claims: openUnsupported.slice(0, 3).map((c) => ({
                text: c.claim,
                severity: c.severity,
                web_verdict: c.web_verdict ?? null,
              })),
            },
            revisions: revisionLog.length > 0
              ? revisionLog.map((r) => ({
                  reason: r.reason,
                  source_url: r.source_url,
                  before_claim: r.before_claim,
                  after_claim: r.after_claim,
                }))
              : undefined,
          }
        }

        const draftPrograms: { name: string; slug: string }[] = []
        if (draft.primary_program_slug) {
          const p = programBySlug.get(draft.primary_program_slug)
          if (p) draftPrograms.push({ name: p.name, slug: p.slug })
        }
        for (const slug of draft.secondary_program_slugs) {
          const p = programBySlug.get(slug)
          if (p) draftPrograms.push({ name: p.name, slug: p.slug })
        }
        // Merge with prior meta so factCheck + computedScore (set earlier in
        // the loop) survive the writer-success update.
        const priorMeta = approveMetaByIntelId[intel.id as string] ?? {}
        approveMetaByIntelId[intel.id as string] = {
          ...priorMeta,
          alertId,
          endDate: draft.end_date,
          programNames: draftPrograms.map((p) => p.name),
          programs: draftPrograms,
        }
      } catch (err) {
        writer_update_errors++
        console.error('[build-brief] writer update failed for alert', alertId, err)
      }
    }
  }

  // Persist content ideas (blog_ideas + newsletter_candidates) for the admin pipeline
  let content_ideas_inserted = 0
  if (plan && briefId) {
    const rows: Array<Record<string, unknown>> = []

    for (const b of plan.blog_ideas) {
      rows.push({
        type: 'blog',
        title: b.title,
        pitch: b.pitch,
        source: 'editorial_plan',
        source_brief_id: briefId,
      })
    }

    for (const c of plan.newsletter_candidates ?? []) {
      rows.push({
        type: 'newsletter',
        title: c.headline,
        pitch: c.angle,
        source: 'editorial_plan',
        source_brief_id: briefId,
        source_intel_id: c.intel_id,
        source_alert_id: alertIdByIntelId[c.intel_id] ?? null,
      })
    }

    // Insert one at a time so a dedupe conflict on one row doesn't abort the others
    for (const row of rows) {
      const { error: ideasErr } = await supabase.from('content_ideas').insert(row)
      if (!ideasErr) {
        content_ideas_inserted++
      } else if (ideasErr.code !== '23505') {
        console.warn('[build-brief] content_idea insert failed:', ideasErr.message)
      }
    }
  }

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const html = buildBriefEmail(findings, date, {
    plan: briefId ? plan : null,
    briefId,
    siteOrigin: 'https://crazy4points.com',
    alertIdByIntelId,
    approveMetaByIntelId,
    reviseCounters: {
      run: revisions_run,
      succeeded: revisions_succeeded,
      failed: revisions_failed,
      resolved: revisions_resolved,
      persistent: revisions_persistent,
    },
  })

  // Persist the rendered HTML so admin can preview a brief in-app without
  // re-running the pipeline or relying on Resend delivery.
  if (briefId) {
    const { error: htmlErr } = await supabase
      .from('daily_briefs')
      .update({ brief_html: html })
      .eq('id', briefId)
    if (htmlErr) console.error('[build-brief] brief_html update failed:', htmlErr)
  }

  // Email send removed in Phase 1 — brief is read in /admin/briefs instead.
  // Keeps build-brief well under the Vercel timeout budget and removes the
  // Resend domain-verification dependency. ?email=1 forces a send if needed
  // for a one-off test (kept as escape hatch).
  let emailSent = false
  if (req.nextUrl.searchParams.get('email') === '1') {
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'crazy4points <intel@crazy4points.com>',
      to: process.env.BRIEF_RECIPIENT ?? 'jillzeller6@gmail.com',
      subject: `Crazy4Points Daily Brief — ${date}`,
      html,
    })
    if (emailError) {
      console.error('[build-brief] Resend error (manual email=1 send):', emailError)
    } else {
      emailSent = true
    }
  }

  const approve_count = plan?.approve.length ?? 0
  const writer_success_rate = approve_count
    ? Number((drafts_written / approve_count).toFixed(2))
    : null
  if (approve_count) {
    console.log(
      `[build-brief] writer stats — approves=${approve_count} drafts=${drafts_written} null=${writer_null_drafts} no_pending=${writer_no_pending_alert} errors=${writer_update_errors} success_rate=${writer_success_rate}`
    )
    console.log(
      `[build-brief] editor stats — run=${editor_run} null=${editor_null}`
    )
    console.log(
      `[build-brief] fact-check stats — run=${fact_checks_run} flagged_high_severity=${fact_checks_flagged} web_verify_runs=${web_verify_runs} web_likely_wrong=${web_verify_likely_wrong} revisions=${revisions_run} resolved=${revisions_resolved} persistent=${revisions_persistent} failed=${revisions_failed}`
    )
  }

  return NextResponse.json({
    findings_in_brief: findings.length,
    brief_id: briefId ?? null,
    plan_generated: plan !== null,
    drafts_written,
    writer_stats: {
      approve_count,
      drafts_written,
      null_drafts: writer_null_drafts,
      no_pending_alert: writer_no_pending_alert,
      update_errors: writer_update_errors,
      success_rate: writer_success_rate,
    },
    editor_stats: {
      run: editor_run,
      null: editor_null,
    },
    fact_check_stats: {
      run: fact_checks_run,
      flagged_high_severity: fact_checks_flagged,
      web_verify_runs,
      web_likely_wrong: web_verify_likely_wrong,
      revisions_run,
      revisions_succeeded,
      revisions_failed,
      revisions_resolved,
      revisions_persistent,
    },
    content_ideas_inserted,
    email_sent: emailSent,
    date,
  })
  } catch (err) {
    await logSystemError(supabase, 'brief', err)
    throw err
  }
}
