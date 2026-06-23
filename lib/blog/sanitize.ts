import sanitizeHtml from 'sanitize-html';
import { marked } from 'marked';

/**
 * Inline images in article bodies are allowed only from these hosts.
 * Anything else gets stripped to prevent tracking pixels and rogue CDNs.
 *
 * Add Supabase storage host once a real bucket is in use.
 */
const ALLOWED_IMG_HOSTS: readonly string[] = [
  'crazy4points.com',
  'images.unsplash.com',
];

const ALLOWED_TAGS: readonly string[] = [
  'p', 'a', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i',
  'h2', 'h3', 'h4', 'blockquote', 'code', 'pre',
  'br', 'hr', 'img',
  // Tables: program award-chart / sweet-spot prose renders GFM tables.
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt'],
    // Structural table attrs only — NOT style (CSS payload vector).
    th: ['colspan', 'rowspan', 'align'],
    td: ['colspan', 'rowspan', 'align'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  exclusiveFilter: (frame) => {
    if (frame.tag !== 'img') return false;
    const src = frame.attribs?.src;
    if (!src) return true;
    try {
      const url = new URL(src);
      return !ALLOWED_IMG_HOSTS.includes(url.host);
    } catch {
      return true; // not a URL → strip
    }
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
  },
};

/**
 * Sanitize HTML produced by the markdown renderer before injecting into
 * the page. Blocks <script>, <iframe>, foreign-host <img>, and any other
 * tag/attribute combination not in the allowlist.
 */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * THE single markdown render chokepoint: markdown -> HTML -> sanitize.
 *
 * Every prose field rendered via dangerouslySetInnerHTML must go through this
 * (alerts, blog, program intro/sweet-spots/quirks/award-chart/lounge, experiences).
 * Calling `marked.parse()` directly and injecting the result bypasses
 * sanitization — which is exactly how the program + experience pages shipped a
 * stored-XSS gap. Use this instead of raw `marked.parse`.
 */
export async function renderProseMarkdown(md: string | null | undefined): Promise<string> {
  if (!md) return '';
  const html = await marked.parse(md, { async: true });
  return sanitizeArticleHtml(html);
}
