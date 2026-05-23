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
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot } from './newsletterSlots'
import { unsubscribeUrlFor } from '@/utils/email/unsubscribeToken'

const PURPLE = '#6B2D8F'
const GOLD = '#D4AF37'
const SOFT_BG = '#F8F5FB'
const BODY = '#1A1A1A'
const MUTED = '#4A4A4A'
const BORDER = '#E6DEEE'
const PAGE_BG = '#f4eef8'

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
  // If the field already contains a <p> or <ul>, treat as already-rendered.
  if (/<(p|ul|ol|h\d|table)\b/i.test(raw)) return raw
  // Otherwise paragraph-wrap — split on blank lines, escape each, wrap in <p>.
  return raw
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${BODY};">${esc(p)}</p>`)
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
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid ${PURPLE};border-radius:12px;background:${SOFT_BG};">
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
  return `
    <tr><td style="padding:32px 28px 8px;">
      <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c0392b;font-weight:700;">This Week's Big Story</p>
      ${bodyHtml(slots.big_story_html)}
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
  const explainer = sp.mechanic_explainer
    ? `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.65;color:${BODY};">${esc(sp.mechanic_explainer)}</p>`
    : ''
  return `
    <tr><td style="padding:32px 28px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid ${GOLD};border-radius:12px;background:${SOFT_BG};">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Sweet Spot of the Week</p>
          <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.3;color:${PURPLE};">${esc(sp.topic)}</h2>
          ${explainer}
          ${uses ? `<ul style="margin:0;padding:0 0 0 18px;">${uses}</ul>` : ''}
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
  const rows = bonuses
    .map((b) => {
      const url = b.slug ? `${origin}/alerts/${esc(b.slug)}` : '#'
      const endLabel = fmtBonusDate(b.end_date)
      return `
        <tr><td style="padding:8px 0;border-bottom:1px solid ${BORDER};">
          <a href="${url}" style="text-decoration:none;color:inherit;display:block;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="vertical-align:top;padding-right:12px;">
                  <p style="margin:0;font-family:${FONT_BODY};font-size:14px;line-height:1.45;color:${BODY};font-weight:600;">${esc(b.title)}</p>
                </td>
                <td style="vertical-align:top;text-align:right;white-space:nowrap;">
                  <p style="margin:0;font-family:${FONT_UI};font-size:11px;color:${MUTED};">${esc(endLabel)} →</p>
                </td>
              </tr>
            </table>
          </a>
        </td></tr>`
    })
    .join('')
  return `
    <tr><td style="padding:32px 28px 0;">
      <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};font-weight:700;">Active transfer + point bonuses</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${SOFT_BG};border-radius:10px;padding:4px 14px;">
        ${rows}
      </table>
    </td></tr>`
}

function renderJillsTake(html: string | null | undefined, origin: string): string {
  if (!html) return ''
  // Render inside an italic block; respect authored HTML if present, else wrap as-is.
  const inner = /<(p|em|strong)\b/i.test(html)
    ? html
    : `<p style="margin:0;font-family:${FONT_BODY};font-size:16px;line-height:1.65;color:${BODY};font-style:italic;">${esc(html)}</p>`
  const mascotUrl = `${origin}/Mascot.png`
  return `
    <tr><td style="padding:32px 28px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${SOFT_BG};border-left:4px solid ${PURPLE};border-radius:6px;">
        <tr>
          <td style="width:96px;padding:18px 0 18px 18px;vertical-align:top;">
            <img src="${mascotUrl}" alt="" width="80" style="display:block;width:80px;height:auto;" />
          </td>
          <td style="padding:18px 22px 18px 8px;vertical-align:top;">
            <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${PURPLE};font-weight:700;">Jill's Take</p>
            ${inner}
          </td>
        </tr>
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

  const heroKicker = slots.hero_kicker
    ? `<p style="margin:0 0 6px;font-family:${FONT_UI};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};font-weight:700;">${esc(slots.hero_kicker)}</p>`
    : ''

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

        <!-- Hero -->
        <tr><td style="padding:18px 32px 14px;background:${SOFT_BG};text-align:center;">
          ${heroKicker}
          <img src="${logoUrl}" alt="Crazy4Points" width="200" style="display:block;margin:0 auto;max-width:60%;height:auto;" />
          <p style="margin:6px 0 0;font-family:${FONT_UI};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${MUTED};font-weight:600;">Week of ${esc(weekOf)}</p>
        </td></tr>
        <tr><td style="height:3px;background:${GOLD};line-height:3px;font-size:0;">&nbsp;</td></tr>

        ${renderBigStory(slots, origin)}
        ${renderSweetSpot(slots.sweet_spot)}
        ${renderCurrentBonuses(currentBonuses, origin)}
        ${renderAlsoHappening(slots.also_happening, origin)}
        ${renderGame(slots.game, origin)}
        ${renderJillsTake(slots.jills_take_html, origin)}

        <!-- Footer -->
        <tr><td style="padding:32px 28px 32px;border-top:1px solid ${BORDER};background:${SOFT_BG};text-align:center;margin-top:24px;">
          <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:13px;color:${MUTED};">Forward this to a friend who's better at points than you.</p>
          <p style="margin:0;font-family:${FONT_UI};font-size:11px;color:${MUTED};">crazy4points.com · <a href="${recipientEmail ? unsubscribeUrlFor(recipientEmail, origin) : `${origin}/unsubscribe`}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a></p>
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
