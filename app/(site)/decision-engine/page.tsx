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

// ─── Filter options ───────────────────────────────────────────────────────────

const MONTHS = [
  { label: 'Jan', value: 'jan' }, { label: 'Feb', value: 'feb' },
  { label: 'Mar', value: 'mar' }, { label: 'Apr', value: 'apr' },
  { label: 'May', value: 'may' }, { label: 'Jun', value: 'jun' },
  { label: 'Jul', value: 'jul' }, { label: 'Aug', value: 'aug' },
  { label: 'Sep', value: 'sep' }, { label: 'Oct', value: 'oct' },
  { label: 'Nov', value: 'nov' }, { label: 'Dec', value: 'dec' },
  { label: '🎲 Surprise Me', value: 'surprise' },
]

const CONTINENTS = [
  { label: 'North America', value: 'north_america' },
  { label: 'Central America', value: 'central_america' },
  { label: 'South America', value: 'south_america' },
  { label: 'Caribbean', value: 'caribbean' },
  { label: 'Europe', value: 'europe' },
  { label: 'Asia', value: 'asia' },
  { label: 'Middle East', value: 'middle_east' },
  { label: 'Africa', value: 'africa' },
  { label: 'South Pacific', value: 'south_pacific' },
  { label: '🎲 Surprise Me', value: 'surprise' },
]

const VIBES = [
  { label: 'Beach', value: 'beach' },
  { label: 'City', value: 'city' },
  { label: 'History', value: 'history' },
  { label: 'Nature', value: 'nature' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Family', value: 'family' },
  { label: '🎲 Surprise Me', value: 'surprise' },
]

const TRIP_LENGTHS = [
  { label: 'Short (2–4 days)', value: 'short' },
  { label: 'Medium (5–7 days)', value: 'medium' },
  { label: 'Long (8+ days)', value: 'long' },
  { label: '🎲 Surprise Me', value: 'surprise' },
]

const WHO_GOING = [
  { label: 'Solo', value: 'solo' },
  { label: 'Couple', value: 'couple' },
  { label: 'Family', value: 'family' },
  { label: 'Group', value: 'group' },
  { label: '🎲 Surprise Me', value: 'surprise' },
]

// Sample destination names used for reel cycling animation
const REEL_NAMES = [
  'Paris', 'Tokyo', 'Bali', 'Cancún', 'Rome', 'Santorini', 'Maldives',
  'New York', 'Kyoto', 'Dubai', 'Barcelona', 'Maui', 'Sydney', 'Cape Town',
  'Lisbon', 'Phuket', 'Vienna', 'Havana', 'Nairobi', 'Istanbul',
  'Amsterdam', 'Tulum', 'Fiji', 'Prague', 'Buenos Aires', 'Marrakech',
  'Iceland', 'Patagonia', 'Amalfi', 'Colombo',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveFilter(value: string | null, options: { value: string }[]): string | null {
  if (!value) return null
  if (value === 'surprise') {
    const real = options.filter((o) => o.value !== 'surprise')
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

// ─── Web Audio sounds ─────────────────────────────────────────────────────────

function playSpinSound(ctx: AudioContext): () => void {
  let active = true
  let timeout: ReturnType<typeof setTimeout>

  function tick(interval: number) {
    if (!active) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 80 + Math.random() * 120
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.04)
    timeout = setTimeout(() => tick(interval), interval)
  }
  tick(55)
  return () => { active = false; clearTimeout(timeout) }
}

function playWinSound(ctx: AudioContext) {
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    }, i * 140)
  })
}

// ─── SlotReel component ───────────────────────────────────────────────────────

type ReelProps = {
  spinning: boolean
  stopDelay: number   // ms after spin starts that this reel stops
  finalValue: string
  onStop?: () => void
}

