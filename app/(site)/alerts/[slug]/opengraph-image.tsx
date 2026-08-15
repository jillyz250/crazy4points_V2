import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertBySlug } from '@/utils/supabase/queries'

// Node runtime: we read Supabase with the service role to fetch the alert + its
// program logo. Next.js auto-injects the og:image meta from this file, so every
// shared alert link gets a branded card — no per-page wiring needed.
export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Crazy4Points alert'

const PURPLE = '#6B2D8F'
const PURPLE_DEEP = '#48205F'
const GOLD = '#D4AF37'

// Fetch an image URL and inline it as a data URI. The program logos are Google
// favicon URLs that 301-redirect; fetch (follow) + base64 is far more reliable
// inside Satori than handing it a redirecting remote <img src>.
async function toDataUri(url: string): Promise<string | null> {
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

// Playfair Display (the brand display face) for the headline. If the fetch fails
// we fall back to next/og's built-in font, so the card always renders.
async function loadPlayfair(): Promise<ArrayBuffer | null> {
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

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const alert = await getAlertBySlug(supabase, slug).catch(() => null)
  const title = alert?.title ?? 'Crazy4Points'

  // Program comes from the alert_programs junction (role 'primary'), not the
  // mirror's primary_program_id column, which isn't reliably synced.
  let programName = ''
  let logo: string | null = null
  const links = ((alert as unknown as { alert_programs?: unknown[] })?.alert_programs ?? []) as Array<{
    role?: string | null
    programs?: { name?: string | null; logo_url?: string | null } | null
  }>
  const prog = (links.find((l) => l.role === 'primary') ?? links[0])?.programs
  if (prog) {
    programName = (prog.name as string) ?? ''
    if (prog.logo_url) logo = await toDataUri(prog.logo_url as string)
  }

  const font = await loadPlayfair()
  const headlineSize = title.length > 80 ? 46 : title.length > 52 ? 56 : 68

  return new ImageResponse(
    (
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
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: 0.5, opacity: 0.92 }}>
            {programName || 'Crazy4Points'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ width: 92, height: 6, background: GOLD, borderRadius: 3 }} />
          <div
            style={{
              fontSize: headlineSize,
              fontWeight: 700,
              lineHeight: 1.08,
              maxWidth: 1000,
              fontFamily: font ? 'Playfair' : undefined,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26 }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>crazy4points.com</div>
          <div style={{ color: GOLD, fontWeight: 600 }}>Points &amp; Miles</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Playfair', data: font, style: 'normal', weight: 700 }] : [],
    },
  )
}
