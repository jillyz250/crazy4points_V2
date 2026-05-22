/**
 * Phase 4.5 PR B — server helper to persist a social variant to
 * content_variants. Parallels writeAlertVariant but format-aware.
 *
 * Used by generateSocialVariantsAction (writes all 4) + regeneration paths
 * (writes one with sibling-context preservation).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type SocialFormat = 'facebook' | 'instagram' | 'linkedin' | 'x'

export interface WriteSocialVariantInput {
  topic_id: string
  format: SocialFormat
  body: string
  hashtags: string[]
  char_count: number
  generation_group_id: string
}

/**
 * Upsert one social variant. Constraint (topic_id, format) is unique so
 * regenerating overwrites in place. variant_schema_version = 1 (VSV1).
 */
export async function writeSocialVariant(
  supabase: SupabaseClient,
  input: WriteSocialVariantInput,
): Promise<{ variant_id: string }> {
  const { data, error } = await supabase
    .from('content_variants')
    .upsert(
      {
        topic_id: input.topic_id,
        format: input.format,
        title: null,
        body: input.body,
        status: 'needs_review',
        generated_by: 'social_generator',
        generation_group_id: input.generation_group_id,
        variant_schema_version: 1,
        metadata: {
          hashtags: input.hashtags,
          char_count: input.char_count,
          generated_at: new Date().toISOString(),
        },
      },
      { onConflict: 'topic_id,format' },
    )
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`writeSocialVariant[${input.format}]: ${error?.message ?? 'no row returned'}`)
  }
  return { variant_id: data.id as string }
}
