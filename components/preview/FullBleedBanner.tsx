// The standard section banner (Jill, 2026-09-06): a full-page-width band with a
// thin gold rule on top and bottom only (no side borders). Two modes:
//   • image  — a photo scene (VIP Experiences, Flight Deals, …), cropped to a
//     short band, text baked into the art, anchored left so the copy stays visible.
//   • text   — a gold-edged nameplate band (gold rule + serif title + tracked sub)
//     for sections that don't have a photo scene yet.
// Must be placed OUTSIDE rg-container so it spans the full viewport width.

const GOLD_EDGE = {
  borderStyle: 'solid' as const,
  borderWidth: '2px 0',
  borderColor: 'transparent',
  borderImage: 'linear-gradient(90deg,#b8862a 0%,#efcf6a 45%,#c9a13a 70%,#e6c25c 100%) 1',
}

export default function FullBleedBanner(
  props:
    | { image: string; alt: string; title?: never; sub?: never }
    | { image?: never; alt?: never; title: string; sub: string },
) {
  const serif = 'var(--font-display)'
  if (props.image) {
    // height:auto = show the WHOLE band at its natural aspect, so the baked text
    // (which sits near the art's top/bottom edges) is never cropped at any width.
    return (
      <div style={GOLD_EDGE}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={props.image} alt={props.alt} className="block w-full" />
      </div>
    )
  }
  return (
    <div style={{ ...GOLD_EDGE, background: 'linear-gradient(180deg,#fdfbff,#f6eefc)' }}>
      <div className="flex flex-col items-center justify-center text-center" style={{ height: 'clamp(120px, 14vw, 190px)' }}>
        <span className="mb-3 h-[2px] w-8 rounded" style={{ background: 'linear-gradient(90deg,#c9a13a,#e8c65e)' }} />
        <div style={{ fontFamily: serif, color: '#3E1A57' }} className="text-3xl font-extrabold leading-none sm:text-4xl">{props.title}</div>
        <div className="mt-3 text-[0.8125rem] font-semibold tracking-[0.2em]" style={{ color: '#5a5560', fontFamily: 'var(--font-ui)' }}>{props.sub}</div>
      </div>
    </div>
  )
}
