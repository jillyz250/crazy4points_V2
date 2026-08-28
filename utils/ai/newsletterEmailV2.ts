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
  // Big Story headline uses its own title field, independent of the email
  // subject line. Falls back to the subject for older drafts that predate the
  // big_story_title field.
  const headlineText = slots.big_story_title || slots.subject
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
  const cands = [c, a].filter((i) => i > 0)
  const idx = cands.length ? Math.min(...cands) : -1
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
      // Names already embed the deadline ("... Through August 22"); the pill
      // repeats it, so strip the trailing date clause from the display name to
      // avoid redundancy and keep the line short.
      const name = stripTrailingDate(it.headline)
      const [lead, rest] = splitHeadline(name)
      const linkInner = `<strong style="font-weight:700;">${esc(lead)}</strong><span style="font-weight:400;">${esc(rest)}</span>`
      const headline = href
        ? `<a href="${esc(href)}" style="color:${LINK_COLOR};text-decoration:none;">${linkInner}</a>`
        : linkInner
      // Deadline as a gold pill, flowing INLINE after the name (no two-column
      // table — long names were overflowing and colliding with a right cell).
      const pill = it.deadline ? ` ${goldPill(it.deadline)}` : ''
      return `<p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:14px;line-height:1.55;color:${BODY};">${headline}${pill}</p>`
    })
    .join('')
  return `
    <p style="margin:0 0 5px;font-family:${FONT_UI};font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:${MUTED};font-weight:700;">${esc(label)}</p>
    ${rows}
    <div style="height:14px;line-height:14px;font-size:0;">&nbsp;</div>`
}

function renderActiveOffers(offers: ActiveOffers | null, origin: string): string {
  if (!offers) return ''
  const buckets =
    renderOfferBucket('Transfer bonuses', offers.transfer_bonuses ?? [], origin) +
    renderOfferBucket('Other Promos & Experiences', offers.earning_promos ?? [], origin) +
    renderOfferBucket('Points purchase bonuses', offers.purchase_bonuses ?? [], origin)
  if (!buckets) return ''
  return `
    <tr><td style="padding:36px 30px 0;">
      ${sectionHeading('Live Offers', '14px')}
      ${buckets}
    </td></tr>`
}

function renderElevatedBonuses(items: ElevatedBonusItem[] | null, origin: string): string {
  if (!items || items.length === 0) return ''
  const fmt = (n: number) => n.toLocaleString('en-US')
  const rows = items
    .map((it) => {
      const url = `${origin}${it.link_url}`
      // Cash-back cards store a USD currency (USD_cash_back / USD_cashback); render
      // those as "$1,000" with no currency suffix instead of "1,000 USD_cash_back".
      const isUsd = /^USD/i.test(it.currency)
      const fmtAmt = (n: number) => (isUsd ? `$${fmt(n)}` : fmt(n))
      const newAmt = `${it.is_tiered ? 'Up to ' : ''}${fmtAmt(it.current_amount)}`
      const currencySuffix = isUsd ? '' : ` ${it.currency}`
      const spend = it.spend_required_usd
        ? ` after $${fmt(it.spend_required_usd)}${it.spend_window_label ? ` in ${it.spend_window_label}` : ''}`
        : ''
      const deadline = it.deadline
        ? `<span style="color:${MUTED};"> &middot; ${esc(it.deadline)}</span>`
        : ''
      return `
        <div style="padding:11px 0;border-bottom:1px solid ${BORDER};">
          <a href="${url}" style="font-family:${FONT_BODY};font-size:15px;font-weight:700;color:${LINK_COLOR};text-decoration:none;">${esc(it.card_name)}</a>
          <div style="margin-top:3px;font-family:${FONT_BODY};font-size:13.5px;line-height:1.45;color:${BODY};">
            <strong style="color:${GOLD};">${esc(newAmt)}${esc(currencySuffix)}</strong>${esc(spend)}
            <span style="color:${MUTED};">(normally ${esc(fmtAmt(it.baseline_amount))})</span>${deadline}
          </div>
        </div>`
    })
    .join('')
  return `
    <tr><td style="padding:38px 30px 6px;">
      ${sectionHeading('Elevated Welcome Bonuses', '14px')}
      ${rows}
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
          <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Sweet Spot of the Week</p>
          <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.3;color:${PURPLE};">${esc(sp.topic)}</h2>
          ${explainer}
          ${uses ? `<p style="margin:18px 0 8px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">Good for</p><ul style="margin:0;padding:0 0 0 18px;">${uses}</ul>` : ''}
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
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 13px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;">
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
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 13px;border:1px solid ${BORDER};border-radius:12px;background:#ffffff;">
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
      ${sectionHeading('Beyond Flights &amp; Hotels', '10px')}
      <p style="margin:0 0 16px;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};">${intro}</p>
      ${cards}
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
            <td align="left" style="font-family:${FONT_DISPLAY};font-style:italic;font-size:18px;font-weight:600;color:${PURPLE};letter-spacing:0.3px;">${esc(weekOf)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 30px;background:#ffffff;">
          <div style="height:1px;background:${BORDER};line-height:1px;font-size:0;">&nbsp;</div>
        </td></tr>

        ${renderBigStory(slots, origin)}
        ${renderSweetSpot(slots.sweet_spot)}
        ${renderTopExperiences(slots.top_experiences, origin)}
        ${renderTopSweepstakes(slots.top_sweepstakes, origin)}
        ${renderAlsoHappening(slots.also_happening, origin)}
        ${renderActiveOffers(slots.active_offers, origin)}
        ${renderElevatedBonuses(slots.elevated_bonuses, origin)}
        ${renderGame(slots.game, origin)}
        ${renderJillsTake(slots.jills_take_html)}
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
