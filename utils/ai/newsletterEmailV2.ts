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
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot, ActiveOffers, OfferItem, ElevatedBonusItem, TopExperienceItem, TopSweepstakesItem } from './newsletterSlots'
import { unsubscribeUrlFor } from '@/utils/email/unsubscribeToken'
import { CAPITAL_ONE_SHOPPING } from '@/lib/referrals'

const PURPLE = '#6B2D8F'
const GOLD = '#D4AF37'
const SOFT_BG = '#F8F5FB'
/** Soft-purple tint for the experiences band (redesign 2026-07-31). Deep enough
 *  to read as a distinct band in Gmail while white cards still pop on it. */
const TINT = '#E8DCF3'
const BODY = '#1A1A1A'
const MUTED = '#4A4A4A'
const BORDER = '#E6DEEE'
const PAGE_BG = '#f4eef8'
/** In-body link color. Brand purple (was editorial blue) so links read as
 *  intentional and on-brand instead of like default/visited hyperlinks. Big
 *  title links render as plain headlines instead (see renderTopExperiences). */
const LINK_COLOR = PURPLE

const FONT_DISPLAY = "'Playfair Display', Georgia, serif"
const FONT_BODY = "'Lato', 'Helvetica Neue', Arial, sans-serif"
const FONT_UI = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"

/**
 * Strip em/en dashes — the newsletter never uses them (Jill's hard rule), but
 * Sonnet keeps generating them. Applied at RENDER (in esc + bodyHtml) so no
 * AI-generated dash can slip through, no matter what a section field contains.
 * Em dash -> comma; en dash -> hyphen (handles ranges like Aug 30-Sep 13).
 */
function noDashes(s: string): string {
  return s.replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, '-')
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return noDashes(s)
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
  let html = noDashes(raw)

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

/**
 * Elevated section header: purple bold uppercase with a short gold underline
 * accent, replacing the flat gray eyebrows so each section stands out and
 * reads as branded. `title` may contain pre-escaped HTML entities.
 */
function sectionHeading(title: string, mb = '16px'): string {
  // Option B: a short gold rule above a Playfair serif title in brand purple.
  // Gold bar is its own small table so it stays 52px wide (not full width);
  // title sits on its own line below. Georgia is the serif fallback in clients
  // that don't load Playfair.
  return `
      <div style="margin:0 0 ${mb};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
          <td width="52" height="3" style="background:${GOLD};width:52px;height:3px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
        </tr></table>
        <div style="padding-top:10px;font-family:${FONT_DISPLAY};font-size:23px;line-height:1.25;font-weight:800;color:${PURPLE};">${title}</div>
      </div>`
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
  // Big Story headline uses ONLY its own title field. We do NOT fall back to the
  // subject (Jill, 2026-08-28) — that just repeated the subject line as a
  // redundant headline. No big_story_title = no headline, just the eyebrow + body.
  const headlineText = slots.big_story_title
  const headline = headlineText
    ? `<h1 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:24px;line-height:1.2;color:${BODY};font-weight:800;">${esc(headlineText)}</h1>`
    : ''
  // Soft purple wash on the Big Story so it reads as a deliberate featured
  // section (tier 2) — sits visually between plain white content and the
  // bordered cards (Sweet Spot, Game). No border so it doesn't compete
  // with Sweet Spot's gold accent.
  return `
    <tr><td style="padding:32px 30px 0;">
      <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:800;">The Big Story</p>
      ${headline}
      ${bodyHtml(slots.big_story_html)}
    </td></tr>`
}

