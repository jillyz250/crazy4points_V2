/**
 * The Watchdog (Accuracy Agent, Phase 2) — scheduled re-verifier.
 *
 * For each program that has a transfer_ratio source in official_sources, it
 * compares OUR transfer_partners_outbound against the OFFICIAL page in a single
 * reconcile pass, and logs any drift to the claim_verifications ledger:
 *   - conflict: a partner whose ratio disagrees with official
 *   - our_extra: a partner WE list that the official source does not
 *   - official_extra (gap): a partner OFFICIAL lists that WE are missing
 *
 * Findings land in the /admin/agents inbox for human confirm (never auto-fix
 * silently — guarantees G-1, G-3, G-6). Programs whose official page can't be
 * reached (login-gated, JS) log one "needs manual check" note instead of guessing.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logUsage } from '../ai/logUsage'
import { fetchFirecrawl, fetchFirecrawlInteractive } from '../ai/firecrawl'

const MODEL = 'claude-sonnet-4-6'

interface WatchdogFinding {
  kind: 'conflict' | 'our_extra' | 'official_extra'
  partner: string
  our_ratio?: string | null
  official_ratio?: string | null
  note: string
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) try { return JSON.parse(m[0]) as T } catch { return null }
    return null
  }
}

export interface WatchdogResult {
  program: string
  reached: boolean
  findings: number
  logged: number
}

export async function runWatchdog(
  supabase: SupabaseClient,
  opts: { onlySlug?: string } = {},
): Promise<WatchdogResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []
  const client = new Anthropic({ apiKey })

  let q = supabase
    .from('official_sources')
    .select('entity_slug, canonical_url, fetch_method')
    .eq('entity_type', 'program')
    .eq('fact_type', 'transfer_ratio')
  if (opts.onlySlug) q = q.eq('entity_slug', opts.onlySlug)
  const { data: sources } = await q
  const results: WatchdogResult[] = []

  for (const src of sources ?? []) {
    const slug = src.entity_slug as string
    const url = src.canonical_url as string
    const method = (src.fetch_method as string) ?? 'firecrawl'

    const { data: prog } = await supabase
      .from('programs')
      .select('name, transfer_partners_outbound')
      .eq('slug', slug)
      .maybeSingle()
    if (!prog) {
      results.push({ program: slug, reached: false, findings: 0, logged: 0 })
      continue
    }
    const ours = ((prog.transfer_partners_outbound as unknown[]) ?? []).slice(0, 30).map((r) => {
      const x = r as Record<string, unknown>
      return { partner: x.from_slug, ratio: x.ratio, tiers: x.tiers }
    })

    const fc = method === 'browser'
      ? await fetchFirecrawlInteractive(url, { maxChars: 8000 })
      : await fetchFirecrawl(url, { maxChars: 8000 })

    if (!fc.ok || !fc.markdown) {
      // Can't reach official -> one honest "manual check" finding, never a guess.
      await supabase.from('claim_verifications').insert({
        claim_text: `Watchdog: re-verify ${prog.name} transfer partners vs official`,
        entity_type: 'program', entity_slug: slug, fact_type: 'transfer_ratio',
        verdict: 'unverified', confidence: 'low', reconciliation: 'unchecked',
        official_source_url: url, discrepancy: false,
        our_page_evidence: `We list ${ours.length} transfer partners.`,
        official_evidence: `Could not reach the official source (${fc.ok ? 'empty' : fc.reason}). Needs a manual check.`,
        source_type: 'none', source_ref: slug, created_by: 'watchdog',
      })
      results.push({ program: slug, reached: false, findings: 0, logged: 1 })
      continue
    }

    const raw = await (async () => {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        temperature: 0,
        messages: [{ role: 'user', content: [
          `Compare OUR ${prog.name} transfer-partner list against the OFFICIAL page below. Report drift only.`,
          'Return ONLY JSON: {"findings":[{"kind":"conflict"|"our_extra"|"official_extra","partner":"<name>","our_ratio":"<or null>","official_ratio":"<or null>","note":"<one sentence>"}]}.',
          'conflict = a partner in BOTH but the ratio differs. our_extra = a partner WE list that the official page does not mention at all. official_extra = a partner the OFFICIAL page lists that OURS is missing.',
          'IMPORTANT: OUR partner names are lowercase kebab-case slugs (e.g. "aeromexico" = Aeromexico Rewards, "leading-hotels" = Leaders Club / The Leading Hotels of the World, "iprefer" = Preferred Hotels I Prefer, "flying-blue" = Air France KLM Flying Blue). Match slugs to the official program names by MEANING, not exact string. Only report our_extra / official_extra when a program is genuinely absent, never merely named differently.',
          'Judge ONLY from the official text. If the official page clearly is not a complete partner list (generic marketing), return an empty findings array rather than guessing our_extra/official_extra.',
          '',
          'OURS: ' + JSON.stringify(ours),
          '',
          `OFFICIAL (${url}):`,
          fc.markdown,
        ].join('\n') }],
      })
      await logUsage(msg, 'watchdog.reconcileList')
      const b = msg.content[0]
      return b.type === 'text' ? b.text : ''
    })()

    const parsed = parseJson<{ findings: WatchdogFinding[] }>(raw)
    const findings = parsed?.findings ?? []
    let logged = 0
    for (const f of findings) {
      const recon = f.kind === 'official_extra' ? 'gap' : 'conflict'
      await supabase.from('claim_verifications').insert({
        claim_text: `${prog.name} -> ${f.partner}${f.our_ratio ? ` (${f.our_ratio})` : ''}`,
        entity_type: 'program', entity_slug: slug, fact_type: 'transfer_ratio',
        verdict: 'refuted', confidence: 'medium', reconciliation: recon,
        official_source_url: url, discrepancy: true,
        our_page_evidence: f.our_ratio ? `Our page: ${f.partner} at ${f.our_ratio}.` : `Our page lists ${f.partner}.`,
        official_evidence: f.note,
        correction: f.kind === 'conflict' ? `Official ratio for ${f.partner}: ${f.official_ratio ?? 'see source'}.` : null,
        proposed_addition: f.kind === 'official_extra' ? `${f.partner} at ${f.official_ratio ?? 'see source'} (on official, missing from our page).` : null,
        source_type: 'official', source_ref: url, created_by: 'watchdog',
      })
      logged++
    }
    results.push({ program: slug, reached: true, findings: findings.length, logged })
  }
  return results
}
