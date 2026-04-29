/**
 * Server-side only. Logs an Anthropic API response to the ai_usage_log table
 * with cost estimate. Call this immediately after every messages.create.
 *
 * Pricing (per 1M tokens, as of 2026-04):
 *   Sonnet 4.6: input $3, output $15, cache write $3.75, cache read $0.30
 *   Haiku 4.5:  input $1, output $5,  cache write $1.25, cache read $0.10
 *   Opus 4.x:   input $15, output $75, cache write $18.75, cache read $1.50
 */
import { createAdminClient } from '@/utils/supabase/server'

type AnthropicLikeUsage = {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

type AnthropicLikeMessage = {
  model?: string
  usage?: AnthropicLikeUsage
}

type Pricing = {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

function pricingForModel(model: string): Pricing {
  if (model.includes('opus')) {
    return { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 }
  }
  if (model.includes('haiku')) {
    return { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 }
  }
  // Default to Sonnet pricing
  return { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 }
}

function estimateCost(model: string, usage: AnthropicLikeUsage): number {
  const p = pricingForModel(model)
  const input = usage.input_tokens ?? 0
  const output = usage.output_tokens ?? 0
  const cacheWrite = usage.cache_creation_input_tokens ?? 0
  const cacheRead = usage.cache_read_input_tokens ?? 0
  const cost =
    (input * p.input + output * p.output + cacheWrite * p.cacheWrite + cacheRead * p.cacheRead) /
    1_000_000
  return Math.round(cost * 1_000_000) / 1_000_000
}

export async function logUsage(
  message: AnthropicLikeMessage,
  caller: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const usage = message.usage ?? {}
    const model = message.model ?? 'unknown'
    const cost = estimateCost(model, usage)

    const supabase = createAdminClient()
    await supabase.from('ai_usage_log').insert({
      caller,
      model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
      cost_usd: cost,
      metadata: metadata ?? null,
    })
  } catch (err) {
    console.error('[logUsage] failed to record usage for', caller, err)
  }
}
