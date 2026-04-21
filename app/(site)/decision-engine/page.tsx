"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Destination = {
  title: string
  slug: string
  country: string | null
  continent: string | null
  vibe: string[] | null
  summary: string | null
  weatherByMonth?: Record<string, string> | null
  tripLength?: string[] | null
  whoIsGoing?: string[] | null
}

type Filters = {
  month: string | null
  continent: string | null
  vibe: string | null
  tripLength: string | null
  whoIsGoing: string | null
}

// ─── Filter constants (no emojis) ─────────────────────────────────────────────

const MONTHS = [
  { label: 'January',   value: 'jan' }, { label: 'February',  value: 'feb' },
  { label: 'March',     value: 'mar' }, { label: 'April',     value: 'apr' },
  { label: 'May',       value: 'may' }, { label: 'June',      value: 'jun' },
  { label: 'July',      value: 'jul' }, { label: 'August',    value: 'aug' },
  { label: 'September', value: 'sep' }, { label: 'October',   value: 'oct' },
  { label: 'November',  value: 'nov' }, { label: 'December',  value: 'dec' },
  { label: 'Surprise Me', value: 'surprise' },
]

const CONTINENTS = [
  { label: 'North America',   value: 'north_america'   },
  { label: 'Central America', value: 'central_america' },
  { label: 'South America',   value: 'south_america'   },
  { label: 'Caribbean',       value: 'caribbean'       },
  { label: 'Europe',          value: 'europe'          },
  { label: 'Asia',            value: 'asia'            },
  { label: 'Middle East',     value: 'middle_east'     },
  { label: 'Africa',          value: 'africa'          },
  { label: 'South Pacific',   value: 'south_pacific'   },
  { label: 'Surprise Me',     value: 'surprise'        },
]

const VIBES = [
  { label: 'Beach',       value: 'beach'     },
  { label: 'City',        value: 'city'      },
  { label: 'History',     value: 'history'   },
  { label: 'Nature',      value: 'nature'    },
  { label: 'Adventure',   value: 'adventure' },
  { label: 'Luxury',      value: 'luxury'    },
  { label: 'Family',      value: 'family'    },
  { label: 'Surprise Me', value: 'surprise'  },
]

const TRIP_LENGTHS = [
  { label: 'Short (2–4 days)',  value: 'short'    },
  { label: 'Medium (5–7 days)', value: 'medium'   },
  { label: 'Long (8+ days)',    value: 'long'     },
  { label: 'Surprise Me',       value: 'surprise' },
]

const WHO_GOING = [
  { label: 'Solo',        value: 'solo'     },
  { label: 'Couple',      value: 'couple'   },
  { label: 'Family',      value: 'family'   },
  { label: 'Group',       value: 'group'    },
  { label: 'Surprise Me', value: 'surprise' },
]

// Classic slot machine fruits shown during the spin
const FRUIT_SYMBOLS = ['🍒', '🍋', '🍇', '🍌', '🍎', '🍉', '🍊', '🍑', '⭐', '💎', '7️⃣']

function fitFontSize(text: string): number {
  const len = text.length
  if (len <= 8)  return 20
  if (len <= 11) return 17
  if (len <= 14) return 14
  if (len <= 18) return 12
  return 10
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveFilter(value: string | null, options: { value: string }[]): string | null {
  if (!value) return null
  if (value === 'surprise') {
    const real = options.filter(o => o.value !== 'surprise')
    return real[Math.floor(Math.random() * real.length)].value
  }
  return value
}

const CONTINENT_LABELS: Record<string, string> = {
  north_america: 'North America', central_america: 'Central America',
  south_america: 'South America', caribbean: 'Caribbean',
  europe: 'Europe', asia: 'Asia', middle_east: 'Middle East',
  africa: 'Africa', south_pacific: 'South Pacific',
}

const VIBE_LABELS: Record<string, string> = {
  beach: 'Beach', city: 'City', history: 'History', nature: 'Nature',
  adventure: 'Adventure', luxury: 'Luxury', family: 'Family',
}

const MONTH_ORDER = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const MONTH_SHORT: Record<string, string> = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr',
  may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug',
  sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
}
const WHO_LABELS: Record<string, string> = {
  solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group',
}
const TRIP_LABELS: Record<string, string> = {
  short: 'Short (2–4 days)', medium: 'Medium (5–7 days)', long: 'Long (8+ days)',
}

function getFilterSummary(filters: Filters): string {
  const parts: string[] = []
  const check = (v: string | null, opts: { label: string; value: string }[]) => {
    if (!v) return
    const m = opts.find(o => o.value === v)
    if (m) parts.push(m.label)
  }
  check(filters.month, MONTHS)
  check(filters.continent, CONTINENTS)
  check(filters.vibe, VIBES)
  check(filters.tripLength, TRIP_LENGTHS)
  check(filters.whoIsGoing, WHO_GOING)
  return parts.join(' · ')
}

// ─── Web Audio ────────────────────────────────────────────────────────────────

