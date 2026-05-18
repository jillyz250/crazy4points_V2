/**
 * Variant generator dispatcher (PR 3).
 *
 * One entrypoint maps a VariantFormat to the right format module + returns
 * its generated payload. Each module also exports FORMAT_PROMPT_VERSION so
 * the server action can stamp content_variants.generation_prompt_version.
 */

import type { VariantFormat } from '@/utils/supabase/queries'
import type { GeneratedVariant, VariantGenInput } from './shared'

import {
  generateAlert,
  FORMAT_PROMPT_VERSION as ALERT_V,
} from './alert'
import {
  generateBlog,
  FORMAT_PROMPT_VERSION as BLOG_V,
} from './blog'
import {
  generateNewsletter,
  FORMAT_PROMPT_VERSION as NEWSLETTER_V,
} from './newsletter'
import {
  generateFacebook,
  FORMAT_PROMPT_VERSION as FACEBOOK_V,
} from './facebook'
import {
  generateTwitter,
  FORMAT_PROMPT_VERSION as TWITTER_V,
} from './twitter'
import {
  generateInstagram,
  FORMAT_PROMPT_VERSION as INSTAGRAM_V,
} from './instagram'
import {
  generateLinkedin,
  FORMAT_PROMPT_VERSION as LINKEDIN_V,
} from './linkedin'
import {
  generateThreads,
  FORMAT_PROMPT_VERSION as THREADS_V,
} from './threads'

export const PROMPT_VERSIONS: Record<VariantFormat, string> = {
  alert: ALERT_V,
  blog: BLOG_V,
  newsletter: NEWSLETTER_V,
  facebook: FACEBOOK_V,
  twitter: TWITTER_V,
  instagram: INSTAGRAM_V,
  linkedin: LINKEDIN_V,
  threads: THREADS_V,
}

export function getPromptVersion(format: VariantFormat): string {
  return PROMPT_VERSIONS[format]
}

export async function generateVariantByFormat(
  format: VariantFormat,
  input: VariantGenInput,
): Promise<GeneratedVariant> {
  switch (format) {
    case 'alert':
      return generateAlert(input)
    case 'blog':
      return generateBlog(input)
    case 'newsletter':
      return generateNewsletter(input)
    case 'facebook':
      return generateFacebook(input)
    case 'twitter':
      return generateTwitter(input)
    case 'instagram':
      return generateInstagram(input)
    case 'linkedin':
      return generateLinkedin(input)
    case 'threads':
      return generateThreads(input)
    default: {
      const _exhaustive: never = format
      throw new Error(`Unknown variant format: ${String(_exhaustive)}`)
    }
  }
}
