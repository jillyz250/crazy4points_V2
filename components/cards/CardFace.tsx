import type { CSSProperties } from 'react'

/**
 * A stylized mini credit-card visual in an issuer's brand colors — a gradient
 * face with a gold chip, a sheen, and the issuer logo. Shared by the program-page
 * "cards that earn into X" list and the Card Explorer so the card art reads the
 * same everywhere. No real card images exist yet (image_url is empty table-wide),
 * so this is the visual stand-in. Pass the two brand-gradient stops + the logo.
 */
export default function CardFace({
  from,
  to,
  logoUrl,
  width = 88,
  style,
}: {
  from: string
  to: string
  logoUrl?: string | null
  width?: number
  style?: CSSProperties
}) {
  const chip = Math.round(width * 0.16)
  const logo = Math.round(width * 0.15)
  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: `${width}px`,
        aspectRatio: '1.586',
        flexShrink: 0,
        borderRadius: `${Math.max(6, Math.round(width * 0.09))}px`,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        border: `1px solid ${from}33`,
        boxShadow: `0 7px 16px -4px ${to}73`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${Math.round(width * 0.1)}px`,
          left: `${Math.round(width * 0.09)}px`,
          width: `${chip}px`,
          height: `${Math.round(chip * 0.78)}px`,
          borderRadius: '2px',
          background: 'linear-gradient(135deg, #f4d77e, #c9a227)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 46%)' }} />
      {logoUrl ? (
        <span
          style={{
            position: 'absolute',
            right: `${Math.round(width * 0.07)}px`,
            bottom: `${Math.round(width * 0.06)}px`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.94)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" width={logo} height={logo} style={{ height: `${logo}px`, width: 'auto', objectFit: 'contain' }} />
        </span>
      ) : null}
    </div>
  )
}
