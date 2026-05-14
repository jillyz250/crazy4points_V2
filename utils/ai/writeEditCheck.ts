/**
 * Server-side only. Orchestrates the write → edit → voice-check loop with
 * one retry on voice failure. Used by build-brief (first draft) and the
 * regenerate flow (admin-triggered re-write).
 *
 * Flow:
 *   1. writeAlertDraft
 *   2. editAlertDraft (polish AI-tells)
 *   3. voiceCheckDraft (score against persona)
 *   4. If voice failed, repeat 1-3 once with voice_revise_notes feeding the
 *      writer the specific issues to address.
 *
 * Returns the final draft (post-edit), the final voice result, and a flag
 * indicating whether a retry was triggered. Callers should surface the
 * voice result to the admin UI as a gate state.
 */
import { writeAlertDraft, type AlertDraft } from './writeAlertDraft'
import type {
  WriteDraftIntel,
  WriteDraftProgram,
  WriteDraftRecentAlertSample,
} from './writeAlertDraft'
import { editAlertDraft, type EditedDraft } from './editAlertDraft'
import {
  voiceCheckDraft,
  formatVoiceFeedback,
  type VoiceCheckResult,
} from './voiceCheckDraft'

export interface WriteEditCheckArgs {
  intel: WriteDraftIntel
  programs: WriteDraftProgram[]
  recent_samples?: WriteDraftRecentAlertSample[]
  extra_context?: string | null
  alliance_context?: string | null
}

export interface WriteEditCheckResult {
  /** Final draft after edit. Null if writer returned null. */
  draft: AlertDraft | null
  /** Result of the editor pass on the final draft. */
  edited: EditedDraft | null
  /** Voice check on the final draft. Null if Haiku call failed. */
  voice: VoiceCheckResult | null
  /** True if a retry was triggered (i.e. first attempt failed voice gate). */
  retried: boolean
}

export async function writeEditCheck(
  args: WriteEditCheckArgs
): Promise<WriteEditCheckResult> {
  // Pass 1: write → edit → check
  let draft = await writeAlertDraft(args)
  if (!draft) return { draft: null, edited: null, voice: null, retried: false }

  let edited = await editAlertDraft({
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
  })
  if (edited) {
    draft.summary = edited.summary
    draft.description = edited.description
  }

  let voice = await voiceCheckDraft({
    title: draft.title,
    summary: draft.summary,
    description: draft.description,
  })

  // Pass 2 (retry): if voice failed, re-write with feedback, then re-edit
  // and re-check. Cap at one retry — if it fails twice, admin sees the
  // failure state and decides whether to override.
  if (voice && !voice.passed) {
    const feedback = formatVoiceFeedback(voice)
    const retryDraft = await writeAlertDraft({
      ...args,
      voice_revise_notes: feedback,
    })
    if (retryDraft) {
      draft = retryDraft
      edited = await editAlertDraft({
        title: draft.title,
        summary: draft.summary,
        description: draft.description,
      })
      if (edited) {
        draft.summary = edited.summary
        draft.description = edited.description
      }
      voice = await voiceCheckDraft({
        title: draft.title,
        summary: draft.summary,
        description: draft.description,
      })
    }
    return { draft, edited, voice, retried: true }
  }

  return { draft, edited, voice, retried: false }
}
