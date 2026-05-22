import { BRAND_VOICE_LINKEDIN } from '@/utils/ai/editorialRules'
import { generateSocialVariant, type GenerateSocialVariantArgs, type GenerateSocialVariantResult } from './generateSocialVariant'

const LINKEDIN_CHAR_CAP = 3000

export function generateLinkedIn(
  args: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'>,
): Promise<GenerateSocialVariantResult> {
  return generateSocialVariant({
    ...args,
    platform: 'linkedin',
    voiceDelta: BRAND_VOICE_LINKEDIN,
    charCap: LINKEDIN_CHAR_CAP,
  })
}