function SlotReel({ spinning, stopDelay, finalValue, onStop }: ReelProps) {
  const [display, setDisplay] = useState('?')
  const [phase, setPhase] = useState<'idle' | 'fast' | 'slow' | 'stopped'>('idle')
  const fastRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const slowRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!spinning) {
      // Reset when a new spin starts being prepared
      if (phase !== 'idle') return
      setDisplay('?')
      return
    }

    setPhase('fast')

    // Fast phase
    fastRef.current = setInterval(() => {
      setDisplay(REEL_NAMES[Math.floor(Math.random() * REEL_NAMES.length)])
    }, 65)

    // Slow-down phase starts 400ms before stop
    slowTimerRef.current = setTimeout(() => {
      if (fastRef.current) clearInterval(fastRef.current)
      setPhase('slow')
      slowRef.current = setInterval(() => {
        setDisplay(REEL_NAMES[Math.floor(Math.random() * REEL_NAMES.length)])
      }, 180)
    }, stopDelay - 400)

    // Full stop
    stopTimerRef.current = setTimeout(() => {
      if (slowRef.current) clearInterval(slowRef.current)
      setDisplay(finalValue)
      setPhase('stopped')
      onStop?.()
    }, stopDelay)

    return () => {
      if (fastRef.current) clearInterval(fastRef.current)
      if (slowRef.current) clearInterval(slowRef.current)
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning])

  const isActive = phase === 'fast' || phase === 'slow'

  return (
    <div
      style={{
        flex: 1,
        height: '72px',
        background: '#0D0820',
        border: '2px solid #D4AF37',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: phase === 'stopped' && finalValue !== '?'
          ? 'inset 0 0 16px rgba(212,175,55,0.25), 0 0 12px rgba(212,175,55,0.3)'
          : 'inset 0 0 10px rgba(0,0,0,0.5)',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {/* Scan line overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
        zIndex: 2,
      }} />
      {/* Top/bottom gradient fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '20px', pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #0D0820, transparent)', zIndex: 3,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px', pointerEvents: 'none',
        background: 'linear-gradient(to top, #0D0820, transparent)', zIndex: 3,
      }} />

      <span style={{
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: isActive ? '13px' : '15px',
        fontWeight: 700,
        color: phase === 'stopped' ? '#F5E88A' : isActive ? '#aaa' : '#666',
        letterSpacing: '0.04em',
        textAlign: 'center',
        padding: '0 8px',
        lineHeight: 1.2,
        transition: 'color 0.3s ease, font-size 0.2s ease',
        filter: isActive ? 'blur(0.6px)' : 'none',
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

// ─── Filter pill ──────────────────────────────────────────────────────────────

function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: '999px',
        border: selected ? '1.5px solid #D4AF37' : '1.5px solid #6B2D8F',
        background: selected ? '#D4AF37' : 'white',
        color: selected ? '#1A1A1A' : '#6B2D8F',
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}

// ─── Filter row ───────────────────────────────────────────────────────────────

function FilterRow({
  label, options, value, onChange,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#D4AF37',
        marginBottom: '5px',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '5px',
      }}>
        {options.map((o) => (
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

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ dest, index, visible }: { dest: Destination; index: number; visible: boolean }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1.5px solid #E6DEEE',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 4px 16px rgba(107,45,143,0.1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.2}s, transform 0.5s ease ${index * 0.2}s`,
        flex: '1 1 280px',
        maxWidth: '340px',
      }}
    >
      {/* Index badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6B2D8F, #8B3DAF)',
        color: '#D4AF37', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '13px',
        marginBottom: '12px',
      }}>
        {index + 1}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display), "Playfair Display", serif',
        fontSize: '20px', fontWeight: 700, color: '#6B2D8F',
        margin: '0 0 4px 0',
      }}>
        {dest.title}
      </h3>

      {(dest.country || dest.continent) && (
        <p style={{
          fontFamily: 'var(--font-body), Lato, sans-serif',
          fontSize: '13px', color: '#4A4A4A', margin: '0 0 12px 0',
        }}>
          {[dest.country, dest.continent ? CONTINENT_LABELS[dest.continent] : null]
            .filter(Boolean).join(' · ')}
        </p>
      )}

      {dest.vibe && dest.vibe.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {dest.vibe.map((v) => (
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
          fontSize: '14px', lineHeight: 1.6, color: '#1A1A1A',
          margin: '0 0 16px 0',
        }}>
          {dest.summary}
        </p>
      )}

      <Link
        href={`/destinations/${dest.slug}`}
        style={{
          display: 'inline-block',
          padding: '8px 20px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #6B2D8F, #8B3DAF)',
          color: 'white',
          fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        Explore →
      </Link>
    </div>
  )
}

// ─── Pull handle SVG ──────────────────────────────────────────────────────────

function PullHandle({ pulled, onClick }: { pulled: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      title="Pull to spin!"
      style={{
        position: 'absolute',
        right: '-52px',
        top: '24px',
        width: '44px',
        cursor: 'pointer',
        userSelect: 'none',
        zIndex: 10,
      }}
    >
      {/* Mount bracket */}
      <div style={{
        width: '18px',
        height: '14px',
        background: 'linear-gradient(90deg, #B8922A, #D4AF37)',
        borderRadius: '3px 3px 0 0',
        margin: '0 auto',
        border: '1px solid #A07820',
      }} />
      {/* Rod + ball */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transformOrigin: 'top center',
        transform: pulled ? 'rotate(28deg)' : 'rotate(0deg)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{
          width: '10px',
          height: '80px',
          background: 'linear-gradient(90deg, #A07820, #F0CE48, #A07820)',
          borderRadius: '5px',
        }} />
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 35%, #FFE87A, #D4AF37 55%, #8A6010)',
          border: '2px solid #A07820',
          boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
          marginTop: '-2px',
        }} />
      </div>
      {/* Label */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-ui)', fontSize: '8px', fontWeight: 700,
        letterSpacing: '0.08em', color: '#D4AF37',
        marginTop: '6px', textTransform: 'uppercase',
      }}>
        Pull
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DecisionEnginePage() {
  const [filters, setFilters] = useState<Filters>({
    month: null, continent: null, vibe: null, tripLength: null, whoIsGoing: null,
  })
  const [spinning, setSpinning] = useState(false)
  const [handlePulled, setHandlePulled] = useState(false)
  const [reelValues, setReelValues] = useState(['?', '?', '?'])
  const [results, setResults] = useState<Destination[]>([])
  const [cardsVisible, setCardsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopSpinSoundRef = useRef<(() => void) | null>(null)
  const spinningRef = useRef(false)

  function getAudioCtx(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const setFilter = useCallback((key: keyof Filters, value: string | null) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }, [])

  const handleSpin = useCallback(async () => {
    if (spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setCardsVisible(false)
    setResults([])
    setError(null)

    // Handle animation
    setHandlePulled(true)
    setTimeout(() => setHandlePulled(false), 500)

    // Sound
    const ctx = getAudioCtx()
    stopSpinSoundRef.current = playSpinSound(ctx)

    // Resolve surprise filters
    const resolved = {
      month: resolveFilter(filters.month, MONTHS),
      continent: resolveFilter(filters.continent, CONTINENTS),
      vibe: resolveFilter(filters.vibe, VIBES),
      tripLength: resolveFilter(filters.tripLength, TRIP_LENGTHS),
      whoIsGoing: resolveFilter(filters.whoIsGoing, WHO_GOING),
    }

    // API call (with 2s minimum spin time)
    const [apiResult] = await Promise.all([
      fetch('/api/decision-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved),
      }).then((r) => r.json()).catch(() => ({ destinations: [] })),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ])

    const dests: Destination[] = apiResult.destinations ?? []

    // Pad to 3 if needed
    while (dests.length < 3) {
      dests.push({ title: '—', slug: '', country: null, continent: null, vibe: null, summary: null })
    }

    setReelValues([dests[0].title, dests[1].title, dests[2].title])

    // Reels stop one by one — delays from NOW (spin started 2s ago, so these are relative to reel stop start)
    // Reel 1: 600ms, Reel 2: 1100ms, Reel 3: 1600ms (relative to when we set spinning)
    // We control this via stopDelay props on SlotReel

    // Stop spin sound when last reel stops
    setTimeout(() => {
      stopSpinSoundRef.current?.()
    }, 1600)

    // Win chime after last reel
    setTimeout(() => {
      playWinSound(getAudioCtx())
    }, 1750)

    // Show cards after all reels done
    setTimeout(() => {
      setResults(dests)
      setCardsVisible(true)
      setSpinning(false)
      spinningRef.current = false
    }, 2400)
  }, [filters])

  // Reel stop delays (ms after spin = true)
  const REEL_STOPS = [600, 1100, 1600]

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes machinePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
          50%       { box-shadow: 0 0 28px 4px rgba(212,175,55,0.18); }
        }
        @keyframes lightBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main
        className="rg-major-section !pt-8"
        style={{ background: 'var(--color-background-soft)', minHeight: '100vh' }}
      >
        <div className="rg-container" style={{ maxWidth: '860px' }}>

          {/* Page headline */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display), "Playfair Display", serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              margin: '0 0 10px 0',
              lineHeight: 1.25,
            }}>
              Not sure where to go?
            </h1>
            <p style={{
              fontFamily: 'var(--font-body), Lato, sans-serif',
              fontSize: '16px', color: 'var(--color-text-secondary)',
              margin: 0,
            }}>
              Let us help you decide. Set your filters, pull the handle, and spin your next adventure.
            </p>
          </div>

          {/* ── Slot Machine ───────────────────────────────────────────────── */}
          <div style={{ position: 'relative', maxWidth: '620px', margin: '0 auto 48px' }}>

            {/* Machine body */}
            <div style={{
              background: 'linear-gradient(160deg, #7B2FA0 0%, #5A1878 50%, #3D0F55 100%)',
              borderRadius: '20px 20px 16px 16px',
              border: '3px solid #D4AF37',
              boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              animation: 'machinePulse 4s ease-in-out infinite',
              overflow: 'visible',
              position: 'relative',
            }}>

              {/* Decorative corner lights */}
              {[{t:'12px',l:'12px'},{t:'12px',r:'12px'},{b:'12px',l:'12px'},{b:'12px',r:'12px'}].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...pos as any,
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: i % 2 === 0 ? '#FFD700' : '#FF6B35',
                  boxShadow: '0 0 8px currentColor',
                  animation: `lightBlink ${1.2 + i * 0.3}s ease-in-out infinite`,
                  zIndex: 5,
                }} />
              ))}

              {/* ── Marquee header ── */}
              <div style={{
                background: 'linear-gradient(90deg, #1A0A2E, #2D1050, #1A0A2E)',
                borderRadius: '16px 16px 0 0',
                borderBottom: '2px solid #D4AF37',
                padding: '10px 0',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Marquee lights row */}
                <div style={{
                  display: 'flex', justifyContent: 'space-around',
                  padding: '0 16px', marginBottom: '8px',
                }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#FF6B35' : '#6B2D8F',
                      boxShadow: '0 0 4px currentColor',
                      animation: `lightBlink ${0.8 + (i % 4) * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
                {/* Scrolling text */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', gap: '60px',
                    animation: 'marqueeScroll 14s linear infinite',
                    width: 'max-content',
                  }}>
                    {[0, 1].map((n) => (
                      <div key={n} style={{
                        display: 'flex', alignItems: 'center', gap: '20px',
                        fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                        fontSize: '13px', fontWeight: 800,
                        letterSpacing: '0.18em', color: '#F5E170',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>
                        <span>✈️</span>
                        <span>Decision Engine</span>
                        <span>🧳</span>
                        <span>crazy4points</span>
                        <span>🗺️</span>
                        <span>Spin Your Next Adventure</span>
                        <span>✈️</span>
                        <span>Decision Engine</span>
                        <span>🧳</span>
                        <span>crazy4points</span>
                        <span>🗺️</span>
                        <span>Spin Your Next Adventure</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Reel window ── */}
              <div style={{ padding: '20px 20px 16px' }}>
                <div style={{
                  background: '#0D0820',
                  border: '3px solid #D4AF37',
                  borderRadius: '10px',
                  padding: '12px',
                  boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.6)',
                }}>
                  {/* Reel label */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-around',
                    marginBottom: '8px',
                  }}>
                    {['Destination 1', 'Destination 2', 'Destination 3'].map((l) => (
                      <span key={l} style={{
                        fontFamily: 'var(--font-ui)', fontSize: '8px', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: '#5A4A7A', flex: 1, textAlign: 'center',
                      }}>{l}</span>
                    ))}
                  </div>
                  {/* Reels */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[0, 1, 2].map((i) => (
                      <SlotReel
                        key={i}
                        spinning={spinning}
                        stopDelay={REEL_STOPS[i]}
                        finalValue={reelValues[i]}
                      />
                    ))}
                  </div>
                  {/* Center line indicator */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '8px',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37', flexShrink: 0, boxShadow: '0 0 6px #D4AF37' }} />
                    <div style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.3)' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37', flexShrink: 0, boxShadow: '0 0 6px #D4AF37' }} />
                  </div>
                </div>
              </div>

              {/* ── Filter panel ── */}
              <div style={{
                margin: '0 16px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '10px',
                border: '1px solid rgba(212,175,55,0.25)',
                padding: '16px',
              }}>
                <FilterRow label="Month" options={MONTHS} value={filters.month} onChange={(v) => setFilter('month', v)} />
                <FilterRow label="Continent" options={CONTINENTS} value={filters.continent} onChange={(v) => setFilter('continent', v)} />
                <FilterRow label="Vibe" options={VIBES} value={filters.vibe} onChange={(v) => setFilter('vibe', v)} />
                <FilterRow label="Trip Length" options={TRIP_LENGTHS} value={filters.tripLength} onChange={(v) => setFilter('tripLength', v)} />
                <FilterRow label="Who's Going" options={WHO_GOING} value={filters.whoIsGoing} onChange={(v) => setFilter('whoIsGoing', v)} />
              </div>

              {/* ── SPIN button ── */}
              <div style={{ padding: '20px 16px 24px', display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={spinning}
                  style={{
                    padding: '14px 48px',
                    borderRadius: '999px',
                    background: spinning
                      ? 'linear-gradient(135deg, #888, #555)'
                      : 'linear-gradient(135deg, #F5E170 0%, #D4AF37 50%, #B8922A 100%)',
                    border: 'none',
                    color: spinning ? '#ccc' : '#1A0A2E',
                    fontFamily: 'var(--font-ui), Montserrat, sans-serif',
                    fontSize: '16px',
                    fontWeight: 900,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: spinning ? 'not-allowed' : 'pointer',
                    boxShadow: spinning ? 'none' : '0 4px 20px rgba(212,175,55,0.5)',
                    transition: 'all 0.2s ease',
                    transform: spinning ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  {spinning ? '⏳ Spinning…' : '🎰 SPIN'}
                </button>
              </div>

            </div>{/* /machine body */}

            {/* Pull handle — hidden on mobile */}
            <div className="hidden md:block">
              <PullHandle pulled={handlePulled} onClick={handleSpin} />
            </div>

          </div>{/* /machine outer */}

          {/* ── Result cards ─────────────────────────────────────────────── */}
          {results.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700,
                color: 'var(--color-primary)', textAlign: 'center', marginBottom: '24px',
              }}>
                Your Next Adventures Await
              </h2>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center',
              }}>
                {results.map((dest, i) => (
                  dest.slug ? (
                    <ResultCard key={i} dest={dest} index={i} visible={cardsVisible} />
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p style={{
              textAlign: 'center', color: '#c0392b',
              fontFamily: 'var(--font-body)', fontSize: '14px',
            }}>{error}</p>
          )}

          {/* Disclaimer */}
          <p style={{
            textAlign: 'center',
            fontFamily: 'var(--font-body), Lato, sans-serif',
            fontSize: '11px', color: 'var(--color-text-secondary)',
            marginBottom: '16px', lineHeight: 1.5,
          }}>
            This is a travel planning tool only. No purchase or prize is involved.
          </p>

        </div>
      </main>
    </>
  )
}
