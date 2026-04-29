/**
 * Pure helper that reads a content_ideas row and decides whether it can be
 * published, what computed fields to write, and what gaps to surface.
 *
 * Extracted from updateContentIdeaStatusAction so the validation logic is
 * testable in isolation and the action stays readable.
 */
import { isBlogCategorySlug } from '@/lib/blog/categories';
import { computeReadingTimeMinutes } from '@/lib/blog/readingTime';

export interface FactCheckClaim {
  // Three-state truth: true = source confirms; false = source contradicts;
  // 'unsupported' = source silent. 'unsupported' is editor-decision territory,
  // not a blocker — see openHigh logic below.
  supported?: boolean | 'unsupported';
  severity?: string;
  acknowledged?: boolean;
  // Phase 2 — needed to detect "data gap" claims (web confirmed, your
  // data missing). High-severity gaps block publish so T1 stays complete.
  source_excerpt?: string | null;
  web_verdict?: 'likely_correct' | 'likely_wrong' | 'unverifiable' | string | null;
}

export interface IdeaForPublish {
  id: string;
  title: string;
  type: 'blog' | 'newsletter';
  slug: string | null;
  pitch: string;
  excerpt: string | null;
  category: string | null;
  article_body: string | null;
  written_at: string | null;
  fact_checked_at: string | null;
  fact_check_claims: FactCheckClaim[] | null;
  voice_checked_at: string | null;
  voice_pass: boolean | null;
  originality_checked_at: string | null;
  originality_pass: boolean | null;
  override_reason: string | null;
}

export interface PublishPlan {
  /** Hard blocks; even override_reason can't skip these. */
  blockers: string[];
  /** Soft gaps; override_reason can bypass these. */
  missing: string[];
  /** Computed/derived fields to merge into the publish update payload. */
  updates: {
    excerpt: string;
    reading_time_minutes: number;
  };
}

const ARTICLE_REQUIRED = 'article not drafted';

export function preparePublishUpdates(idea: IdeaForPublish): PublishPlan {
  const blockers: string[] = [];
  const missing: string[] = [];

  // Hard block: there must be SOMETHING to publish.
  if (!idea.article_body || !idea.written_at) {
    blockers.push(ARTICLE_REQUIRED);
  }

  // Hard block: at least excerpt or pitch must be present (otherwise the
  // dek under the headline would be blank).
  const hasExcerpt = !!idea.excerpt && idea.excerpt.trim().length > 0;
  const hasPitch = !!idea.pitch && idea.pitch.trim().length > 0;
  if (!hasExcerpt && !hasPitch) {
    blockers.push('excerpt or pitch required');
  }

  // Soft gates (overridable via override_reason):
  if (idea.type === 'blog' && !isBlogCategorySlug(idea.category)) {
    missing.push('category not set');
  }

  if (!idea.fact_checked_at) {
    missing.push('fact-check not run');
  } else {
    const claims = Array.isArray(idea.fact_check_claims) ? idea.fact_check_claims : [];
    // A claim only blocks publish if source EXPLICITLY contradicts it
    // (supported === false) AND it's high-severity AND unacknowledged AND
    // not rescued by web verification (likely_correct). Yellow 'unsupported'
    // claims (source silent) are NOT blockers — editor decides those.
    const openHigh = claims.some(
      (c) =>
        c &&
        c.supported === false &&
        c.severity === 'high' &&
        !c.acknowledged &&
        c.web_verdict !== 'likely_correct'
    );
    if (openHigh) missing.push('unresolved high-severity fact-check claim');

    // Phase 2 — high-severity data gaps are HARD BLOCKERS.
    // A "data gap" is a claim the article asserts that's confirmed by web
    // but absent from our T1 data. Editorially-correct, but a signal that
    // our card/program record is incomplete. Hard-blocking on high-severity
    // gaps converts the pipeline into a self-healing knowledge graph: every
    // publish forces T1 completion before shipping. The editor goes to the
    // card/program admin, fills in the missing fact, re-runs fact check —
    // gap moves into "Your data" and publish unblocks.
    //
    // Low-severity gaps (descriptive color) don't block — only high.
    // Acknowledged gaps don't block — editor explicitly waved them through.
    const openHighGap = claims.some(
      (c) =>
        c &&
        c.supported !== true &&
        c.severity === 'high' &&
        !c.acknowledged &&
        c.web_verdict === 'likely_correct' &&
        !c.source_excerpt
    );
    if (openHighGap) {
      blockers.push(
        'unresolved data gap (web confirmed a fact your T1 data is missing — fill the card/program record before publishing)'
      );
    }
  }

  if (!idea.voice_checked_at || idea.voice_pass !== true) {
    missing.push('voice check not passing');
  }

  if (!idea.originality_checked_at || idea.originality_pass !== true) {
    missing.push('originality check not passing');
  }

  return {
    blockers,
    missing,
    updates: {
      excerpt: hasExcerpt ? idea.excerpt!.trim() : (idea.pitch ?? '').trim(),
      reading_time_minutes: computeReadingTimeMinutes(idea.article_body),
    },
  };
}
