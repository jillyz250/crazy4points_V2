/**
 * Strict HTML allowlist sanitizer for inbound email bodies.
 *
 * Per Phase 2a.3 security hardening: only `p`, `a`, `ul`, `li`, `strong`, `em`
 * (plus their lowercase variants) survive. Everything else — script, iframe,
 * style, event handlers, external resource refs — is stripped.
 *
 * Pure function. No external dependencies (no DOMPurify install). The
 * inbound HTML is never rendered by us; we only store it for editor review
 * and run it through Haiku. So this sanitizer is defense-in-depth, not the
 * only line of defense.
 */

const ALLOWED_TAGS = new Set(['p', 'a', 'ul', 'li', 'strong', 'em', 'br'])

const ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href']),
  // other tags get no attributes at all
}

const URL_SAFE_PROTOCOLS = ['https:', 'http:', 'mailto:']

export interface SanitizeResult {
  sanitized: string
  stripped_tag_count: number
  stripped_attr_count: number
  rejected_url_count: number
}

export function sanitizeInboundHtml(input: string): SanitizeResult {
  if (!input) return { sanitized: '', stripped_tag_count: 0, stripped_attr_count: 0, rejected_url_count: 0 }

  let strippedTags = 0
  let strippedAttrs = 0
  let rejectedUrls = 0

  // 1. Drop script / style / iframe / object / embed / svg / math content blocks
  //    entirely (including their inner text — those aren't email content).
  const dangerousBlocks = /<(script|style|iframe|object|embed|svg|math|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
  let out = input.replace(dangerousBlocks, () => {
    strippedTags++
    return ''
  })

  // 2. Drop standalone dangerous tags (self-closing or unclosed).
  out = out.replace(/<\/?(script|style|iframe|object|embed|svg|math|noscript|template|link|meta|base)\b[^>]*\/?>/gi, () => {
    strippedTags++
    return ''
  })

  // 3. Drop HTML comments (could contain conditional comments / IE tricks).
  out = out.replace(/<!--[\s\S]*?-->/g, '')

  // 4. Walk through remaining tags. Replace any tag not in allowlist with
  //    its inner text only; sanitize attributes on allowed tags.
  out = out.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (_match, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      strippedTags++
      return ''
    }
    // Self-closing or closing tag — no attributes to sanitize on </tag>
    if (_match.startsWith('</')) return `</${tag}>`
    if (tag === 'br') return '<br>'

    // For opening tags, scrub attributes.
    const allowedAttrs = ALLOWED_ATTRS_BY_TAG[tag] ?? new Set<string>()
    let cleaned: string[] = []
    const attrRegex = /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
    let m: RegExpExecArray | null
    while ((m = attrRegex.exec(attrs)) !== null) {
      const name = m[1].toLowerCase()
      const value = m[2] ?? m[3] ?? m[4] ?? ''
      if (!allowedAttrs.has(name)) {
        strippedAttrs++
        continue
      }
      // Special handling for href: must be a safe URL scheme.
      if (name === 'href') {
        if (!isSafeUrl(value)) {
          rejectedUrls++
          continue
        }
        cleaned.push(`href="${escapeAttr(value)}"`)
      } else {
        cleaned.push(`${name}="${escapeAttr(value)}"`)
      }
    }
    return cleaned.length > 0 ? `<${tag} ${cleaned.join(' ')}>` : `<${tag}>`
  })

  return {
    sanitized: out.trim(),
    stripped_tag_count: strippedTags,
    stripped_attr_count: strippedAttrs,
    rejected_url_count: rejectedUrls,
  }
}

/**
 * Allow URL only if scheme is http/https/mailto. Reject javascript:, data:,
 * vbscript:, file:, etc. Bare relative URLs are dropped (no domain context).
 */
function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  try {
    // URL parser requires absolute; fall back to manual scheme check
    if (/^[a-z][a-z0-9+\-.]*:/i.test(trimmed)) {
      const u = new URL(trimmed)
      return URL_SAFE_PROTOCOLS.includes(u.protocol.toLowerCase())
    }
    return false
  } catch {
    return false
  }
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Extract safe URLs from sanitized HTML for downstream processing
 * (the +tag classifier wants the URL list separately from prose).
 */
export function extractSafeUrls(html: string): string[] {
  const urls: string[] = []
  const hrefRegex = /href="([^"]+)"/gi
  let m: RegExpExecArray | null
  while ((m = hrefRegex.exec(html)) !== null) {
    if (isSafeUrl(m[1])) urls.push(m[1])
  }
  return urls
}
