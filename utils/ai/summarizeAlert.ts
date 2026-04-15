/**
 * Server-side only. Calls Claude Haiku to generate a one-sentence summary
 * of a loyalty alert. Never import this from client components.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { AlertType, ConfidenceLevel } from '@/utils/supabase/queries'

export interface AlertSummaryInput {
  title: string
  type: AlertType
  description: string | null
  programName: string | null
  start_date: string | null
  end_date: string | null
  confidence_level: ConfidenceLevel
  source_url: string | null
}

function buildFallbackSummary(input: AlertSummaryInput): string {
  const parts: string[] = [input.title]

  if (input.programName) parts.push(`(${input.programName})`)

  const dates: string[] = []
  if (input.start_date) dates.push(`from ${new Date(input.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  if (input.end_date) dates.push(`until ${new Date(input.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  if (dates.length) parts.push(dates.join(' '))

  parts.push(`${input.confidence_level} confidence`)

  return parts.join(', ') + '.'
}

export async function summarizeAlert(input: AlertSummaryInput): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return buildFallbackSummary(input)
  }

  const dateRange = [
    input.start_date ? `start: ${input.start_date.slice(0, 10)}` : null,
    input.end_date ? `end: ${input.end_date.slice(0, 10)}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const prompt = [
    `Write exactly one sentence summarizing this loyalty program alert for a travel enthusiast.`,
    `Be concise and specific. Include the key benefit, program name if relevant, date range if present, and confidence level.`,
    `Format like: "50% transfer bonus from Chase Ultimate Rewards to Hyatt, valid Apr 14–30 2026, high confidence."`,
    ``,
    `Title: ${input.title}`,
    `Type: ${input.type}`,
    `Program: ${input.programName ?? 'N/A'}`,
    `Dates: ${dateRange || 'N/A'}`,
    `Confidence: ${input.confidence_level}`,
    input.description ? `Description: ${input.description}` : null,
  ].filter(Boolean).join('\n')

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (block.type === 'text' && block.text.trim()) {
      return block.text.trim()
    }
    return buildFallbackSummary(input)
  } catch {
    return buildFallbackSummary(input)
  }
}
