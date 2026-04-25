/**
 * Renders the weekly newsletter draft_json into branded HTML for Resend.
 * Royal Glow palette. ~600px, mobile-first, inline styles (most email clients
 * strip <style>).
 *
 * Phase 4 sections: The Headline · Quick Wins · The Play of the Week ·
 * Heads Up · On My Radar · Jill's Take. Reads new field names with legacy
 * (big_one / haul / sweet_spot) fallback so old drafts in the DB still render.
 */
import type {
  NewsletterDraft,
  NewsletterQuickWinItem,
  NewsletterHeadlineItem,
  NewsletterPlayOfTheWeek,
  NewsletterHeadsUpItem,
  NewsletterRadarItem,
} from './buildNewsletter'

const PURPLE = '#6B2D8F'
const GOLD = '#D4AF37'
const SOFT_BG = '#F8F5FB'
const BODY = '#1A1A1A'
const MUTED = '#4A4A4A'
const BORDER = '#E6DEEE'

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

function alertLink(origin: string, slug: string | null): string | null {
  if (!slug) return null
  return `${origin}/alerts/${encodeURIComponent(slug)}`
}

function renderQuickWins(items: NewsletterQuickWinItem[], origin: string): string {
  if (!items || items.length === 0) return ''
  const cards = items
    .map((item) => {
      const link = alertLink(origin, item.link_slug)
      const readMore = link
        ? `<p style="margin:12px 0 0;font-family:${FONT_UI};font-size:13px;font-weight:600;"><a href="${link}" style="color:${GOLD};text-decoration:none;">Read more →</a></p>`
        : ''
      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;border:1px solid ${BORDER};border-radius:12px;background:#fff;">
          <tr><td style="padding:20px 22px;">
            <h3 style="margin:0 0 8px;font-family:${FONT_DISPLAY};font-size:18px;line-height:1.3;color:${PURPLE};">${esc(item.headline)}</h3>
            <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${BODY};">${esc(item.blurb)}</p>
            ${readMore}
          </td></tr>
        </table>`
    })
    .join('')
  return `
    <tr><td style="padding:8px 0 4px;">
      <h2 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:22px;color:${PURPLE};">Quick Wins</h2>
      ${cards}
    </td></tr>`
}

function renderHeadline(big: NewsletterHeadlineItem | null | undefined, origin: string): string {
  if (!big) return ''
  const link = alertLink(origin, big.link_slug)
  const readMore = link
    ? `<p style="margin:16px 0 0;font-family:${FONT_UI};font-size:14px;font-weight:600;"><a href="${link}" style="color:${GOLD};text-decoration:none;">Read the full alert →</a></p>`
    : ''
  return `
    <tr><td style="padding:8px 0 24px;">
      <h2 style="margin:0 0 6px;font-family:${FONT_DISPLAY};font-size:24px;color:${PURPLE};">The Headline</h2>
      <h3 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:20px;line-height:1.3;color:${BODY};">${esc(big.headline)}</h3>
      <p style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${BODY};">${esc(big.why_it_matters)}</p>
      <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${BODY};"><strong style="color:${PURPLE};">What to do:</strong> ${esc(big.what_to_do)}</p>
      ${readMore}
    </td></tr>`
}

function renderPlay(sp: NewsletterPlayOfTheWeek | null | undefined): string {
  if (!sp) return ''
  const uses = (sp.best_uses ?? [])
    .map(
      (u) => `
      <li style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${BODY};">
        <strong style="color:${PURPLE};">${esc(u.name)}</strong> — ${esc(u.why)}
      </li>`,
    )
    .join('')
  return `
    <tr><td style="padding:8px 0 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid ${GOLD};border-radius:12px;background:${SOFT_BG};">
        <tr><td style="padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT_UI};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};font-weight:700;">The Play of the Week</p>
          <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:22px;line-height:1.3;color:${PURPLE};">${esc(sp.topic)}</h2>
          <p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${BODY};">${esc(sp.mechanic_explainer)}</p>
          ${uses ? `<ul style="margin:0;padding:0 0 0 18px;">${uses}</ul>` : ''}
        </td></tr>
      </table>
    </td></tr>`
}

function renderHeadsUp(items: NewsletterHeadsUpItem[], origin: string): string {
  if (!items || items.length === 0) return ''
  const rows = items
    .map((item) => {
      const link = alertLink(origin, item.link_slug)
      const linkBit = link
        ? ` <a href="${link}" style="color:${PURPLE};font-weight:600;text-decoration:none;">→ details</a>`
        : ''
      return `
        <li style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${BODY};">
          <strong style="color:${PURPLE};">${esc(item.headline)}</strong> — ${esc(item.what)}
          <span style="display:block;font-family:${FONT_UI};font-size:12px;color:${MUTED};margin-top:2px;">${esc(item.when)}${linkBit}</span>
        </li>`
    })
    .join('')
  return `
    <tr><td style="padding:8px 0 24px;">
      <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:22px;color:${PURPLE};">Heads Up</h2>
      <ul style="margin:0;padding:0 0 0 18px;">${rows}</ul>
    </td></tr>`
}

function renderRadar(items: NewsletterRadarItem[]): string {
  if (!items || items.length === 0) return ''
  const rows = items
    .map((item) => {
      const linkBit = item.source_url
        ? ` <a href="${esc(item.source_url)}" style="color:${MUTED};font-size:12px;text-decoration:underline;">source</a>`
        : ''
      return `
        <li style="margin:0 0 10px;font-family:${FONT_BODY};font-size:15px;line-height:1.55;color:${BODY};">
          <strong style="color:${PURPLE};">${esc(item.headline)}</strong> — ${esc(item.why)}${linkBit}
        </li>`
    })
    .join('')
  return `
    <tr><td style="padding:8px 0 24px;">
      <h2 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:22px;color:${PURPLE};">On My Radar</h2>
      <ul style="margin:0;padding:0 0 0 18px;">${rows}</ul>
    </td></tr>`
}

export interface RenderNewsletterArgs {
  draft: NewsletterDraft
  subject: string
  weekOf: string
  origin?: string
  comicUrl?: string | null
  isPreview?: boolean
}

export function renderNewsletterHtml({
  draft,
  subject,
  weekOf,
  origin = 'https://crazy4points.com',
  comicUrl,
  isPreview = false,
}: RenderNewsletterArgs): string {
  const logoUrl = `${origin}/crazy4points-logo.png`

  // New field names with legacy fallback so old drafts in the DB still render.
  const headline = draft.the_headline ?? draft.big_one ?? null
  const quickWins = draft.quick_wins ?? draft.haul ?? []
  const play = draft.play_of_the_week ?? draft.sweet_spot ?? null
  const headsUp = draft.heads_up ?? []
  const onMyRadar = draft.on_my_radar ?? []

  const previewBanner = isPreview
    ? `
    <tr><td style="padding:12px 24px;background:${GOLD};">
      <p style="margin:0;font-family:${FONT_UI};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BODY};text-align:center;">Preview — not sent to subscribers</p>
    </td></tr>`
    : ''

  const comicBlock = comicUrl
    ? `
    <tr><td style="padding:0 0 24px;text-align:center;">
      <img src="${esc(comicUrl)}" alt="Jill's weekly comic" width="560" style="display:block;max-width:100%;height:auto;margin:0 auto;border-radius:12px;" />
    </td></tr>`
    : ''

  const headlineHtml = renderHeadline(headline, origin)
  const quickWinsHtml = renderQuickWins(quickWins, origin)
  const playHtml = renderPlay(play)
  const headsUpHtml = renderHeadsUp(headsUp, origin)
  const radarHtml = renderRadar(onMyRadar)

  const jillsTake = draft.jills_take
    ? `
    <tr><td style="padding:8px 0 24px;">
      <h2 style="margin:0 0 10px;font-family:${FONT_DISPLAY};font-size:22px;color:${PURPLE};">Jill's Take</h2>
      <p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${BODY};font-style:italic;">${esc(draft.jills_take)}</p>
    </td></tr>`
    : ''

  // Preview header text (hidden in inbox preview pane). Use the_headline's
  // why_it_matters as the preview seed since opener is gone.
  const previewSeed = headline?.why_it_matters ?? draft.opener ?? ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4eef8;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${esc(previewSeed).slice(0, 120)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4eef8;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(26,26,26,0.06);">
        ${previewBanner}
        <tr><td style="padding:28px 24px 16px;background:${SOFT_BG};text-align:center;">
          <img src="${logoUrl}" alt="Crazy4Points" width="180" style="display:block;margin:0 auto;max-width:60%;height:auto;" />
          <p style="margin:12px 0 0;font-family:${FONT_UI};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">Week of ${esc(weekOf)}</p>
        </td></tr>
        ${comicBlock}
        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${headlineHtml}
            ${quickWinsHtml}
            ${playHtml}
            ${headsUpHtml}
            ${radarHtml}
            ${jillsTake}
          </table>
        </td></tr>
        <tr><td style="padding:24px 28px 32px;border-top:1px solid ${BORDER};background:${SOFT_BG};text-align:center;">
          <p style="margin:0 0 8px;font-family:${FONT_UI};font-size:13px;color:${MUTED};">Forwarded this? <a href="${origin}" style="color:${PURPLE};font-weight:600;text-decoration:none;">Subscribe for free</a></p>
          <p style="margin:0;font-family:${FONT_UI};font-size:11px;color:${MUTED};">crazy4points.com · <a href="${origin}/unsubscribe" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