function renderAlsoHappening(items: AlsoHappeningItem[], origin: string): string {
  if (!items || items.length === 0) return ''
  const cards = items
    .map((item) => {
      const cat = esc(item.category || 'Update')
      const href = item.link_url
        ? (item.link_url.startsWith('http') ? item.link_url : `${origin}${item.link_url}`)
        : null
      const link = href
        ? `<p style="margin:0;font-family:${FONT_UI};font-size:13px;font-weight:600;"><a href="${esc(href)}" style="color:${LINK_COLOR};text-decoration:underline;">Details →</a></p>`
        : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;border:1px solid ${BORDER};border-radius:12px;background:#fff;">
          <tr><td style="padding:17px 19px;">
            <p style="margin:0 0 5px;font-family:${FONT_UI};font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};font-weight:800;">${cat}</p>
            <h3 style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:17px;line-height:1.3;color:${BODY};font-weight:700;">${esc(item.headline)}</h3>
            <p style="margin:0 0 ${link ? '10px' : '0'};font-family:${FONT_BODY};font-size:14px;line-height:1.55;color:${BODY};">${esc(item.blurb)}</p>
            ${link}
          </td></tr>
        </table>`
    })
    .join('')
  return `
    <tr><td style="padding:38px 30px 0;">
      ${sectionHeading('Also Happening', '14px')}
      ${cards}
    </td></tr>`
}

// Split a normalized headline into [programLead, rest] so the renderer can
// bold the program. The natural boundary is the first ":" or "→" (program/
// product before it, offer detail after); fall back to the first word for
// titles with no delimiter (e.g. "Amex Membership Rewards to ...").
function splitHeadline(h: string): [string, string] {
  const c = h.indexOf(':')
  const a = h.indexOf('→') // →
  // Prefer the colon so a "Chase → IHG One Rewards: 70% bonus" headline bolds
  // the whole program pair (up to the colon), not just "Chase". Fall back to the
  // arrow when there's no colon.
  const idx = c > 0 ? c : a > 0 ? a : -1
  if (idx > 0) return [h.slice(0, idx), h.slice(idx)]
  const sp = h.indexOf(' ')
  if (sp > 0) return [h.slice(0, sp), h.slice(sp)]
  return [h, '']
}

const MONTHS_RE = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*'
/** Strip a trailing deadline clause from an offer name (the pill already shows
 *  it): "... Through August 22", "... (Book by July 31)", "on August 1 Only",
 *  ", Book by August 3". Leaves a bare month with no day ("for August") alone. */
function stripTrailingDate(s: string): string {
  return (s || '')
    .replace(new RegExp(`\\s*\\((?:book|register|valid|apply)[^)]*\\)\\s*$`, 'i'), '')
    .replace(
      new RegExp(
        `\\s*,?\\s*(?:through|thru|ends?|book by|register by|apply by|valid through|expires?|by|on)\\s+${MONTHS_RE}\\.?\\s+\\d{1,2}(?:\\s+only)?\\.?\\s*$`,
        'i',
      ),
      '',
    )
    .replace(/[\s,:-]+$/, '')
    .trim()
}

/** Shared gold "deadline" pill so every act-by date reads the same across the
 *  newsletter (Live Offers + experiences). */
function goldPill(text: string): string {
  return `<span style="display:inline-block;background:#FBF3D9;color:#7A5B00;font-family:${FONT_UI};font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;white-space:nowrap;">${esc(text)}</span>`
}

const DEADLINE_MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
/** Sort key from a human deadline like "Ends Aug 31" → month*100+day, so offers
 *  render soonest-first (Aug before Sep). Undated / unparseable sort last. (Year
 *  isn't in the string; near-term offers never straddle a year boundary here.) */
function deadlineSortKey(deadline: string | null | undefined): number {
  if (!deadline) return Number.POSITIVE_INFINITY
  const m = deadline.toLowerCase().match(/([a-z]{3})\s+(\d{1,2})/)
  if (!m) return Number.POSITIVE_INFINITY
  const mi = DEADLINE_MONTHS.indexOf(m[1])
  if (mi < 0) return Number.POSITIVE_INFINITY
  return mi * 100 + parseInt(m[2], 10)
}

function renderOfferBucket(label: string, items: OfferItem[], origin: string, accent: string): string {
  if (!items || items.length === 0) return ''
  // Dedupe within a bucket by headline (defensive against the same offer being
  // pulled twice).
  const seen = new Set<string>()
  const unique = items
    .filter((it) => {
      const key = (it.headline ?? '').trim().toLowerCase()
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    // Soonest deadline first, so Aug offers group ahead of Sep (Jill's rule).
    .sort((a, b) => deadlineSortKey(a.deadline) - deadlineSortKey(b.deadline))
  // Each offer is its own bordered card with a colored top strip (accent =
  // purple for transfers, gold for promos) so offers read as distinct, not a
  // wall of same-looking lines. The program name is bold purple; the deadline
  // sits on its own line beneath as a left-aligned gold pill (no more mid-line
  // wrapping). Kept compact (no blurb) so the email stays under Gmail's ~102KB
  // clip threshold and later sections (Jill's Take) don't get cut.
  const cards = unique
    .map((it) => {
      const href = it.link_url
        ? (it.link_url.startsWith('http') ? it.link_url : `${origin}${it.link_url}`)
        : ''
      // Names already embed the deadline ("... Through August 22"); the pill
      // repeats it, so strip the trailing date clause from the display name.
      const name = stripTrailingDate(it.headline)
      const [lead, rest] = splitHeadline(name)
      const linkInner = `<strong style="color:${PURPLE};font-weight:800;">${esc(lead)}</strong><span style="color:${BODY};font-weight:400;">${esc(rest)}</span>`
      const headline = href
        ? `<a href="${esc(href)}" style="text-decoration:none;">${linkInner}</a>`
        : linkInner
      const footer = it.deadline ? `<p style="margin:10px 0 0;">${goldPill(it.deadline)}</p>` : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;overflow:hidden;">
          <tr><td style="height:5px;line-height:5px;font-size:0;background:${accent};">&nbsp;</td></tr>
          <tr><td style="padding:13px 16px;">
            <p style="margin:0;font-family:${FONT_BODY};font-size:14px;line-height:1.4;color:${BODY};">${headline}</p>
            ${footer}
          </td></tr>
        </table>`
    })
    .join('')
  return `
    <p style="margin:0 0 10px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};font-weight:700;">${esc(label)}</p>
    ${cards}
    <div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>`
}