function playSpinSound(ctx: AudioContext): () => void {
  let active = true
  let t: ReturnType<typeof setTimeout>
  function tick() {
    if (!active) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 80 + Math.random() * 100
    gain.gain.setValueAtTime(0.07, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.04)
    t = setTimeout(tick, 55)
  }
  tick()
  return () => { active = false; clearTimeout(t) }
}

function playReelStop(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(190, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(44, ctx.currentTime + 0.18)
  gain.gain.setValueAtTime(0.38, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.22)
}

function playCelebrationSound(ctx: AudioContext) {
  // Ascending 6-note chime — bright and celebratory
  const notes = [523.25, 659.25, 783.99, 880, 1046.5, 1318.5]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    }, i * 115)
  })
}

// ─── Confetti pieces (deterministic, no Math.random) ─────────────────────────

const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  left: ((i * 13 + 4) % 88) + 5,
  size: 6 + (i % 4) * 2,
  color: ['#D4AF37', '#F5E170', '#C4A030', '#FFD700', '#8B3DAF', '#B060D0'][i % 6],
  round: i % 3 !== 0,
  delay: (i % 6) * 55,
}))

// ─── SlotReel ─────────────────────────────────────────────────────────────────

function SlotReel({
  spinning, stopping, stopIndex, finalValue, flashing, celebrating,
}: {
  spinning: boolean
  stopping: boolean
  stopIndex: number
  finalValue: string
  flashing: boolean
  celebrating: boolean
}) {
  const [display, setDisplay] = useState('?')
  const [phase, setPhase] = useState<'idle' | 'fast' | 'slow' | 'stopped'>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (spinning) {
      setPhase('fast')
      intervalRef.current = setInterval(() => {
        setDisplay(FRUIT_SYMBOLS[Math.floor(Math.random() * FRUIT_SYMBOLS.length)])
      }, 65)
    } else if (stopping) {
      const base = stopIndex * 330

      const slowTimer = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('slow')
        intervalRef.current = setInterval(() => {
          setDisplay(FRUIT_SYMBOLS[Math.floor(Math.random() * FRUIT_SYMBOLS.length)])
        }, 200)
      }, base)

      const stopTimer = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setDisplay(finalValue)
        setPhase('stopped')
      }, base + 380)

      return () => {
        clearTimeout(slowTimer)
        clearTimeout(stopTimer)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
    // else: not spinning, not stopping — preserve whatever's displayed
    // (either '?' on first load, or the winning destination after a spin)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, stopping, stopIndex, finalValue])

  const isActive = phase === 'fast' || phase === 'slow'
  const isStopped = phase === 'stopped'
  const isIdle = phase === 'idle'

  const stoppedGlow = '0 0 22px rgba(240,192,64,0.8), 0 0 8px rgba(240,192,64,0.45)'

  return (
    <div
      style={{
        flex: 1,
        height: '118px',
        background: 'linear-gradient(180deg, #0D001C 0%, #0A0014 50%, #0D001C 100%)',
        border: `1.5px solid ${flashing ? 'rgba(255,232,100,0.9)' : 'rgba(196,160,48,0.28)'}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: flashing
          ? '0 0 32px rgba(255,220,80,0.9), inset 0 0 22px rgba(212,175,55,0.2)'
          : isStopped
            ? `inset 0 0 16px rgba(10,0,20,0.6), 0 0 8px rgba(212,175,55,0.15)`
            : 'inset 0 0 20px rgba(10,0,20,0.7)',
        transition: 'box-shadow 0.3s ease, border-color 0.2s ease',
        animation: flashing ? 'reelThud 0.38s ease' : 'none',
        backgroundImage: `
          radial-gradient(rgba(212,175,55,0.07) 1px, transparent 1px),
          radial-gradient(rgba(120,50,200,0.09) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px, 17px 17px',
        backgroundPosition: '3px 3px, 9px 9px',
      }}
    >
      {/* Gold flash overlay */}
      {flashing && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'linear-gradient(135deg, rgba(255,238,100,0.45) 0%, rgba(212,175,55,0.22) 100%)',
          borderRadius: '4px', pointerEvents: 'none',
        }} />
      )}
      {/* Top/bottom fade to dark */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '22px', background: 'linear-gradient(to bottom, #0A0014, transparent)', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22px', background: 'linear-gradient(to top, #0A0014, transparent)', zIndex: 3, pointerEvents: 'none' }} />

      <span style={{
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: isIdle ? '40px' : isActive ? '34px' : `${fitFontSize(display)}px`,
        fontWeight: 700,
        color: isIdle ? '#D4AF37' : isStopped ? '#FFFFFF' : '#F0C040',
        letterSpacing: isStopped ? '0.04em' : isIdle ? '0.02em' : '0.01em',
        textAlign: 'center',
        padding: '0 8px',
        lineHeight: 1.2,
        transition: 'color 0.3s ease, font-size 0.2s ease',
        filter: phase === 'fast' ? 'blur(0.7px)' : 'none',
        zIndex: 4,
        position: 'relative',
        maxWidth: '100%',
        wordBreak: 'break-word',
        textShadow: isStopped
          ? '0 0 14px rgba(255,255,255,0.55), 0 0 4px rgba(212,175,55,0.35), 0 1px 2px rgba(0,0,0,0.5)'
          : 'none',
        animation: isIdle
          ? 'goldGlow 1.8s ease-in-out infinite'
          : (celebrating && isStopped ? 'textPop 0.5s ease' : 'none'),
      }}>
        {display}
      </span>
    </div>
  )
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: '999px',
        border: selected ? '1.5px solid #C4A030' : '1.5px solid #6B2D8F',
        background: selected ? '#D4AF37' : 'white',
        color: selected ? '#1A1A1A' : '#6B2D8F',
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  )
}

