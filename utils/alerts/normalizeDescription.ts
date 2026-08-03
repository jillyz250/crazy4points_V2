/**
 * Pre-process an alert description markdown blob to fix common writer
 * format drift. Specifically: when the writer outputs "Label: value"
 * facts as separate paragraphs (instead of as a markdown bullet list),
 * the rendered page reads as a flat wall of text. This helper detects
 * those paragraph sequences and rewrites them as a bullet list with
 * bold labels, which then renders correctly via the rg-prose CSS.
 *
 * Why this exists:
 *   Writer prompt explicitly says to output:
 *     - **Label:** value
 *   But Sonnet occasionally drifts and outputs:
 *     Label: value
 *     <blank>
 *     Label: value
 *   The visible result on the alert page is a "boring flat" block.
 *   This normalizer is the safety net so the editor doesn't have to
 *   re-generate an alert just to fix the format.
 *
 *   Used by app/(site)/alerts/[slug]/page.tsx before passing the
 *   description to `marked()` for HTML rendering.
 */

// Matches a "Label: value" fact line, whether the label is plain (`Discount:`)
// or already bold-wrapped (`**Discount:**`). Both slip past real markdown
// bullets and render as an inline wall of text, so we detect either shape and
// re-emit as proper `- **Label:** value` bullets.
const LABEL_LINE_RE = /^\*{0,2}([A-Z][A-Za-z][A-Za-z0-9 \-/&]{2,40}):\*{0,2}\s+(.+?)\s*$/

/**
 * Take raw markdown, return cleaned-up markdown with `Label: value`
 * paragraph sequences converted to proper bulleted lists.
 *
 * Conservative: only matches lines that look like real labels (start
 * with capital letter, end with colon + value, label length 4-42
 * chars). Won't mangle prose like "If you read the terms: ..." because
 * those don't fit the structure.
 */
export function normalizeAlertDescription(markdown: string | null | undefined): string {
  if (!markdown) return ''
  const lines = String(markdown).split('\n')
  const out: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // Skip lines already in a markdown list — don't double-bullet
    if (/^\s*[-*]\s/.test(line)) {
      out.push(line)
      i++
      continue
    }

    const m = line.match(LABEL_LINE_RE)
    if (!m) {
      out.push(line)
      i++
      continue
    }

    // Found a candidate label line. Look ahead for more.
    const group: Array<{ label: string; value: string }> = [
      { label: m[1], value: m[2] },
    ]
    let j = i + 1
    // Walk through blank lines + label-shaped lines.
    while (j < lines.length) {
      const peek = lines[j]
      if (peek.trim() === '') { j++; continue }
      const peekMatch = peek.match(LABEL_LINE_RE)
      if (!peekMatch) break
      group.push({ label: peekMatch[1], value: peekMatch[2] })
      j++
    }

    // Only convert if we collected 3+ label lines — singletons stay as
    // prose so we don't break sentences like "Bottom line: it's worth it."
    if (group.length >= 3) {
      // Emit a blank line before list (markdown requires it for ul)
      if (out.length > 0 && out[out.length - 1].trim() !== '') {
        out.push('')
      }
      for (const { label, value } of group) {
        out.push(`- **${label}:** ${value}`)
      }
      out.push('') // trailing blank
      i = j
    } else {
      out.push(line)
      i++
    }
  }

  return out.join('\n')
}
