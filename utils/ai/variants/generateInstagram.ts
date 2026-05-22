import { BRAND_VOICE_INSTAGRAM } from '@/utils/ai/editorialRules'
import { generateSocialVariant, type GenerateSocialVariantArgs, type GenerateSocialVariantResult } from './generateSocialVariant'

const INSTAGRAM_CHAR_CAP = 2200

export function generateInstagram(
  args: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'>,
): Promise<GenerateSocialVariantResult> {
  return generateSocialVariant({
    ...args,
    platform: 'instagram',
    voiceDelta: BRAND_VOICE_INSTAGRAM,
    charCap: INSTAGRAM_CHAR_CAP,
  })
}