// ─── FilterRow ────────────────────────────────────────────────────────────────

function FilterRow({
  label, options, value, onChange,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#6B2D8F', marginBottom: '8px',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map(o => (
          <Pill
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── FilterModal ──────────────────────────────────────────────────────────────

function FilterModal({
  open, filters, setFilter, onDone, onClear,
}: {
  open: boolean
  filters: Filters
  setFilter: (k: keyof Filters, v: string | null) => void
  onDone: () => void
  onClear: () => void
}) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(18, 6, 36, 0.68)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onDone}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '18px',
          border: '1.5px solid #E6DEEE',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '28px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '22px', paddingBottom: '18px',
          borderBottom: '1px solid #F0EAF8',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display), "Playfair Display", serif',
              fontSize: '22px', fontWeight: 700, color: '#6B2D8F',
              margin: '0 0 5px 0',
            }}>
              Set Your Filters
            </h2>
            <p style={{
              fontFamily: 'var(--font-body), Lato, sans-serif',
              fontSize: '13px', color: '#6A5A8A', margin: 0,
            }}>
              All filters are optional — leave blank to spin freely.
            </p>
          </div>
          <button
            type="button"
            onClick={onDone}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '1px solid #E6DEEE', background: 'white',
              color: '#6B2D8F', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: '12px', fontFamily: 'system-ui',
              lineHeight: 1, fontWeight: 300,
            }}
          >
            ×
          </button>
        </div>

        <FilterRow label="Month"        options={MONTHS}       value={filters.month}       onChange={v => setFilter('month', v)}      />
        <FilterRow label="Continent"    options={CONTINENTS}   value={filters.continent}   onChange={v => setFilter('continent', v)}  />
        <FilterRow label="Vibe"         options={VIBES}        value={filters.vibe}        onChange={v => setFilter('vibe', v)}       />
        <FilterRow label="Trip Length"  options={TRIP_LENGTHS} value={filters.tripLength}  onChange={v => setFilter('tripLength', v)} />
        <FilterRow label="Who Is Going" options={WHO_GOING}    value={filters.whoIsGoing}  onChange={v => setFilter('whoIsGoing', v)} />

        {/* Footer */}
        <div style={{
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
          marginTop: '8px', paddingTop: '18px',
          borderTop: '1px solid #F0EAF8',
        }}>
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: '10px 22px', borderRadius: '999px',
              border: '1.5px solid #E6DEEE', background: 'white',
              color: '#6A5A8A', fontFamily: 'var(--font-ui)', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onDone}
            style={{
              padding: '10px 28px', borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #F5E170, #D4AF37)',
              color: '#1A0A2E', fontFamily: 'var(--font-ui)', fontSize: '12px',
              fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(212,175,55,0.45)',
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared badge helpers ─────────────────────────────────────────────────────

function GoldBadge({ label }: { label: string }) {
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '999px',
      background: 'linear-gradient(135deg, #F5E170, #D4AF37)',
      color: '#1A0A2E',
      fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function PurpleBadge({ label }: { label: string }) {
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '999px',
      background: '#F3EEF9', border: '1.5px solid #6B2D8F',
      color: '#6B2D8F',
      fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#9A7ACC', marginBottom: '8px',
      }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{children}</div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B0A0C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

// ─── WinnerCard ───────────────────────────────────────────────────────────────

function WinnerCard({ dest, visible }: { dest: Destination; visible: boolean }) {
  const greatMonths = MONTH_ORDER.filter(m => dest.weatherByMonth?.[m] === 'great')
  const goodMonths  = MONTH_ORDER.filter(m => dest.weatherByMonth?.[m] === 'good')
  const hasWeather  = greatMonths.length > 0 || goodMonths.length > 0

  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #E6DEEE',
      borderTop: '4px solid #D4AF37',
      borderRadius: '16px',
      padding: '28px 32px 24px',
      boxShadow: '0 6px 28px rgba(107,45,143,0.1)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      maxWidth: '780px',
      margin: '0 auto',
    }}>
      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#D4AF37', marginBottom: '10px',
      }}>
        Your Next Adventure
      </div>

      {/* Headline + subtitle */}
      <h2 style={{
        fontFamily: 'var(--font-display), "Playfair Display", serif',
        fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700,
        color: '#6B2D8F', margin: '0 0 6px 0', lineHeight: 1.15,
      }}>
        {dest.title}
      </h2>
      {(dest.country || dest.continent) && (
        <p style={{
          fontFamily: 'var(--font-body), Lato, sans-serif',
          fontSize: '14px', color: '#6A5A8A', margin: '0 0 18px 0', fontWeight: 500,
        }}>
          {[dest.country, dest.continent ? CONTINENT_LABELS[dest.continent] : null]
            .filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Summary */}
      {dest.summary && (
        <p style={{
          fontFamily: 'var(--font-body), Lato, sans-serif',
          fontSize: '15px', lineHeight: 1.75, color: '#2A1A3A',
          margin: '0 0 24px 0',
        }}>
          {dest.summary}
        </p>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #F0EAF8', marginBottom: '22px' }} />

      {/* Info grid — 2 cols on desktop, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {dest.vibe && dest.vibe.length > 0 && (
          <InfoSection label="The Vibe">
            {dest.vibe.map(v => <GoldBadge key={v} label={VIBE_LABELS[v] ?? v} />)}
          </InfoSection>
        )}

        {dest.whoIsGoing && dest.whoIsGoing.length > 0 && (
          <InfoSection label="Perfect For">
            {dest.whoIsGoing.map(w => <PurpleBadge key={w} label={WHO_LABELS[w] ?? w} />)}
          </InfoSection>
        )}

        {hasWeather && (
          <InfoSection label="Best Time to Visit">
            {greatMonths.map(m => <GoldBadge key={m} label={MONTH_SHORT[m]} />)}
            {goodMonths.map(m  => <PurpleBadge key={m} label={MONTH_SHORT[m]} />)}
          </InfoSection>
        )}

        {dest.tripLength && dest.tripLength.length > 0 && (
          <InfoSection label="Recommended Trip">
            {dest.tripLength.map(t => <PurpleBadge key={t} label={TRIP_LABELS[t] ?? t} />)}
          </InfoSection>
        )}
      </div>

      {/* View CTA */}
      {dest.slug && (
        <Link
          href={`/destinations/${dest.slug}`}
          style={{
            display: 'inline-block', padding: '11px 28px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #6B2D8F, #8B3DAF)',
            color: 'white', fontFamily: 'var(--font-ui)', fontSize: '12px',
            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            textDecoration: 'none',
            boxShadow: '0 3px 12px rgba(107,45,143,0.3)',
            marginBottom: '24px',
          }}
        >
          View Full Destination
        </Link>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #F0EAF8', margin: '4px 0 18px' }} />

      {/* Coming soon */}
      <div style={{ opacity: 0.6 }}>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#9A7ACC', marginBottom: '12px',
        }}>
          More Coming Soon
        </div>
        {['Hotel options + points costs', 'Best award redemptions', 'Current transfer bonuses'].map(item => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 0',
            borderBottom: '1px solid #F5F0FF',
          }}>
            <LockIcon />
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: '13px',
              color: '#6A5A8A', flex: 1,
            }}>
              {item}
            </span>
            <span style={{
              padding: '2px 9px', borderRadius: '999px',
              border: '1px solid #D4C8E8', color: '#9A8AAA',
              fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600,
            }}>
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AlternativeCard ──────────────────────────────────────────────────────────

function AlternativeCard({ dest, visible, index }: { dest: Destination; visible: boolean; index: number }) {
  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #E6DEEE',
      borderRadius: '12px',
      padding: '18px 20px',
      boxShadow: '0 2px 12px rgba(107,45,143,0.06)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease ${0.3 + index * 0.15}s, transform 0.5s ease ${0.3 + index * 0.15}s`,
      flex: '1 1 220px',
      maxWidth: '340px',
    }}>
      <h3 style={{
        fontFamily: 'var(--font-display), "Playfair Display", serif',
        fontSize: '17px', fontWeight: 700, color: '#6B2D8F',
        margin: '0 0 3px 0',
      }}>
        {dest.title}
      </h3>
      {(dest.country || dest.continent) && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '12px',
          color: '#6A5A8A', margin: '0 0 10px 0', fontWeight: 500,
        }}>
          {[dest.country, dest.continent ? CONTINENT_LABELS[dest.continent] : null]
            .filter(Boolean).join(' · ')}
        </p>
      )}
      {dest.vibe && dest.vibe.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
          {dest.vibe.map(v => (
            <span key={v} style={{
              padding: '3px 9px', borderRadius: '999px',
              background: '#F8F5FB', border: '1px solid #E6DEEE',
              fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600,
              color: '#6B2D8F',
            }}>
              {VIBE_LABELS[v] ?? v}
            </span>
          ))}
        </div>
      )}
      {dest.slug && (
        <Link
          href={`/destinations/${dest.slug}`}
          style={{
            fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700,
            color: '#6B2D8F', textDecoration: 'none',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}
        >
          View Destination
        </Link>
      )}
    </div>
  )
}

