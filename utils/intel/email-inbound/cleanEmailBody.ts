/**
 * cleanEmailBody — strip the invisible padding that marketing emails inject and
 * normalize whitespace, BEFORE we truncate or classify.
 *
 * Newsletter/promo emails pad their preheader with runs of zero-width and
 * soft-hyphen characters (U+00AD, U+034F, U+200B-200F, etc.) so the inbox
 * preview line looks a certain length. Those characters carry no meaning but
 * can eat 1,000+ characters of a forwarded email's budget before any real
 * content, which then gets cut off by the ingest cap (footnotes and later
 * stories are exactly where the cut lands). Removing them first reclaims that
 * budget for actual content and gives the classifier/segmenter cleaner input.
 *
 * Only invisible formatting characters and redundant whitespace are removed;
 * visible text, links, and structure are untouched.
 */

// Zero-width / invisible formatting characters used as email preheader padding:
// soft hyphen, combining grapheme joiner, zero-width space/joiner family,
// LTR/RTL marks, invisible math operators, word joiner, BOM, Mongolian vowel sep.
// eslint-disable-next-line no-misleading-character-class
const INVISIBLE = /[­͏​‌‍‎‏⁠⁡⁢⁣﻿᠎]/g

export function cleanEmailBody(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .replace(INVISIBLE, '')
    // Non-breaking spaces -> normal space so whitespace collapsing catches them.
    .replace(/ /g, ' ')
    // Collapse horizontal whitespace runs to a single space.
    .replace(/[ \t]{2,}/g, ' ')
    // Trim trailing whitespace on each line.
    .replace(/[ \t]+\n/g, '\n')
    // Collapse 3+ blank lines to a single paragraph break.
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