function renderActiveOffers(offers: ActiveOffers | null, origin: string): string {
  if (!offers) return ''
  const buckets =
    renderOfferBucket('Transfer bonuses', offers.transfer_bonuses ?? [], origin, PURPLE) +
    renderOfferBucket('Other Promos & Experiences', offers.earning_promos ?? [], origin, GOLD) +
    renderOfferBucket('Points purchase bonuses', offers.purchase_bonuses ?? [], origin, GOLD)
  if (!buckets) return ''
  return `
    <tr><td style="padding:36px 30px 0;">
      ${sectionHeading('Live Offers', '14px')}
      ${buckets}
    </td></tr>`
}

/**
 * Per-card brand accent + logo domain for the elevated-bonus cards, so each
 * reads in its own colors (Delta red, Chase blue, ...) with the brand's mark,
 * echoing the site's CardFace treatment. Co-brand airline/hotel keywords are
 * checked BEFORE the issuer so a Delta Amex card reads Delta red, not Amex blue
 * (the site colors those by issuer; here Jill wants the airline/hotel brand).
 * Logos use the same Google-favicon marks as the site (ISSUER logos there).
 */
// Logos are self-hosted PNGs under /public/brand-logos (same favicon marks the
// site uses), so they render reliably in email instead of depending on an
// external favicon service.
const ELEVATED_BRANDS: { re: RegExp; color: string; logo: string }[] = [
  { re: /delta/i, color: '#E01933', logo: 'delta' },
  { re: /wyndham/i, color: '#00519E', logo: 'wyndham' },
  { re: /hyatt/i, color: '#00558C', logo: 'hyatt' },
  { re: /aadvantage|american airlines/i, color: '#0078D2', logo: 'aa' },
  { re: /atmos|alaska/i, color: '#01426A', logo: 'alaska' },
  { re: /marriott|bonvoy/i, color: '#8A253B', logo: 'marriott' },
  { re: /hilton|honors/i, color: '#104C97', logo: 'hilton' },
  { re: /\bihg\b|one rewards/i, color: '#6B2D8F', logo: 'ihg' },
  { re: /united/i, color: '#0033A0', logo: 'united' },
  // Issuer fallbacks (bank cards without a co-brand travel program).
  { re: /chase/i, color: '#1554B0', logo: 'chase' },
  { re: /american express|amex/i, color: '#016FD0', logo: 'amex' },
  { re: /citi/i, color: '#0A4EA2', logo: 'citi' },
  { re: /capital one/i, color: '#C8102E', logo: 'capitalone' },
  { re: /barclay/i, color: '#0075C9', logo: 'barclays' },
]
function elevatedBrand(cardName: string): { color: string; logo: string | null } {
  for (const b of ELEVATED_BRANDS) if (b.re.test(cardName)) return { color: b.color, logo: b.logo }
  return { color: PURPLE, logo: null }
}

