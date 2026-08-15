import type { ReactElement } from 'react'

/**
 * Shared branded share-card (Open Graph image) renderer + helpers, used by the
 * alert / program / experience opengraph-image routes so every shared link gets
 * the same Royal Glow card: program logo + a context badge, the headline in
 * Playfair, a gold rule, and the crazy4points footer.
 */
export const OG_SIZE = { width: 1200, height: 630 }

const PURPLE = '#6B2D8F'
const PURPLE_DEEP = '#48205F'
const GOLD = '#D4AF37'

// Inline an image URL as a data URI. The program logos are Google favicon URLs
// that 301-redirect; fetch(follow) + base64 renders far more reliably in Satori
// than a redirecting remote <img src>.
export async function toDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    return `data:${ct};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

// Playfair Display (brand display face) for the headline; graceful fallback to
// next/og's built-in font so the card always renders.
export async function loadPlayfair(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
    ).text()
    const url = css.match(/src:\s*url\((https:[^)]+\.(?:ttf|otf))\)/)?.[1] || css.match(/url\((https:[^)]+)\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}

export function renderShareCard(opts: {
  logo?: string | null
  badgeText: string
  headline: string
  footRight?: string
  hasFont: boolean
}): ReactElement {
  const { logo, badgeText, headline, footRight = 'Points & Miles', hasFont } = opts
  const headlineSize = headline.length > 80 ? 46 : headline.length > 52 ? 56 : 68
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: `linear-gradient(150deg, ${PURPLE} 0%, ${PURPLE_DEEP} 100%)`,
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={58} height={58} alt="" style={{ borderRadius: 12, background: '#fff', padding: 6 }} />
        )}
        <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 0.5, opacity: 0.92 }}>{badgeText || 'Crazy4Points'}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ width: 92, height: 6, background: GOLD, borderRadius: 3 }} />
        <div style={{ fontSize: headlineSize, fontWeight: 700, lineHeight: 1.08, maxWidth: 1000, fontFamily: hasFont ? 'Playfair' : undefined }}>
          {headline}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26 }}>
        <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>crazy4points.com</div>
        <div style={{ color: GOLD, fontWeight: 600 }}>{footRight}</div>
      </div>
    </div>
  )
}
