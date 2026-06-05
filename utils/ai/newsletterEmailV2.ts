/**
 * Newsletter V2 email renderer — slot-based.
 *
 * Renders the slot-shape (NewsletterSlots) into branded HTML matching the
 * approved mockup: hero header → Game → Big Story → Also Happening → Jill's
 * Take → footer. Each section is independently hideable; the renderer omits
 * sections whose slot is empty.
 *
 * V2 reads from new column shape (migration 222). V1 renderer
 * (newsletterEmail.ts) stays in place for legacy/already-sent newsletters.
 */
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot, ActiveOffers, OfferItem } from './newsletterSlots'
import { unsubscribeUrlFor } from '@/utils/email/unsubscribeToken'

const PURPLE = '#6B2D8F'
const GOLD = '#D4AF37'
const SOFT_BG = '#F8F5FB'
const BODY = '#1A1A1A'
const MUTED = '#4A4A4A'
const BORDER = '#E6DEEE'
const PAGE_BG = '#f4eef8'
/** Editorial blue used for in-body link styling — distinct from the
 *  purple-and-gold brand palette so links read as clearly clickable. */
const LINK_BLUE = '#1a5fb4'

const FONT_DISPLAY = "'Playfair Display', Georgia, serif"
const FONT_BODY = "'Lato', 'Helvetica Neue', Arial, sans-serif"
const FONT_UI = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Allow a small set of inline tags through the body HTML — the slot fields
 * (big_story_html, jills_take_html) are admin-edited so we trust their tag
 * choices, but we still escape unknown content.
 *
 * For V1, the editor surfaces a plain textarea; the admin types paragraphs
 * separated by blank lines. We split & wrap on render. Authored HTML in the
 * field passes through.
 */
function bodyHtml(raw: string | null | undefined): string {
  if (!raw) return ''
  let html = raw

  // Strip stale label paragraphs ("What this means for you:" etc.) that
  // older Sonnet generations baked in. Bullets stand alone — the visual
  // separation between lead paragraph and bullet list does the work.
  html = html.replace(
    /<p>\s*(<strong>\s*)?(What\s+this\s+means\s+for\s+you|Here'?s?\s+what\s+to\s+know|The\s+details|Key\s+dates|Mark\s+your\s+calendar)\s*:?\s*(<\/strong>\s*)?<\/p>/gi,
    '',
  )

  // If the (now-cleaned) field has structured HTML, inject inline styles
  // on bare p/ul/li tags for breathing typography. Email clients ignore
  // <style> blocks (especially Gmail) so we must inline.
  if (/<(p|ul|ol|h\d|table)\b/i.test(html)) {
    return html
      .replace(
        /<p(?![^>]*style=)/gi,
        `<p style="margin:0 0 20px;font-family:${FONT_BODY};font-size:16px;line-height:1.75;color:${BODY};"`,
      )
      .replace(
        /<ul(?![^>]*style=)/gi,
        `<ul style="margin:0 0 20px;padding-left:22px;font-family:${FONT_BODY};font-size:16px;line-height:1.7;color:${BODY};"`,
      )
      .replace(
        /<li(?![^>]*style=)/gi,
        `<li style="margin:0 0 12px;line-height:1.65;"`,
      )
  }
  // Otherwise paragraph-wrap — split on blank lines, escape each, wrap in <p>.
  return html
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 20px;font-family:${FONT_BODY};font-size:16px;line-height:1.75;color:${BODY};">${esc(p)}</p>`,
    )
    .join('')
}

function renderGame(game: NewsletterSlots['game'], origin: string): string {
  if (!game.slug) return ''
  const title = esc(game.title ?? 'Game of the Week')
  const clue = game.clue_text
    ? `<p style="margin:0 0 18px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${BODY};">${esc(game.clue_text)}</p>`
    : ''
  return `
    <tr><td style="padding:32px 28px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:3px dashed ${PURPLE};border-radius:14px;background:${SOFT_BG};">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${PURPLE};font-weight:700;">Game of the Week</p>
          <h2 style="margin:0 0 10px;font-family:${FONT_DISPLAY};font-size:24px;line-height:1.2;color:${PURPLE};">${title}</h2>
          ${clue}
          <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate;">
            <tr><td align="center" bgcolor="${PURPLE}" style="border-radius:6px;mso-padding-alt:10px 22px;">
              <a href="${origin}/games/${esc(game.slug)}" style="display:inline-block;padding:10px 22px;font-family:${FONT_UI};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;background-color:${PURPLE};">Play this week's puzzle →</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`
}