// ─── PullHandle ───────────────────────────────────────────────────────────────

function PullHandle({ pulled, onClick }: { pulled: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      aria-label="Pull to spin"
      style={{
        position: 'absolute', right: '-66px', top: '16px',
        width: '48px', cursor: 'pointer', userSelect: 'none', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      {/* Moving arm (sphere + bar) — pivots around bottom connector */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transformOrigin: 'bottom center',
        transform: pulled ? 'rotate(26deg)' : 'rotate(0deg)',
        transition: 'transform 0.24s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Large gold sphere at top */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 28%, #FFFBCC 0%, #F5E170 18%, #D4AF37 50%, #A07820 76%, #704A08 100%)',
          border: '2px solid #A07820',
          boxShadow: '0 5px 16px rgba(0,0,0,0.55), inset 0 1px 3px rgba(255,255,255,0.55), 0 0 10px rgba(212,175,55,0.3)',
          flexShrink: 0,
          marginBottom: '-2px',
        }} />
        {/* Gold bar */}
        <div style={{
          width: '11px', height: '92px',
          background: 'linear-gradient(90deg, #7A5010, #E8C030 32%, #F0CE48 50%, #D4AF37 68%, #7A5010)',
          borderRadius: '5.5px',
          boxShadow: '2px 0 8px rgba(0,0,0,0.4), inset 1px 0 2px rgba(255,245,150,0.25)',
          flexShrink: 0,
        }} />
      </div>
      {/* Bottom connector — fixed, attaches to machine */}
      <div style={{
        width: '26px', height: '20px',
        background: 'linear-gradient(90deg, #906010, #E0BC38, #906010)',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,240,140,0.25)',
        border: '1.5px solid #704808',
        borderTop: 'none',
        flexShrink: 0,
        marginTop: '-1px',
      }} />
    </div>
  )
}

