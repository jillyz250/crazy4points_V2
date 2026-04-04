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

const REEL_NAMES = [
  'Paris', 'Tokyo', 'Bali', 'Cancun', 'Rome', 'Santorini', 'Maldives',
  'New York', 'Kyoto', 'Dubai', 'Barcelona', 'Maui', 'Sydney', 'Cape Town',
  'Lisbon', 'Phuket', 'Vienna', 'Havana', 'Nairobi', 'Istanbul',
  'Amsterdam', 'Tulum', 'Fiji', 'Prague', 'Buenos Aires', 'Marrakech',
  'Iceland', 'Patagonia', 'Amalfi', 'Colombo', 'Bora Bora', 'Queenstown',
]

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

function playWinSound(ctx: AudioContext) {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.55)
    }, i * 150)
  })
}

// ─── SlotReel ─────────────────────────────────────────────────────────────────

function SlotReel({
  spinning, stopping, stopIndex, finalValue, flashing,
}: {
  spinning: boolean
  stopping: boolean
  stopIndex: number
  finalValue: string
  flashing: boolean
}) {
  const [display, setDisplay] = useState('?')
  const [phase, setPhase] = useState<'idle' | 'fast' | 'slow' | 'stopped'>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (spinning) {
      setPhase('fast')
      intervalRef.current = setInterval(() => {
        setDisplay(REEL_NAMES[Math.floor(Math.random() * REEL_NAMES.length)])
      }, 65)
    } else if (stopping) {
      const base = stopIndex * 330

      const slowTimer = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setPhase('slow')
        intervalRef.current = setInterval(() => {
          setDisplay(REEL_NAMES[Math.floor(Math.random() * REEL_NAMES.length)])
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
    } else {
      setPhase('idle')
      setDisplay('?')
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, stopping, stopIndex, finalValue])

  const isActive = phase === 'fast' || phase === 'slow'
  const isStopped = phase === 'stopped'

  return (
    <div
      style={{
        flex: 1,
        height: '104px',
        background: '#0C0818',
        border: `2px solid ${flashing ? '#FFE87A' : '#C4A030'}`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: flashing
          ? '0 0 32px rgba(255,228,100,0.8), inset 0 0 24px rgba(212,175,55,0.35)'
          : isStopped
            ? 'inset 0 0 14px rgba(212,175,55,0.1), 0 0 8px rgba(212,175,55,0.12)'
            : 'inset 0 2px 14px rgba(0,0,0,0.65)',
        transition: 'box-shadow 0.3s ease, border-color 0.2s ease',
        animation: flashing ? 'reelThud 0.38s ease' : 'none',
      }}
    >
      {flashing && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'linear-gradient(135deg, rgba(255,238,130,0.5) 0%, rgba(212,175,55,0.25) 100%)',
          borderRadius: '6px', pointerEvents: 'none',
        }} />
      )}
      {/* Scan lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
        zIndex: 2,
      }} />
      {/* Top/bottom fade */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: 'linear-gradient(to bottom, #0C0818, transparent)', zIndex: 3, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: 'linear-gradient(to top, #0C0818, transparent)', zIndex: 3, pointerEvents: 'none' }} />

      <span style={{
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: isActive ? '12px' : (display.length > 12 ? '14px' : '17px'),
        fontWeight: 700,
        color: isStopped ? '#F5E88A' : isActive ? '#6A5A8A' : '#3A2858',
        letterSpacing: isStopped ? '0.06em' : '0.02em',
        textAlign: 'center',
        padding: '0 10px',
        lineHeight: 1.25,
        transition: 'color 0.3s ease, font-size 0.15s ease',
        filter: phase === 'fast' ? 'blur(0.7px)' : 'none',
        zIndex: 4,
        position: 'relative',
        maxWidth: '100%',
        wordBreak: 'break-word',
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

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ dest, index, visible }: { dest: Destination; index: number; visible: boolean }) {
  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #E6DEEE',
      borderRadius: '14px',
      padding: '22px 24px',
      boxShadow: '0 4px 20px rgba(107,45,143,0.08)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: `opacity 0.55s ease ${index * 0.18}s, transform 0.55s ease ${index * 0.18}s`,
      flex: '1 1 260px',
      maxWidth: '340px',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6B2D8F, #8B3DAF)',
        color: '#D4AF37', fontFamily: 'var(--font-ui)', fontWeight: 700,
        fontSize: '12px', marginBottom: '10px',
      }}>
        {index + 1}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display), "Playfair Display", serif',
        fontSize: '20px', fontWeight: 700, color: '#6B2D8F',
        margin: '0 0 3px 0',
      }}>
        {dest.title}
      </h3>

      {(dest.country || dest.continent) && (
        <p style={{
          fontFamily: 'var(--font-body), Lato, sans-serif',
          fontSize: '12px', color: '#6A5A8A', margin: '0 0 12px 0', fontWeight: 500,
        }}>
          {[dest.country, dest.continent ? CONTINENT_LABELS[dest.continent] : null]
            .filter(Boolean).join(' · ')}
        </p>
      )}

      {dest.vibe && dest.vibe.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {dest.vibe.map(v => (
            <span key={v} style={{
              padding: '3px 10px', borderRadius: '999px',
              background: '#F8F5FB', border: '1px solid #E6DEEE',
              fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
              color: '#6B2D8F',
            }}>
              {VIBE_LABELS[v] ?? v}
            </span>
          ))}
        </div>
      )}

      {dest.summary && (
        <p style={{
          fontFamily: 'var(--font-body), Lato, sans-serif',
          fontSize: '14px', lineHeight: 1.65, color: '#2A1A3A',
          margin: '0 0 18px 0',
        }}>
          {dest.summary}
        </p>
      )}

      {dest.slug && (
        <Link
          href={`/destinations/${dest.slug}`}
          style={{
            display: 'inline-block', padding: '9px 22px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #6B2D8F, #8B3DAF)',
            color: 'white', fontFamily: 'var(--font-ui)', fontSize: '11px',
            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            textDecoration: 'none',
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
        position: 'absolute', right: '-58px', top: '32px',
        width: '44px', cursor: 'pointer', userSelect: 'none', zIndex: 10,
      }}
    >
      <div style={{
        width: '18px', height: '14px',
        background: 'linear-gradient(90deg, #A87820, #D4AF37, #A87820)',
        borderRadius: '4px 4px 0 0',
        margin: '0 auto',
        boxShadow: '0 2px 5px rgba(0,0,0,0.35)',
      }} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transformOrigin: 'top center',
        transform: pulled ? 'rotate(24deg)' : 'rotate(0deg)',
        transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          width: '8px', height: '82px',
          background: 'linear-gradient(90deg, #987018, #F0CE48, #D4AF37, #987018)',
          borderRadius: '4px',
        }} />
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 32%, #FFF0A0, #D4AF37 55%, #8A6010)',
          border: '1.5px solid #A87820',
          boxShadow: '0 3px 9px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.4)',
          marginTop: '-1px',
        }} />
      </div>
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

    // Kick off stop sequence — set reelValues + stopping atomically
    setReelValues([dests[0].title, dests[1].title, dests[2].title])
    setSpinning(false)
    setStopping(true)

    // Reel i stops at i*330 + 380ms after stopping=true
    // i=0 → 380ms  i=1 → 710ms  i=2 → 1040ms  (660ms total span — within 1s)
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

    // Win chime after all reels stop
    setTimeout(() => playWinSound(getCtx()), 1120)

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
          0%, 100% { box-shadow: 0 10px 50px rgba(70,15,120,0.28), 0 0 0 1px rgba(196,160,48,0.12); }
          50%       { box-shadow: 0 14px 62px rgba(70,15,120,0.45), 0 0 0 1px rgba(196,160,48,0.32); }
        }
        @keyframes lightBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.22; }
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
          <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto 56px' }}>

            <div style={{
              background: `
                radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                linear-gradient(158deg, #9035BE 0%, #7428A8 38%, #6018A0 68%, #5210A0 100%)
              `,
              backgroundSize: '22px 22px, 100% 100%',
              borderRadius: '22px 22px 18px 18px',
              border: '3px solid #C4A030',
              animation: 'machinePulse 5s ease-in-out infinite',
              position: 'relative',
              overflow: 'visible',
            }}>

              {/* Side rivets */}
              {RIVETS.map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos,
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 32%, #FFE080, #D4AF37, #8A6010)',
                  border: '1px solid #A07820',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                  transform: 'translateY(-50%)',
                  zIndex: 5,
                }} />
              ))}

              {/* Corner lights */}
              {CORNER_LIGHTS.map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos,
                  width: '9px', height: '9px', borderRadius: '50%',
                  background: i % 2 === 0 ? '#FFD700' : '#D4AF37',
                  boxShadow: `0 0 7px ${i % 2 === 0 ? '#FFD700' : '#D4AF37'}`,
                  animation: `lightBlink ${1.1 + i * 0.35}s ease-in-out infinite`,
                  zIndex: 5,
                }} />
              ))}

              {/* Marquee */}
              <div style={{
                background: 'linear-gradient(90deg, #0E0622, #1A0838, #0E0622)',
                borderRadius: '18px 18px 0 0',
                borderBottom: '2px solid #C4A030',
                padding: '10px 0',
                overflow: 'hidden',
              }}>
                {/* Light row */}
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 20px', marginBottom: '8px' }}>
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#D4AF37' : i % 4 === 2 ? '#8B3DAF' : '#C4A030',
                      boxShadow: '0 0 3px currentColor',
                      animation: `lightBlink ${0.7 + (i % 5) * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
                {/* Scrolling text */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    display: 'inline-flex',
                    whiteSpace: 'nowrap',
                    animation: 'marqueeScroll 18s linear infinite',
                    fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                    fontSize: '11px', fontWeight: 800,
                    letterSpacing: '0.22em', color: '#F0CF50',
                    textTransform: 'uppercase',
                  }}>
                    {[0, 1].map(n => (
                      <span key={n} style={{ paddingRight: '80px' }}>
                        DECISION ENGINE &nbsp;&middot;&nbsp; CRAZY4POINTS &nbsp;&middot;&nbsp; SPIN YOUR NEXT ADVENTURE
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reel window */}
              <div style={{ padding: '24px 26px 20px' }}>
                <div style={{
                  background: '#0C0818',
                  border: '3px solid #C4A030',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'inset 0 4px 28px rgba(0,0,0,0.72)',
                  position: 'relative',
                }}>
                  {/* Win line */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '16px', right: '16px',
                    height: '1px', background: 'rgba(212,175,55,0.18)',
                    transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1,
                  }} />

                  {/* Reel labels */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    {['I', 'II', 'III'].map(r => (
                      <div key={r} style={{
                        flex: 1, textAlign: 'center',
                        fontFamily: 'var(--font-ui)', fontSize: '9px', fontWeight: 700,
                        letterSpacing: '0.16em', color: '#3A2858',
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>

                  {/* Reels */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[0, 1, 2].map(i => (
                      <SlotReel
                        key={i}
                        spinning={spinning}
                        stopping={stopping}
                        stopIndex={i}
                        finalValue={reelValues[i]}
                        flashing={reelFlashing[i]}
                      />
                    ))}
                  </div>

                  {/* Bottom accent line */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4A030', flexShrink: 0, boxShadow: '0 0 5px #C4A030' }} />
                    <div style={{ flex: 1, height: '1px', background: 'rgba(196,160,48,0.22)' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4A030', flexShrink: 0, boxShadow: '0 0 5px #C4A030' }} />
                  </div>
                </div>
              </div>

              {/* SPIN button */}
              <div style={{ padding: '0 26px 30px', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={!canSpin}
                  style={{
                    padding: '16px 80px',
                    borderRadius: '999px',
                    border: 'none',
                    background: canSpin
                      ? 'linear-gradient(135deg, #F8EB80 0%, #D4AF37 50%, #B89228 100%)'
                      : 'linear-gradient(135deg, #7A7A7A, #4A4A4A)',
                    color: canSpin ? '#1A0A2E' : '#999',
                    fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                    fontSize: '20px', fontWeight: 900,
                    letterSpacing: '0.24em', textTransform: 'uppercase',
                    cursor: canSpin ? 'pointer' : 'not-allowed',
                    animation: canSpin ? 'spinIdle 2.8s ease-in-out infinite' : 'none',
                    boxShadow: canSpin ? '0 4px 22px rgba(212,175,55,0.4)' : 'none',
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  {spinning || stopping ? 'SPINNING' : 'SPIN'}
                </button>
              </div>

            </div>{/* /machine body */}

            {/* Handle — desktop only */}
            <div className="hidden md:block">
              <PullHandle pulled={handlePulled} onClick={canSpin ? handleSpin : () => {}} />
            </div>

          </div>{/* /machine outer */}

          {/* Result cards */}
          {results.length > 0 && (
            <div style={{ marginBottom: '44px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
                color: '#6B2D8F', textAlign: 'center', marginBottom: '28px',
              }}>
                Your Next Adventures
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {results.map((dest, i) =>
                  dest.title !== '—' ? (
                    <ResultCard key={i} dest={dest} index={i} visible={cardsVisible} />
                  ) : null
                )}
              </div>
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