function renderBigStory(slots: NewsletterSlots, origin: string): string {
  if (!slots.big_story_html) return ''
  // Big Story now leads with the chosen subject line as a 28px Playfair
  // headline. The inbox subject + article headline align by design — they
  // anchor to the same locked alert, so reusing the subject keeps the
  // editorial throughline tight without requiring a new field.
  const headline = slots.subject
    ? `<h1 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:28px;line-height:1.2;color:${BODY};font-weight:700;">${esc(slots.subject)}</h1>`
    : ''
  // Soft purple wash on the Big Story so it reads as a deliberate featured
  // section (tier 2) — sits visually between plain white content and the
  // bordered cards (Sweet Spot, Game). No border so it doesn't compete
  // with Sweet Spot's gold accent.
  return `
    <tr><td style="padding:24px 28px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;">
        <tr><td style="padding:26px 28px 18px;">
          ${headline}
          ${bodyHtml(slots.big_story_html)}
        </td></tr>
      </table>
    </td></tr>`
}

function renderAlsoHappening(items: AlsoHappeningItem[], origin: string): string {
  if (!items || items.length === 0) return ''
  const cards = items
    .map((item) => {
      const cat = esc(item.category || 'Update')
      const link = item.link_url
        ? `<p style="margin:0;font-family:${FONT_UI};font-size:13px;font-weight:600;"><a href="${esc(item.link_url)}" style="color:${GOLD};text-decoration:none;">Details →</a></p>`
        : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;border:1px solid ${BORDER};border-radius:12px;background:#fff;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 4px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${PURPLE};font-weight:700;">${cat}</p>
            <h3 style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:17px;line-height:1.3;color:${BODY};">${esc(item.headline)}</h3>
            <p style="margin:0 0 ${link ? '10px' : '0'};font-family:${FONT_BODY};font-size:14px;line-height:1.55;color:${BODY};">${esc(item.blurb)}</p>
            ${link}
          </td></tr>
        </table>`
    })
    .join('')
  return `
    <tr><td style="padding:32px 28px 0;">
      <p style="margin:0 0 12px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};font-weight:700;">Also Happening</p>
      ${cards}
    </td></tr>`
}

function renderOfferBucket(label: string, items: OfferItem[], origin: string): string {
  if (!items || items.length === 0) return ''
  // Dedupe within a bucket by headline (defensive against the same offer being
  // pulled twice).
  const seen = new Set<string>()
  const unique = items.filter((it) => {
    const key = (it.headline ?? '').trim().toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  // One line per offer — this section is a compact rundown/index, not full
  // cards. Headline links to the full alert (built-in "see more"), with the
  // deadline as a gold tag. No blurb: keeps the section short so the email
  // doesn't blow past Gmail's ~102KB clip threshold and cut off later
  // sections (Jill's Take renders below this).
  const rows = unique
    .map((it) => {
      const href = it.link_url
        ? (it.link_url.startsWith('http') ? it.link_url : `${origin}${it.link_url}`)
        : ''
      const headline = href
        ? `<a href="${esc(href)}" style="color:${BODY};text-decoration:none;">${esc(it.headline)}</a>`
        : esc(it.headline)
      const deadline = it.deadline
        ? ` <span style="font-family:${FONT_UI};font-size:12px;font-weight:600;color:${GOLD};white-space:nowrap;">${esc(it.deadline)}</span>`
        : ''
      return `
        <p style="margin:0 0 7px;font-family:${FONT_BODY};font-size:14px;line-height:1.4;color:${BODY};">${headline}${deadline}</p>`
    })
    .join('')
  return `
    <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${PURPLE};font-weight:700;">${esc(label)}</p>
    ${rows}`
}

function renderActiveOffers(offers: ActiveOffers | null, origin: string): string {
  if (!offers) return ''
  const buckets =
    renderOfferBucket('Transfer bonuses', offers.transfer_bonuses ?? [], origin) +
    renderOfferBucket('Other Promos & Experiences', offers.earning_promos ?? [], origin) +
    renderOfferBucket('Points purchase bonuses', offers.purchase_bonuses ?? [], origin)
  if (!buckets) return ''
  return `
    <tr><td style="padding:32px 28px 0;">
      <p style="margin:0 0 14px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};font-weight:700;">Live Offers</p>
      ${buckets}
    </td></tr>`
}

function renderSweetSpot(sp: NewsletterSweetSpot | null): string {
  if (!sp || !sp.topic) return ''
  const uses = (sp.best_uses ?? [])
    .filter((u) => u && (u.name || u.why))
    .map(
      (u) => `
        <li style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${BODY};">
          <strong style="color:${PURPLE};">${esc(u.name)}</strong>${u.why ? ` — ${esc(u.why)}` : ''}
        </li>`,
    )
    .join('')
  // Pass through bodyHtml so the explainer supports admin-pasted HTML
  // (e.g. <strong>, <ul>, <em>) AND auto-strips stale "What this means
  // for you" header paragraphs. Falls back to paragraph-wrapping plain
  // text for legacy entries.
  const explainer = sp.mechanic_explainer ? bodyHtml(sp.mechanic_explainer) : ''
  return `
    <tr><td style="padding:32px 28px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid ${GOLD};border-radius:12px;background:${SOFT_BG};">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Sweet Spot of the Week</p>
          <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.3;color:${PURPLE};">${esc(sp.topic)}</h2>
          ${explainer}
          ${uses ? `<p style="margin:18px 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Good for</p><ul style="margin:0;padding:0 0 0 18px;">${uses}</ul>` : ''}
        </td></tr>
      </table>
    </td></tr>`
}

function fmtBonusDate(iso: string | null): string {
  if (!iso) return 'No end date'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'No end date'
  return `Ends ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function renderCurrentBonuses(bonuses: CurrentBonusRow[] | undefined, origin: string): string {
  if (!bonuses || bonuses.length === 0) return ''
  // Clean list — just clickable titles + inline end-date. No per-row
  // backgrounds or boxes. Eyebrow above, list below, breathing room.
  const items = bonuses
    .map((b) => {
      const url = b.slug ? `${origin}/alerts/${esc(b.slug)}` : '#'
      const endLabel = fmtBonusDate(b.end_date)
      return `
        <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.45;color:${BODY};">
          <a href="${url}" style="color:${LINK_BLUE};text-decoration:underline;font-weight:600;">${esc(b.title)}</a>
          <span style="color:${MUTED};font-size:13px;margin-left:6px;">&middot; ${esc(endLabel)}</span>
        </p>`
    })
    .join('')
  return `
    <tr><td style="padding:32px 28px 0;">
      <p style="margin:0 0 14px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};font-weight:700;">Active transfer + point bonuses</p>
      ${items}
    </td></tr>`
}

function renderJillsTake(html: string | null | undefined): string {
  if (!html) return ''
  // Luxe pull-quote treatment: white background, gold-ribbon top + bottom
  // borders, sparkle-bookended eyebrow, Playfair italic body centered with
  // constrained max-width. Reads as a magazine pull-quote / signed editorial
  // closer — distinct from every other section's purple-tint blocks.
  const inner = /<(p|em|strong)\b/i.test(html)
    ? html
    : `<p style="margin:0;">${esc(html)}</p>`
  // Fancy ribbon: pointed-tail ends via CSS-border triangles. Center gold
  // rectangle holds the white uppercase "Jill's Take" text; left + right
  // 0-width cells use border tricks to create gold triangle tails pointing
  // outward, making the whole thing read as an actual ribbon banner.
  //
  // Email-safety: Gmail web, Apple Mail, Outlook.com all render CSS
  // border-triangle. Outlook desktop may drop the tails (graceful
  // fallback — still shows the gold rectangle).
  return `
    <tr><td style="padding:32px 28px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
        <tr><td style="padding:28px 32px;text-align:center;">
          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 22px;">
            <tr>
              <td style="width:0;height:0;border-top:18px solid transparent;border-bottom:18px solid transparent;border-right:14px solid ${GOLD};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
              <td style="background:${GOLD};padding:0 26px;height:36px;font-family:${FONT_UI};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;font-weight:700;line-height:36px;white-space:nowrap;">Jill&#39;s Take</td>
              <td style="width:0;height:0;border-top:18px solid transparent;border-bottom:18px solid transparent;border-left:14px solid ${GOLD};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
            </tr>
          </table>
          <div style="font-family:${FONT_DISPLAY};font-size:18px;line-height:1.6;color:${BODY};font-style:italic;max-width:480px;margin:0 auto;">${inner}</div>
        </td></tr>
      </table>
    </td></tr>`
}

export interface CurrentBonusRow {
  id: string
  slug: string | null
  title: string
  alert_type: 'transfer_bonus' | 'point_purchase'
  end_date: string | null
}

export interface RenderNewsletterV2Args {
  slots: NewsletterSlots
  weekOf: string
  origin?: string
  /** When true, prepends a gold "preview" banner so admin/test sends look distinct from real ones. */
  isPreview?: boolean
  /** Recipient email — required for personalised unsubscribe URL. When omitted
   *  (e.g. admin preview without a real subscriber), the footer falls back
   *  to the public /unsubscribe page. */
  recipientEmail?: string
  /** Live rate-sheet rows — every active transfer / point-purchase bonus,
   *  pulled at render time. Section auto-hides when empty. */
  currentBonuses?: CurrentBonusRow[]
}

export function renderNewsletterV2Html({
  slots,
  weekOf,
  origin = 'https://crazy4points.com',
  isPreview = false,
  recipientEmail,
  currentBonuses,
}: RenderNewsletterV2Args): string {
  const logoUrl = `${origin}/crazy4points-logo.png`
  const subject = slots.subject || 'Crazy4Points — Weekly'

  const previewBanner = isPreview
    ? `
    <tr><td style="padding:10px 24px;background:${GOLD};">
      <p style="margin:0;font-family:${FONT_UI};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BODY};text-align:center;">Preview — not sent to subscribers</p>
    </td></tr>`
    : ''

  // Hero kicker is unused in pass-5 hero (date-only). Kept in slots for
  // possible future use; just don't render it here.

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${esc(subject)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PAGE_BG};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(26,26,26,0.06);">

        ${previewBanner}

        <!-- Hero (design pass 5 — banner image at top, then a clean white
             dateline strip with the date in Playfair italic, left-aligned.
             The italic serif echoes the banner's wordmark + script while
             the white bg gives the banner a deliberate stage instead of
             trying (and failing) to match its cream wash exactly. -->
        <tr><td style="background:#ffffff;text-align:center;font-size:0;line-height:0;">
          <img src="${origin}/newsletter-hero-banner.png" alt="Crazy4Points Newsletter" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:14px 28px 12px;background:#ffffff;text-align:left;">
          <p style="margin:0;font-family:${FONT_DISPLAY};font-style:italic;font-size:18px;font-weight:600;color:${PURPLE};letter-spacing:0.3px;">${esc(weekOf)}</p>
        </td></tr>
        <tr><td style="padding:0 28px;background:#ffffff;">
          <div style="height:1px;background:${BORDER};line-height:1px;font-size:0;">&nbsp;</div>
        </td></tr>

        ${renderBigStory(slots, origin)}
        ${renderSweetSpot(slots.sweet_spot)}
        ${renderAlsoHappening(slots.also_happening, origin)}
        ${renderActiveOffers(slots.active_offers, origin)}
        ${renderGame(slots.game, origin)}
        ${renderJillsTake(slots.jills_take_html)}

        <!-- Footer — social row, then disclaimer, then fine-print links. -->
        <tr><td style="padding:22px 28px 18px;border-top:1px solid ${BORDER};background:${SOFT_BG};text-align:center;">
          <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:11px;color:${MUTED};letter-spacing:0.6px;text-transform:uppercase;font-weight:600;">Follow us on social media</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;">
            <tr>
              <td style="padding:0 8px;">
                <a href="https://www.facebook.com/profile.php?id=61589408162571" style="text-decoration:none;display:inline-block;">
                  <img src="${origin}/social/facebook.png" alt="Facebook" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;width:32px;height:32px;" />
                </a>
              </td>
              <td style="padding:0 8px;">
                <a href="https://www.instagram.com/crazy4points/" style="text-decoration:none;display:inline-block;">
                  <img src="${origin}/social/instagram.png" alt="Instagram" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;width:32px;height:32px;" />
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 auto 10px;max-width:480px;font-family:${FONT_UI};font-size:10px;color:${MUTED};line-height:1.55;font-style:italic;">Affiliate links may earn us a commission at no cost to you. Editorial picks are independent. Informational only &mdash; verify all terms with the issuer.</p>
          <p style="margin:0;font-family:${FONT_UI};font-size:11px;color:${MUTED};letter-spacing:0.3px;">crazy4points.com &middot; <a href="${origin}/privacy" style="color:${MUTED};text-decoration:underline;">Privacy</a> &middot; <a href="${origin}/affiliate-disclosure" style="color:${MUTED};text-decoration:underline;">Affiliate Disclosure</a> &middot; <a href="${recipientEmail ? unsubscribeUrlFor(recipientEmail, origin) : `${origin}/unsubscribe`}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Format a Date or YYYY-MM-DD into "May 5, 2026" style. Used by both the
 * generator and the renderer when displaying the week-of stamp.
 */
export function formatWeekOf(weekOf: string): string {
  const d = new Date(weekOf + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return weekOf
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/** Newsletter dateline. Priority:
 *   1. display_date (editor override, YYYY-MM-DD) — what to print for sends
 *      prepared today but going out tomorrow
 *   2. sent_at (archive) — preserves real send date on already-sent rows
 *   3. NOW — default fallback for fresh drafts / previews
 */
export function formatNewsletterDate(row: {
  display_date?: string | null
  sent_at?: string | null
}): string {
  if (row.display_date) {
    // YYYY-MM-DD parses as UTC midnight; force UTC timezone in format so
    // it renders as the same calendar day regardless of server locale.
    const d = new Date(row.display_date + 'T00:00:00Z')
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      })
    }
  }
  const d = row.sent_at ? new Date(row.sent_at) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
