import sanitizeHtml from 'sanitize-html';

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
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ['href', 'title', 'rel', 'target'],
    img: ['src', 'alt'],
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
