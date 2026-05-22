/**
 * Phase 4.5 PR B — shared generator for all social platforms.
 *
 * One file, one prompt builder, one Anthropic call. Each platform's
 * generator (generateFacebook, generateInstagram, etc.) is a thin wrapper
 * that calls this with its per-platform voice rules + char cap.
 *
 * Architecture: ONE narrative spine, multiple render passes. Generators
 * read `topic.primary_intent` (the editorial spine) + `topic.fact_ledger`
 * (the verified facts) + sibling variants (when regenerating) to keep the
 * bundle coherent. See plans/phase4.5-social-variants.md (SV7, SV8).
 */
import Anthropic from '@anthropic-ai/sdk'
import { BRAND_VOICE } from '@/utils/ai/editorialRules'
import { logUsage } from '@/utils/ai/logUsage'

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'x'

export interface GenerateSocialVariantArgs {
  platform: SocialPlatform
  voiceDelta: string
  charCap: number
  topic: {
    id: string
    title: string
    summary: string | null
    fact_ledger: unknown
    primary_intent: string | null
    programs: string[]
    metadata: Record<string, unknown> | null
  }
  /** Other variants in the same generation group, passed as sibling context
   * to prevent narrative drift on per-platform regenerate. */
  siblings?: Array<{ platform: SocialPlatform; body: string }>
}

export interface GenerateSocialVariantResult {
  body: string
  hashtags: string[]
  char_count: number
}

const MODEL = 'claude-sonnet-4-6'

export async function generateSocialVariant(
  args: GenerateSocialVariantArgs,
): Promise<GenerateSocialVariantResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('generateSocialVariant: ANTHROPIC_API_KEY missing')

  const factLedger = Array.isArray(args.topic.fact_ledger) ? args.topic.fact_ledger : []
  const factsBlock = factLedger.length > 0
    ? `VERIFIED FACTS (the only source of truth for claims):\n${JSON.stringify(factLedger, null, 2)}`
    : 'VERIFIED FACTS: (none yet — use topic.summary as best-effort source)'

  const intentBlock = args.topic.primary_intent
    ? `PRIMARY INTENT: ${args.topic.primary_intent}\nEvery word in this variant should serve this intent.`
    : 'PRIMARY INTENT: (not set) — infer from summary, lean toward "education" for novel info, "urgency" for time-sensitive offers.'

  const siblingBlock = args.siblings && args.siblings.length > 0
    ? `\n\nSIBLING VARIANTS (other platforms in this generation group — DO NOT contradict their framing or angle):\n${args.siblings.map(s => `[${s.platform}]\n${s.body}`).join('\n\n')}`
    : ''

  const system = `You are a social media editor for crazy4points — a points-and-miles
publication. Write ONE social variant for ${args.platform}.

═══════════════════════════════════════════════════════════
BASE BRAND VOICE
═══════════════════════════════════════════════════════════
${BRAND_VOICE}

═══════════════════════════════════════════════════════════
PLATFORM VOICE MODULATION (${args.platform})
═══════════════════════════════════════════════════════════
${args.voiceDelta}

═══════════════════════════════════════════════════════════
HARD RULES (apply to every variant)
═══════════════════════════════════════════════════════════
• NEVER open with "Chase just dropped" / "X just dropped" or any "just" verb.
• Never recommend transferring/converting points without mentioning a redemption in mind — bonus is a reason to consider, not a reason to transfer.
• No emoji icons anywhere (allowed: Unicode bold for emphasis if platform allows).
• Body MUST stay under ${args.charCap} characters TOTAL (including hashtags + URL). Cut ruthlessly to fit. Body integrity wins; if needed, drop topical hashtags before brand tag.
• All factual claims must come from the VERIFIED FACTS block. If a fact isn't there, don't claim it.

═══════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════
Return a single JSON object, no prose, no markdown fences:

{
  "body": "<the full variant including footer/hashtags/URL per the platform template>",
  "hashtags": ["#Crazy4Points", "#PointsAndMiles", ...],
  "char_count": <integer character count of body, including hashtags + URL>
}

The "body" field is what gets posted as-is. "hashtags" is a parsed convenience array.`

  const user = JSON.stringify({
    topic_title: args.topic.title,
    topic_summary: args.topic.summary,
    programs: args.topic.programs,
  }, null, 2) + '\n\n' + intentBlock + '\n\n' + factsBlock + siblingBlock

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  })
  await logUsage(response, `social:${args.platform}`)

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error(`generateSocialVariant[${args.platform}]: no text block in response`)
  }
  const raw = textBlock.text.trim()

  // Strip any accidental ```json fences
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  let parsed: { body?: string; hashtags?: string[]; char_count?: number }
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(`generateSocialVariant[${args.platform}]: JSON parse failed. Sample: ${jsonStr.slice(0, 200)}`)
  }
  if (!parsed.body || typeof parsed.body !== 'string') {
    throw new Error(`generateSocialVariant[${args.platform}]: missing body in response`)
  }
  const body = parsed.body.trim()
  return {
    body,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter(t => typeof t === 'string') : [],
    char_count: typeof parsed.char_count === 'number' ? parsed.char_count : body.length,
  }
}
