import { BRAND_VOICE_X } from '@/utils/ai/editorialRules'
import { generateSocialVariant, type GenerateSocialVariantArgs, type GenerateSocialVariantResult } from './generateSocialVariant'

const X_CHAR_CAP = 280

export function generateX(
  args: Omit<GenerateSocialVariantArgs, 'platform' | 'voiceDelta' | 'charCap'>,
): Promise<GenerateSocialVariantResult> {
  return generateSocialVariant({
    ...args,
    platform: 'x',
    voiceDelta: BRAND_VOICE_X,
    charCap: X_CHAR_CAP,
  })
}