function renderElevatedBonuses(items: ElevatedBonusItem[] | null, origin: string): string {
  if (!items || items.length === 0) return ''
  const fmt = (n: number) => n.toLocaleString('en-US')
  const cards = items
    .map((it) => {
      const url = `${origin}${it.link_url}`
      const brand = elevatedBrand(it.card_name)
      // Cash-back cards store a USD currency (USD_cash_back / USD_cashback); render
      // those as "$1,000" with no currency suffix instead of "1,000 USD_cash_back".
      const isUsd = /^USD/i.test(it.currency)
      const fmtAmt = (n: number) => (isUsd ? `$${fmt(n)}` : fmt(n))
      const newAmt = `${it.is_tiered ? 'Up to ' : ''}${fmtAmt(it.current_amount)}`
      const currencySuffix = isUsd ? '' : ` ${esc(it.currency)}`
      const spend = it.spend_required_usd
        ? `after $${fmt(it.spend_required_usd)}${it.spend_window_label ? ` in ${esc(it.spend_window_label)}` : ''}`
        : ''
      const deadlinePill = it.deadline ? `${goldPill(it.deadline)}` : ''
      // Brand logo chip on a white tile (top-right), self-hosted so it renders in email.
      const imgBase = origin.replace('https://crazy4points.com', 'https://www.crazy4points.com')
      const logo = brand.logo
        ? `<td valign="top" align="right" width="34" style="width:34px;"><span style="display:inline-block;padding:3px;border-radius:5px;background:#ffffff;border:1px solid ${BORDER};line-height:0;"><img src="${imgBase}/brand-logos/${brand.logo}.png" alt="" width="24" height="24" style="display:block;width:24px;height:24px;border:0;border-radius:3px;" /></span></td>`
        : ''
      // The value line: the usual (baseline) offer struck through in grey, then the
      // elevated offer in the brand color so the jump reads at a glance.
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;overflow:hidden;">
          <tr><td style="height:5px;line-height:5px;font-size:0;background:${brand.color};">&nbsp;</td></tr>
          <tr><td style="padding:14px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
              <td valign="top" style="padding-right:10px;">
                <a href="${url}" style="font-family:${FONT_DISPLAY};font-size:16px;font-weight:800;color:${PURPLE};text-decoration:none;">${esc(it.card_name)}</a>
              </td>
              ${logo}
            </tr></table>
            <p style="margin:9px 0 0;font-family:${FONT_BODY};font-size:14px;line-height:1.4;color:${BODY};">
              <span style="color:${MUTED};text-decoration:line-through;font-weight:600;">${esc(fmtAmt(it.baseline_amount))}</span>
              <span style="color:${MUTED};">&nbsp;&rarr;&nbsp;</span>
              <strong style="color:${brand.color};font-weight:800;font-size:16px;">${esc(newAmt)}</strong><span style="color:${BODY};font-weight:700;">${currencySuffix}</span>
            </p>
            ${spend ? `<p style="margin:4px 0 0;font-family:${FONT_BODY};font-size:12.5px;line-height:1.4;color:${MUTED};">${spend}</p>` : ''}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
              <td valign="middle" style="padding-top:11px;">${deadlinePill}</td>
              <td valign="middle" align="right" style="padding-top:11px;"><a href="${url}" style="font-family:${FONT_UI};font-size:12px;font-weight:700;color:${brand.color};text-decoration:none;">Learn more &rarr;</a></td>
            </tr></table>
          </td></tr>
        </table>`
    })
    .join('')
  return `
    <tr><td style="padding:38px 30px 6px;">
      ${sectionHeading('Elevated Welcome Bonuses', '14px')}
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};">Welcome offers running above their usual level right now. Grab one while it is elevated.</p>
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
          <strong style="color:${PURPLE};">${esc(u.name)}</strong>${u.why ? `. ${esc(u.why)}` : ''}
        </li>`,
    )
    .join('')
  // Pass through bodyHtml so the explainer supports admin-pasted HTML
  // (e.g. <strong>, <ul>, <em>) AND auto-strips stale "What this means
  // for you" header paragraphs. Falls back to paragraph-wrapping plain
  // text for legacy entries.
  const explainer = sp.mechanic_explainer ? bodyHtml(sp.mechanic_explainer) : ''
  return `
    <tr><td style="padding:36px 30px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid ${GOLD};border-radius:12px;background:${SOFT_BG};">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 12px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Sweet Spot of the Week</p>
          <h2 style="margin:0 0 10px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.3;color:${PURPLE};">${esc(sp.topic)}</h2>
          ${(sp as { takeaway?: string | null }).takeaway ? `<p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:15px;line-height:1.5;color:${BODY};font-weight:700;">${esc((sp as { takeaway?: string }).takeaway)}</p>` : ''}
          ${uses ? `<p style="margin:0 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Good for</p><ul style="margin:0;padding:0 0 0 18px;">${uses}</ul>` : ''}
          ${explainer ? `<p style="margin:18px 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">How to earn the points</p>${explainer}` : ''}
        </td></tr>
      </table>
    </td></tr>`
}

function renderTopSweepstakes(items: TopSweepstakesItem[] | null, origin: string): string {
  if (!items || items.length === 0) return ''
  const cards = items
    .map((it) => {
      const href = it.link_url
        ? it.link_url.startsWith('http')
          ? it.link_url
          : `${origin}${it.link_url}`
        : `${origin}/sweepstakes`
      const title = `<a href="${esc(href)}" style="color:${BODY};text-decoration:none;">${esc(it.title)}</a>`
      const prize = it.prize
        ? `<p style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:1.5;color:${MUTED};">Win <strong style="color:${GOLD};font-weight:700;">${esc(it.prize)}</strong></p>`
        : ''
      const deadlinePill = it.deadline ? `<p style="margin:8px 0 0;">${goldPill(it.deadline)}</p>` : ''
      const cta = `<p style="margin:9px 0 0;"><a href="${esc(href)}" style="font-family:${FONT_UI};font-size:13px;font-weight:700;color:${LINK_COLOR};text-decoration:underline;">Enter now &rarr;</a></p>`
      const img = it.image_url
        ? `<tr><td style="padding:0;font-size:0;line-height:0;"><img src="${esc(it.image_url.startsWith('http') ? it.image_url : origin + it.image_url)}" alt="" width="100%" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;border:0;" /></td></tr>`
        : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 13px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;overflow:hidden;">
          ${img}
          <tr><td style="padding:17px 19px;">
            <p style="margin:0 0 4px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${PURPLE};font-weight:700;">${esc(it.program)}</p>
            <h3 style="margin:0 0 7px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.3;color:${BODY};font-weight:700;">${title}</h3>
            ${prize}
            ${deadlinePill}
            ${cta}
          </td></tr>
        </table>`
    })
    .join('')
  const seeAll = `${origin}/sweepstakes`
  return `
    <tr><td style="padding:40px 30px 34px;background:${TINT};">
      ${sectionHeading('Top Sweepstakes to Enter', '10px')}
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};">Free to enter, big on upside. These are live right now, so get your entries in before they close.</p>
      ${cards}
      <p style="margin:4px 0 0;"><a href="${esc(seeAll)}" style="font-family:${FONT_UI};font-size:13px;font-weight:700;color:${LINK_COLOR};text-decoration:underline;">See all live sweepstakes &rarr;</a></p>
    </td></tr>`
}

function renderTopExperiences(items: TopExperienceItem[] | null, origin: string): string {
  if (!items || items.length === 0) return ''
  const anyAuction = items.some((it) => it.is_auction)
  const cards = items
    .map((it) => {
      const href = it.link_url
        ? it.link_url.startsWith('http')
          ? it.link_url
          : `${origin}${it.link_url}`
        : ''
      const title = href
        ? `<a href="${esc(href)}" style="color:${BODY};text-decoration:none;">${esc(it.title)}</a>`
        : esc(it.title)
      // Meta = price + place/date only; the deadline moves to its own gold pill
      // below so it matches the Live Offers "act by" language.
      const meta = [
        it.points_label
          ? `<strong style="color:${GOLD};font-weight:700;">${esc(it.points_label)}</strong>`
          : '',
        it.event_label ? esc(it.event_label) : '',
      ]
        .filter(Boolean)
        .join(' &middot; ')
      const deadlinePill = it.deadline
        ? `<p style="margin:8px 0 0;">${goldPill(it.deadline)}</p>`
        : ''
      const blurb = it.blurb
        ? `<p style="margin:7px 0 0;font-family:${FONT_BODY};font-size:13px;line-height:1.5;color:${BODY};">${esc(it.blurb)}</p>`
        : ''
      const auction = it.is_auction
        ? `<p style="margin:6px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.4;color:${MUTED};font-style:italic;">Auction: you bid points and can be outbid, so the winning price can climb. Final sale.</p>`
        : ''
      const ctaLabel = /moments/i.test(it.program_label) ? 'View this Moment' : 'View details'
      const cta = href
        ? `<p style="margin:9px 0 0;"><a href="${esc(href)}" style="font-family:${FONT_UI};font-size:13px;font-weight:700;color:${LINK_COLOR};text-decoration:underline;">${ctaLabel} &rarr;</a></p>`
        : ''
      const tag = it.tag
        ? `<p style="margin:0 0 8px;"><span style="display:inline-block;background:${PURPLE};color:#ffffff;font-family:${FONT_UI};font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:999px;">${esc(it.tag)}</span></p>`
        : ''
      const secondary = it.secondary_link
        ? `<p style="margin:5px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.4;color:${MUTED};">${esc(it.secondary_link.label)} <a href="${esc(it.secondary_link.url.startsWith('http') ? it.secondary_link.url : origin + it.secondary_link.url)}" style="color:${LINK_COLOR};text-decoration:underline;font-weight:600;">here &rarr;</a></p>`
        : ''
      const img = it.image_url
        ? `<tr><td style="padding:0;font-size:0;line-height:0;"><img src="${esc(it.image_url)}" alt="" width="100%" style="display:block;width:100%;height:auto;border-radius:12px 12px 0 0;border:0;" /></td></tr>`
        : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 13px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;overflow:hidden;">
          ${img}
          <tr><td style="padding:17px 19px;">
            ${tag}
            <p style="margin:0 0 4px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${PURPLE};font-weight:700;">${esc(it.program_label)}</p>
            <h3 style="margin:0 0 7px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.3;color:${BODY};font-weight:700;">${title}</h3>
            <p style="margin:0;font-family:${FONT_BODY};font-size:13px;line-height:1.5;color:${MUTED};">${meta}</p>
            ${deadlinePill}
            ${blurb}
            ${auction}
            ${cta}
            ${secondary}
          </td></tr>
        </table>`
    })
    .join('')
  const intro = anyAuction
    ? 'Use your points and card perks for access you cannot otherwise book. Some are a fixed price; some are auctions where the winning bid can climb.'
    : 'Use your points and card perks for access you cannot otherwise book.'
  // Full-width soft-purple band so this section pops as the aspirational one.
  return `
    <tr><td style="padding:40px 30px 34px;background:${TINT};">
      ${sectionHeading('Experiences', '10px')}
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};">${intro}</p>
      ${cards}
      ${anyAuction ? `<p style="margin:14px 0 0;font-family:${FONT_BODY};font-size:12px;line-height:1.45;color:${MUTED};font-style:italic;">These are live auctions, so the bids shown were current when we sent this and change constantly. Check the listing for the latest before you plan around a price.</p>` : ''}
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
          <a href="${url}" style="color:${LINK_COLOR};text-decoration:underline;font-weight:600;">${esc(b.title)}</a>
          <span style="color:${MUTED};font-size:13px;margin-left:6px;">&middot; ${esc(endLabel)}</span>
        </p>`
    })
    .join('')
  return `
    <tr><td style="padding:32px 28px 0;">
      ${sectionHeading('Active transfer + point bonuses', '14px')}
      ${items}
    </td></tr>`
}

