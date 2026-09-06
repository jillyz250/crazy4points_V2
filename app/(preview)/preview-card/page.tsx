import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Category card — framed (preview)', robots: { index: false } }

// Frame-on-the-outside category card (Jill, 2026-09-06): real gold picture frame
// around the OUTSIDE (metallic gradient + inner hairline), clean scene photo
// inside, and live HTML text (VIP eyebrow / serif title / tracked sub) so every
// card in the set is identical and the copy stays crisp + editable.
const PLUM = '#3E1A57'
const GOLD_FRAME = 'linear-gradient(135deg,#f3dd91 0%,#c9a13a 30%,#efcf6a 55%,#b8862a 80%,#e6c25c 100%)'

function FrameCard({
  scene, kicker, title, sub, width,
}: { scene: string; kicker: string; title: string; sub: string; width: number }) {
  return (
    <div
      style={{
        width,
        borderRadius: 22,
        padding: 9,                       // the frame "material" thickness
        background: GOLD_FRAME,
        boxShadow: '0 22px 50px -20px rgba(62,26,87,0.45), 0 2px 4px rgba(0,0,0,0.12)',
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 15,
          overflow: 'hidden',
          aspectRatio: '3 / 2',
          // thin inner gold hairline just inside the frame
          boxShadow: 'inset 0 0 0 1.5px rgba(160,120,30,0.55)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* brighten the left so text stays legible without a heavy overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,253,248,0.72) 0%, rgba(255,253,248,0.32) 42%, rgba(255,253,248,0) 68%)' }} />
        <div style={{ position: 'absolute', left: '9%', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, letterSpacing: '0.28em', color: PLUM }}>{kicker}</span>
            <span style={{ width: 30, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,#c9a13a,#e8c65e)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: width * 0.11, lineHeight: 1, color: PLUM }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, letterSpacing: '0.22em', color: '#5a5560', marginTop: 12 }}>{sub}</div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-background-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '56px 20px' }}>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8a7d95' }}>Frame on the outside · live HTML text</p>
      <FrameCard scene="/hero-preview/cards/scene-experiences.jpg" kicker="VIP" title="Experiences" sub="BOOK WITH POINTS" width={520} />
      <FrameCard scene="/hero-preview/cards/scene-experiences.jpg" kicker="VIP" title="Experiences" sub="BOOK WITH POINTS" width={340} />
    </div>
  )
}
