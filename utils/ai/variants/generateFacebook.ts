import { BRAND_VOICE_FACEBOOK } from '@/utils/ai/editorialRules'
import { generateSocialVariant, type GenerateSocialVariantArgs, type GenerateSocialVariantResult } from './generateSocialVariant'

const FACEBOOK_CHAR_CAP = 63206

export function generateFacebook(
  args: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'>,
): Promise<GenerateSocialVariantResult> {
  return generateSocialVariant({
    ...args,
    platform: 'facebook',
    voiceDelta: BRAND_VOICE_FACEBOOK,
    charCap: FACEBOOK_CHAR_CAP,
  })
}