function renderJillsTake(html: string | null | undefined): string {
  if (!html) return ''
  // Contained "signed note" card: soft-purple background, gold border + gold
  // ribbon eyebrow, Playfair italic body left-aligned for readability with
  // even paragraph spacing. Reads as a boxed editorial closer.
  const raw = /<(p|em|strong)\b/i.test(html) ? html : `<p>${esc(html)}</p>`
  // Normalize paragraph spacing on pass-through <p> tags so multiple
  // paragraphs don't run together (email clients zero out default margins).
  const inner = raw.replace(/<p>/gi, '<p style="margin:0 0 14px;">')
  return `
    <tr><td style="padding:36px 30px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${SOFT_BG};border:1px solid ${GOLD};border-radius:12px;">
        <tr><td style="padding:24px 28px 22px;text-align:center;">
          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 18px;">
            <tr>
              <td style="width:0;height:0;border-top:18px solid transparent;border-bottom:18px solid transparent;border-right:14px solid ${GOLD};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
              <td style="background:${GOLD};padding:0 26px;height:34px;font-family:${FONT_UI};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;font-weight:700;line-height:34px;white-space:nowrap;">Jill&#39;s Take</td>
              <td style="width:0;height:0;border-top:18px solid transparent;border-bottom:18px solid transparent;border-left:14px solid ${GOLD};font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
            </tr>
          </table>
          <div style="font-family:${FONT_DISPLAY};font-size:17px;line-height:1.6;color:${BODY};font-style:italic;text-align:left;">${inner}</div>
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

// Recurring "Editor's tip" for Capital One Shopping (a referral link). Gated on
// the week so it appears roughly every other weekly issue — a nudge, not a nag.
function renderCapOneTip(weekOf: string): string {
  const days = Math.floor(Date.parse(`${weekOf}T00:00:00Z`) / 86400000)
  if (!Number.isFinite(days) || Math.floor(days / 7) % 2 !== 0) return ''
  return `
        <tr><td style="padding:18px 28px;background:#FBF4DD;border-top:1px solid ${BORDER};">
          <p style="margin:0 0 4px;font-family:${FONT_UI};font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:${GOLD};">Editor's tip</p>
          <p style="margin:0 0 6px;font-family:${FONT_DISPLAY};font-size:16px;font-weight:700;color:${PURPLE};">Save on everyday shopping</p>
          <p style="margin:0 0 12px;font-family:${FONT_UI};font-size:13px;color:${BODY};line-height:1.5;">We use ${CAPITAL_ONE_SHOPPING.name}, a free tool that finds coupon codes and compares prices while you check out online.</p>
          <a href="${CAPITAL_ONE_SHOPPING.url}" style="display:inline-block;font-family:${FONT_UI};font-size:13px;font-weight:700;color:#ffffff;background:${PURPLE};text-decoration:none;padding:9px 18px;border-radius:6px;">Try it free &rarr;</a>
          <p style="margin:10px 0 0;font-family:${FONT_UI};font-size:10px;color:${MUTED};font-style:italic;">${CAPITAL_ONE_SHOPPING.disclosure}</p>
        </td></tr>`
}

/** A zero-height anchor row placed just before a section so the "In this issue"
 *  links can jump to it. Anchors are honored in Apple Mail / iOS Mail; Gmail
 *  ignores them, in which case the links still read as an elegant contents
 *  preview (progressive enhancement). */
function sectionAnchor(id: string): string {
  return `<tr><td style="font-size:0;line-height:0;height:0;padding:0;"><a name="${id}" id="${id}" style="display:block;height:0;line-height:0;font-size:0;"></a></td></tr>`
}

/** The "In this issue" contents strip — a wrapped row of soft-purple pills, one
 *  per present section, linked to its anchor. Hidden when fewer than 2 sections
 *  (a table of one is pointless). */
function renderTableOfContents(items: { id: string; label: string }[]): string {
  if (items.length < 2) return ''
  const pills = items
    .map(
      (s) =>
        `<a href="#${s.id}" style="display:inline-block;background:${SOFT_BG};border:1px solid ${BORDER};color:${PURPLE};font-family:${FONT_UI};font-size:11px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:6px 12px;border-radius:999px;margin:0 6px 8px 0;">${esc(s.label)}</a>`,
    )
    .join('')
  return `
        <tr><td style="padding:16px 30px 6px;background:#ffffff;">
          <p style="margin:0 0 10px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:800;">In this issue</p>
          ${pills}
        </td></tr>`
}

export function renderNewsletterV2Html({
  slots,
  weekOf,
  origin = 'https://crazy4points.com',
  isPreview = false,
  recipientEmail,
  currentBonuses,
}: RenderNewsletterV2Args): string {
  // Images load from the canonical www host directly so they never depend on
  // the apex->www 301 (some strict email clients skip redirected images).
  const imgBase = origin.replace('https://crazy4points.com', 'https://www.crazy4points.com')
  const logoUrl = `${imgBase}/crazy4points-logo.png`
  const subject = slots.subject || 'Crazy4Points Weekly'

  const previewBanner = isPreview
    ? `
    <tr><td style="padding:10px 24px;background:${GOLD};">
      <p style="margin:0;font-family:${FONT_UI};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BODY};text-align:center;">Preview: not sent to subscribers</p>
    </td></tr>`
    : ''

  // Hero kicker is unused in pass-5 hero (date-only). Kept in slots for
  // possible future use; just don't render it here.

  // Build every content section once, in render order, each with an anchor id +
  // TOC label. Empty sections drop out, so the "In this issue" strip and the
  // body stay in sync automatically.
  const allSections: { id: string; label: string; html: string }[] = [
    { id: 'big-story', label: 'Big Story', html: renderBigStory(slots, origin) },
    { id: 'sweet-spot', label: 'Sweet Spot', html: renderSweetSpot(slots.sweet_spot) },
    { id: 'experiences', label: 'Experiences', html: renderTopExperiences(slots.top_experiences, origin) },
    { id: 'sweepstakes', label: 'Sweepstakes', html: renderTopSweepstakes(slots.top_sweepstakes, origin) },
    { id: 'also-happening', label: 'Also Happening', html: renderAlsoHappening(slots.also_happening, origin) },
    { id: 'live-offers', label: 'Live Offers', html: renderActiveOffers(slots.active_offers, origin) },
    { id: 'elevated', label: 'Elevated Bonuses', html: renderElevatedBonuses(slots.elevated_bonuses, origin) },
    { id: 'game', label: 'Game', html: renderGame(slots.game, origin) },
    { id: 'jills-take', label: "Jill's Take", html: renderJillsTake(slots.jills_take_html) },
  ]
  const sections = allSections.filter((s) => s.html && s.html.trim())
  const tableOfContents = renderTableOfContents(sections.map((s) => ({ id: s.id, label: s.label })))
  const sectionsHtml = sections.map((s) => `${sectionAnchor(s.id)}${s.html}`).join('\n')

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

        <!-- Hero (design pass 5, banner image at top, then a clean white
             dateline strip with the date in Playfair italic, left-aligned.
             The italic serif echoes the banner's wordmark + script while
             the white bg gives the banner a deliberate stage instead of
             trying (and failing) to match its cream wash exactly. -->
        <tr><td style="background:#ffffff;text-align:center;font-size:0;line-height:0;">
          <img src="${imgBase}/newsletter-hero-banner.png" alt="Crazy4Points Newsletter" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:16px 30px 12px;background:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td align="right" style="font-family:${FONT_DISPLAY};font-style:italic;font-size:18px;font-weight:600;color:${PURPLE};letter-spacing:0.3px;">${esc(weekOf)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 30px;background:#ffffff;">
          <div style="height:1px;background:${BORDER};line-height:1px;font-size:0;">&nbsp;</div>
        </td></tr>

        ${tableOfContents}
        ${sectionsHtml}
        ${renderCapOneTip(weekOf)}

        <!-- Footer: social row, then disclaimer, then fine-print links. -->
        <tr><td style="padding:22px 28px 18px;border-top:1px solid ${BORDER};background:${SOFT_BG};text-align:center;">
          <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:11px;color:${MUTED};letter-spacing:0.6px;text-transform:uppercase;font-weight:600;">Follow us on social media</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 14px;">
            <tr>
              <td style="padding:0 8px;">
                <a href="https://www.facebook.com/profile.php?id=61589408162571" style="text-decoration:none;display:inline-block;">
                  <img src="${imgBase}/social/facebook.png" alt="Facebook" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;width:32px;height:32px;" />
                </a>
              </td>
              <td style="padding:0 8px;">
                <a href="https://www.instagram.com/crazy4points/" style="text-decoration:none;display:inline-block;">
                  <img src="${imgBase}/social/instagram.png" alt="Instagram" width="32" height="32" style="display:block;border:0;outline:none;text-decoration:none;width:32px;height:32px;" />
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0 auto 10px;max-width:480px;font-family:${FONT_UI};font-size:10px;color:${MUTED};line-height:1.55;font-style:italic;">Affiliate links may earn us a commission at no cost to you. Editorial picks are independent. Informational only. Verify all terms with the issuer.</p>
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