// ─── Corner positions ─────────────────────────────────────────────────────────

const CORNER_LIGHTS = [
  { top: '14px', left: '14px' },
  { top: '14px', right: '14px' },
  { bottom: '14px', left: '14px' },
  { bottom: '14px', right: '14px' },
] as const

const RIVETS = [
  { left: '-8px', top: '30%' },
  { left: '-8px', top: '62%' },
  { right: '-8px', top: '30%' },
  { right: '-8px', top: '62%' },
] as const

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DecisionEnginePage() {
  const [filters, setFilters] = useState<Filters>({
    month: null, continent: null, vibe: null, tripLength: null, whoIsGoing: null,
  })
  const [spinning, setSpinning] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [handlePulled, setHandlePulled] = useState(false)
  const [reelValues, setReelValues] = useState(['?', '?', '?'])
  const [reelFlashing, setReelFlashing] = useState([false, false, false])
  const [celebrating, setCelebrating] = useState(false)
  const [results, setResults] = useState<Destination[]>([])
  const [cardsVisible, setCardsVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopSpinRef = useRef<(() => void) | null>(null)
  const busyRef = useRef(false)

  function getCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const setFilter = useCallback((key: keyof Filters, value: string | null) => {
    setFilters(f => ({ ...f, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ month: null, continent: null, vibe: null, tripLength: null, whoIsGoing: null })
  }, [])

  const handleSpin = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true

    setSpinning(true)
    setStopping(false)
    setCelebrating(false)
    setCardsVisible(false)
    setResults([])
    setReelValues(['?', '?', '?'])
    setReelFlashing([false, false, false])

    setHandlePulled(true)
    setTimeout(() => setHandlePulled(false), 480)

    const ctx = getCtx()
    stopSpinRef.current = playSpinSound(ctx)

    const resolved = {
      month:      resolveFilter(filters.month,      MONTHS),
      continent:  resolveFilter(filters.continent,  CONTINENTS),
      vibe:       resolveFilter(filters.vibe,       VIBES),
      tripLength: resolveFilter(filters.tripLength, TRIP_LENGTHS),
      whoIsGoing: resolveFilter(filters.whoIsGoing, WHO_GOING),
    }

    const [apiResult] = await Promise.all([
      fetch('/api/decision-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved),
      }).then(r => r.json()).catch(() => ({ destinations: [] })),
      new Promise(resolve => setTimeout(resolve, 2000)),
    ])

    const dests: Destination[] = apiResult.destinations ?? []
    while (dests.length < 3) {
      dests.push({ title: '—', slug: '', country: null, continent: null, vibe: null, summary: null })
    }

    // All 3 reels show the #1 result — one clear winner
    const winner = dests[0]
    setReelValues([winner.title, winner.title, winner.title])
    setSpinning(false)
    setStopping(true)

    // Reel i stops at i*330 + 380ms after stopping=true
    // i=0 → 380ms  i=1 → 710ms  i=2 → 1040ms  (660ms total span)
    ;[0, 1, 2].forEach(i => {
      const stopAt = i * 330 + 380

      setTimeout(() => {
        playReelStop(getCtx())
        setReelFlashing(prev => { const n = [...prev]; n[i] = true; return n })
      }, stopAt)

      setTimeout(() => {
        setReelFlashing(prev => { const n = [...prev]; n[i] = false; return n })
      }, stopAt + 420)
    })

    // Stop spin sound when first reel thuds
    setTimeout(() => stopSpinRef.current?.(), 380)

    // Celebration: starts when last reel stops (1040ms), lasts ~1.8s
    setTimeout(() => {
      playCelebrationSound(getCtx())
      setCelebrating(true)
    }, 1100)

    setTimeout(() => setCelebrating(false), 2900)

    // Slide up cards
    setTimeout(() => {
      setResults(dests)
      setCardsVisible(true)
    }, 1700)

    // Full reset
    setTimeout(() => {
      setStopping(false)
      busyRef.current = false
    }, 2200)
  }, [filters])

  const canSpin = !spinning && !stopping
  const activeCount = Object.values(filters).filter(Boolean).length
  const filterSummary = getFilterSummary(filters)

  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes reelThud {
          0%   { transform: scale(1) translateY(0); }
          28%  { transform: scale(1.03) translateY(-3px); }
          62%  { transform: scale(0.985) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes spinIdle {
          0%, 100% { box-shadow: 0 4px 22px rgba(212,175,55,0.42); }
          50%       { box-shadow: 0 6px 38px rgba(212,175,55,0.7), 0 0 0 9px rgba(212,175,55,0.1); }
        }
        @keyframes machinePulse {
          0%, 100% { opacity: 0.72; }
          50%       { opacity: 1; }
        }
        @keyframes goldGlow {
          0%, 100% { text-shadow: 0 0 18px rgba(240,192,64,0.75), 0 0 8px rgba(240,192,64,0.45), 0 2px 4px rgba(0,0,0,0.5); }
          50%       { text-shadow: 0 0 32px rgba(240,192,64,1.0), 0 0 18px rgba(240,192,64,0.7), 0 2px 4px rgba(0,0,0,0.5); }
        }
        @keyframes crownGlow {
          0%, 100% { text-shadow: 0 0 22px rgba(240,192,64,0.65), 0 0 8px rgba(240,192,64,0.35), 0 2px 5px rgba(0,0,0,0.55); }
          50%       { text-shadow: 0 0 38px rgba(240,192,64,0.95), 0 0 18px rgba(240,192,64,0.55), 0 2px 5px rgba(0,0,0,0.55); }
        }
        @keyframes lightBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.22; }
        }
        @keyframes textPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          75%  { opacity: 1; }
          100% { transform: translateY(220px) rotate(380deg); opacity: 0; }
        }
        @keyframes machineCelebFlash {
          0%   { opacity: 0; }
          25%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <main className="rg-major-section !pt-8" style={{ background: '#FAF9F6', minHeight: '100vh' }}>
        <div className="rg-container" style={{ maxWidth: '920px' }}>

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display), "Playfair Display", serif',
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700,
              color: '#6B2D8F', margin: '0 0 10px 0', lineHeight: 1.2,
            }}>
              Not sure where to go?
            </h1>
            <p style={{
              fontFamily: 'var(--font-body), Lato, sans-serif',
              fontSize: '16px', color: '#4A4A4A', margin: 0,
            }}>
              Let us help you decide. Set your filters and spin for your next adventure.
            </p>
          </div>

          {/* Filter trigger */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                padding: '10px 28px', borderRadius: '999px',
                border: activeCount > 0 ? 'none' : '2px solid #D4AF37',
                background: activeCount > 0
                  ? 'linear-gradient(135deg, #F5E170, #D4AF37)'
                  : 'white',
                color: activeCount > 0 ? '#1A0A2E' : '#6B2D8F',
                fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: activeCount > 0
                  ? '0 3px 14px rgba(212,175,55,0.5)'
                  : '0 2px 8px rgba(107,45,143,0.1)',
                transition: 'all 0.2s ease',
              }}
            >
              {activeCount > 0 ? `${activeCount} Filter${activeCount > 1 ? 's' : ''} Active — Edit` : 'Set Your Filters'}
            </button>

            {filterSummary && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: '#6A5A8A', marginTop: '10px', marginBottom: 0,
              }}>
                Filtering by: {filterSummary}
              </p>
            )}
          </div>

          {/* ── Machine ───────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', maxWidth: '740px', margin: '0 auto 56px' }}>

            {/* Purple glow backdrop */}
            <div style={{
              position: 'absolute', left: '8%', right: '8%', top: '15%', bottom: '-8px',
              background: 'radial-gradient(ellipse at 50% 45%, rgba(90,26,154,0.50) 0%, transparent 68%)',
              animation: 'machinePulse 5s ease-in-out infinite',
              pointerEvents: 'none', zIndex: 0,
              filter: 'blur(10px)',
            }} />

            {/* Machine body */}
            <div style={{
              position: 'relative', zIndex: 1,
              borderRadius: '26px 26px 12px 12px',
              background: `
                radial-gradient(ellipse at 18% 20%, rgba(130,65,210,0.20) 0%, transparent 44%),
                radial-gradient(ellipse at 82% 80%, rgba(65,10,130,0.28) 0%, transparent 44%),
                radial-gradient(rgba(255,255,255,0.038) 1px, transparent 1px),
                linear-gradient(175deg, #5A1A9A 0%, #3E0C72 25%, #3B0A6B 52%, #4C0E8C 78%, #3B0A6B 100%)
              `,
              backgroundSize: '100% 100%, 100% 100%, 20px 20px, 100% 100%',
              boxShadow: `
                0 0 0 2.5px #D4AF37,
                0 0 0 5px #F0C040,
                0 0 0 7.5px #B8960C,
                0 0 0 9px rgba(184,150,12,0.12)
              `,
              overflow: 'visible',
            }}>

              {/* Celebration overlay + confetti */}
              {celebrating && (
                <>
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 8,
                    borderRadius: '26px 26px 12px 12px',
                    background: 'rgba(212,175,55,0.18)',
                    animation: 'machineCelebFlash 0.7s ease forwards',
                    pointerEvents: 'none',
                  }} />
                  {CONFETTI_PIECES.map((c, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${c.left}%`, top: '0px',
                      width: `${c.size}px`, height: `${c.size}px`,
                      background: c.color,
                      borderRadius: c.round ? '50%' : '2px',
                      animation: `confettiFall 1.6s ease-in ${c.delay}ms forwards`,
                      pointerEvents: 'none', zIndex: 15,
                    }} />
                  ))}
                </>
              )}

              {/* ── Crown ── */}
              <div style={{
                borderRadius: '20px 20px 0 0',
                borderBottom: '2px solid rgba(212,175,55,0.42)',
                padding: '22px 36px 18px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 100%)',
                textAlign: 'center',
                position: 'relative',
              }}>
                {/* Top corner lights */}
                {([{ left: '20px', top: '20px' }, { right: '20px', top: '20px' }] as const).map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: i === 0 ? '#FFD700' : '#F0C040',
                    boxShadow: `0 0 9px ${i === 0 ? '#FFD700' : '#F0C040'}`,
                    animation: `lightBlink ${1.0 + i * 0.45}s ease-in-out infinite`,
                  }} />
                ))}

                {/* Light row under crown text */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '7px', marginBottom: '10px' }}>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#D4AF37' : '#C4A030',
                      boxShadow: '0 0 4px currentColor',
                      animation: `lightBlink ${0.7 + (i % 5) * 0.18}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>

                {/* CRAZY4POINTS title */}
                <div style={{
                  fontFamily: 'var(--font-display), "Playfair Display", serif',
                  fontSize: 'clamp(20px, 3.8vw, 30px)',
                  fontWeight: 700,
                  color: '#F0C040',
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  animation: 'crownGlow 3s ease-in-out infinite',
                  lineHeight: 1.1,
                  marginBottom: '6px',
                }}>
                  CRAZY4POINTS
                </div>
                {/* Tagline */}
                <div style={{
                  fontFamily: 'var(--font-display), "Playfair Display", serif',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: '#D4AF37',
                  opacity: 0.88,
                  textShadow: '0 0 12px rgba(212,175,55,0.5)',
                  letterSpacing: '0.03em',
                }}>
                  Stop wondering. Start going.
                </div>
              </div>

              {/* Gold separator bar */}
              <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, transparent 0%, #B8960C 12%, #D4AF37 30%, #F0C040 50%, #D4AF37 70%, #B8960C 88%, transparent 100%)',
              }} />

              {/* ── Reel section ── */}
              <div style={{ padding: '20px 26px 18px' }}>

                {/* Gold cap bar above window */}
                <div style={{
                  height: '9px',
                  background: 'linear-gradient(90deg, #7A5010, #C4A030 22%, #F0C040 50%, #C4A030 78%, #7A5010)',
                  borderRadius: '5px 5px 0 0',
                  boxShadow: '0 -1px 0 rgba(255,240,160,0.18), 0 0 14px rgba(212,175,55,0.5)',
                }} />

                {/* Reel window */}
                <div style={{
                  background: '#0A0014',
                  border: '3px solid #C4A030',
                  borderTop: 'none',
                  borderBottom: 'none',
                  padding: '14px 12px 16px',
                  position: 'relative',
                  backgroundImage: `
                    radial-gradient(rgba(212,175,55,0.065) 1px, transparent 1px),
                    radial-gradient(rgba(120,50,200,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '32px 32px, 19px 19px',
                  backgroundPosition: '0 0, 11px 11px',
                }}>
                  {/* Win line */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '12px', right: '12px',
                    height: '1px', background: 'rgba(212,175,55,0.18)',
                    transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1,
                  }} />

                  {/* Reel labels */}
                  <div style={{ display: 'flex', gap: '0', marginBottom: '8px' }}>
                    {['I', 'II', 'III'].map(r => (
                      <div key={r} style={{
                        flex: 1, textAlign: 'center',
                        fontFamily: 'var(--font-ui)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.16em', color: 'rgba(212,175,55,0.45)',
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>

                  {/* Reels with gold dividers */}
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {[0, 1, 2].flatMap(i => {
                      const items = [(
                        <SlotReel
                          key={`reel-${i}`}
                          spinning={spinning}
                          stopping={stopping}
                          stopIndex={i}
                          finalValue={reelValues[i]}
                          flashing={reelFlashing[i]}
                          celebrating={celebrating}
                        />
                      )]
                      if (i < 2) {
                        items.push(
                          <div key={`div-${i}`} style={{
                            width: '3px',
                            margin: '0 10px',
                            background: 'linear-gradient(180deg, rgba(196,160,48,0.12) 0%, #C4A030 25%, #D4AF37 50%, #C4A030 75%, rgba(196,160,48,0.12) 100%)',
                            borderRadius: '2px',
                            flexShrink: 0,
                            alignSelf: 'stretch',
                          }} />
                        )
                      }
                      return items
                    })}
                  </div>
                </div>

                {/* Gold cap bar below window */}
                <div style={{
                  height: '9px',
                  background: 'linear-gradient(90deg, #7A5010, #C4A030 22%, #F0C040 50%, #C4A030 78%, #7A5010)',
                  borderRadius: '0 0 5px 5px',
                  boxShadow: '0 4px 14px rgba(212,175,55,0.45)',
                }} />

              </div>{/* /reel section */}

              {/* ── SPIN button ── */}
              <div style={{ padding: '6px 26px 24px', display: 'flex', justifyContent: 'center' }}>
                {/* Purple oval ring */}
                <div style={{
                  padding: '5px',
                  borderRadius: '999px',
                  background: 'rgba(80,20,140,0.65)',
                  boxShadow: '0 0 20px rgba(80,20,140,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
                }}>
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={!canSpin}
                    style={{
                      padding: '15px 70px',
                      borderRadius: '999px',
                      border: 'none',
                      background: canSpin
                        ? 'linear-gradient(135deg, #F8EB80 0%, #E8C830 38%, #C9A227 65%, #D4AF37 100%)'
                        : 'linear-gradient(135deg, #555, #333)',
                      color: canSpin ? '#1A0A2E' : '#888',
                      fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                      fontSize: '20px', fontWeight: 900,
                      letterSpacing: '0.24em', textTransform: 'uppercase',
                      cursor: canSpin ? 'pointer' : 'not-allowed',
                      animation: canSpin ? 'spinIdle 2.8s ease-in-out infinite' : 'none',
                      boxShadow: canSpin
                        ? '0 4px 20px rgba(212,175,55,0.55), inset 0 1px 0 rgba(255,248,190,0.5)'
                        : 'none',
                      transition: 'background 0.2s ease, color 0.2s ease',
                    }}
                  >
                    {spinning || stopping ? 'SPINNING' : 'SPIN'}
                  </button>
                </div>
              </div>

              {/* Bottom corner lights */}
              {([{ left: '20px', bottom: '78px' }, { right: '20px', bottom: '78px' }] as const).map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos,
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: i === 0 ? '#D4AF37' : '#FFD700',
                  boxShadow: `0 0 8px ${i === 0 ? '#D4AF37' : '#FFD700'}`,
                  animation: `lightBlink ${1.7 + i * 0.55}s ease-in-out infinite`,
                  zIndex: 5,
                }} />
              ))}

            </div>{/* /machine body */}

            {/* ── Feet ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '0 16%',
              position: 'relative', zIndex: 1,
            }}>
              {[0, 1].map(i => (
                <div key={i} style={{
                  width: '84px', height: '22px',
                  background: 'linear-gradient(180deg, #C4A030 0%, #A87820 45%, #8A6010 100%)',
                  borderRadius: '0 0 14px 14px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,240,140,0.30)',
                  border: '1.5px solid #704808',
                  borderTop: 'none',
                }} />
              ))}
            </div>

            {/* Handle — desktop only */}
            <div className="hidden md:block">
              <PullHandle pulled={handlePulled} onClick={canSpin ? handleSpin : () => {}} />
            </div>

          </div>{/* /machine outer */}

          {/* Result cards */}
          {results.length > 0 && (
            <div style={{ marginBottom: '44px' }}>
              {/* Winner */}
              {results[0] && results[0].title !== '—' && (
                <WinnerCard dest={results[0]} visible={cardsVisible} />
              )}

              {/* Alternatives */}
              {results.filter((d, i) => i > 0 && d.title !== '—').length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: '#9A7ACC', textAlign: 'center', marginBottom: '20px',
                  }}>
                    Other Great Options
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
                    {results[1] && results[1].title !== '—' && (
                      <AlternativeCard dest={results[1]} visible={cardsVisible} index={0} />
                    )}
                    {results[2] && results[2].title !== '—' && (
                      <AlternativeCard dest={results[2]} visible={cardsVisible} index={1} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p style={{
            textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '11px',
            color: '#9A8AAA', marginBottom: '16px', lineHeight: 1.5,
          }}>
            This is a travel planning tool only. No purchase or prize is involved.
          </p>

        </div>
      </main>

      <FilterModal
        open={modalOpen}
        filters={filters}
        setFilter={setFilter}
        onDone={() => setModalOpen(false)}
        onClear={clearFilters}
      />
    </>
  )
}
