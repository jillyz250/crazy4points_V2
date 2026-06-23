/**
 * Serialize a JSON-LD object for injection into <script type="application/ld+json">.
 *
 * `JSON.stringify` does NOT escape `<`, so any field containing `</script>`
 * (authored or AI-generated titles/summaries) breaks out of the script tag —
 * a stored-XSS vector. Escaping `<` to `<` keeps the JSON byte-identical
 * to parsers while making `</script>` inert as HTML. This is the standard fix.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
