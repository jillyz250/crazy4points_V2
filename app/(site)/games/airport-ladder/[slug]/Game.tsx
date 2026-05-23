'use client'

/**
 * Airport Code Ladder — client-side puzzle game.
 *
 * Mechanic: start IATA → goal IATA, changing one letter per step. Every
 * intermediate must be a real airport code.
 *
 * Easy mode shows the valid next-step neighbors as clickable chips so
 * players can scan the surface. Hard mode hides them — type blind.
 *
 * BFS runs locally on the ~6000-airport graph for "give up" reveals + par
 * verification. Cached by current code.
 */
import { useMemo, useState, useCallback } from 'react'

interface Puzzle {
  slug: string
  title: string
  subtitle: string
  start: string
  goal: string
  par: number
  max_guesses?: number
  sample_path: string[]
  story?: {
    intro: string
    mission?: string
    win: string
    fail?: string
    give_up: string
  }
}

type Difficulty = 'easy' | 'medium' | 'hard'

interface IataEntry {
  code: string
  name: string
  city: string
  country: string
}

interface Props {
  puzzle: Puzzle
  iata: IataEntry[]
}

function oneLetterDiff(a: string, b: string): boolean {
  if (a.length !== 3 || b.length !== 3) return false
  let diffs = 0
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) diffs++
  return diffs === 1
}

function neighbors(code: string, set: Set<string>): string[] {
  const out: string[] = []
  for (let i = 0; i < 3; i++) {
    for (let ch = 65; ch <= 90; ch++) {
      const c = String.fromCharCode(ch)
      if (c === code[i]) continue
      const next = code.slice(0, i) + c + code.slice(i + 1)
      if (set.has(next)) out.push(next)
    }
  }
  return out
}

function bfs(start: string, goal: string, set: Set<string>): string[] | null {
  if (!set.has(start) || !set.has(goal)) return null
  const queue: string[] = [start]
  const prev = new Map<string, string | null>([[start, null]])
  while (queue.length) {
    const cur = queue.shift()!
    if (cur === goal) {
      const path: string[] = []
      let n: string | null = cur
      while (n !== null) {
        path.unshift(n)
        n = prev.get(n) ?? null
      }
      return path
    }
    for (const nb of neighbors(cur, set)) {
      if (!prev.has(nb)) {
        prev.set(nb, cur)
        queue.push(nb)
      }
    }
  }
  return null
}

const TILE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.25rem',
  height: '2.75rem',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontWeight: 700,
  fontSize: '1.5rem',
  border: '2px solid var(--color-border-soft, #E6DEEE)',
  borderRadius: 'var(--radius-ui, 0.375rem)',
  background: '#fff',
  color: 'var(--color-text-primary, #1A1A1A)',
}

const TILE_GREEN: React.CSSProperties = {
  ...TILE,
  background: '#2e7d4f',
  borderColor: '#2e7d4f',
  color: '#fff',
}

const TILE_MUTED: React.CSSProperties = {
  ...TILE,
  background: '#f4f1f8',
  borderColor: '#E6DEEE',
  color: 'var(--color-text-secondary, #4A4A4A)',
}

function CodeTiles({ code, goal }: { code: string; goal: string }) {
  return (
    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={code[i] === goal[i] ? TILE_GREEN : TILE}>
          {code[i]}
        </span>
      ))}
    </div>
  )
}

export default function Game({ puzzle, iata }: Props) {
  const codeSet = useMemo(() => new Set(iata.map((e) => e.code)), [iata])
  const byCode = useMemo(() => {
    const m = new Map<string, IataEntry>()
    for (const e of iata) m.set(e.code, e)
    return m
  }, [iata])

  const [chain, setChain] = useState<string[]>([puzzle.start])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set())
  // Hard-mode-only: a one-shot "show me the list" toggle that surfaces the
  // valid-next-codes chip list for the current step. Resets every time the
  // chain advances so it's a per-stop hint, not a permanent override.
  const [hardModeChipsRevealed, setHardModeChipsRevealed] = useState(false)
  const [givenUp, setGivenUp] = useState<string[] | null>(null)

  const current = chain[chain.length - 1]
  const isWon = current === puzzle.goal
  const stopsTaken = chain.length - 1
  const MAX_GUESSES = puzzle.max_guesses ?? 6
  const isFailed = !isWon && stopsTaken >= MAX_GUESSES

  const validNeighbors = useMemo(
    () => (isWon ? [] : neighbors(current, codeSet)),
    [current, codeSet, isWon],
  )

  // Easy mode: only show chips that advance Amanda toward the goal — chips
  // that change one letter to match the goal at THAT position. Usually 1-3
  // chips per step, guiding the player.
  // Medium mode: every valid 1-letter-diff IATA (the unfiltered list).
  // Hard mode: no chips. Type blind, hint button still works.
  const filteredNeighbors = useMemo(() => {
    if (difficulty === 'hard') return []
    if (difficulty === 'medium') return validNeighbors
    return validNeighbors.filter((nb) => {
      for (let i = 0; i < 3; i++) {
        if (nb[i] !== current[i]) {
          // Position i changed. Only keep this chip if the new letter
          // matches the goal at that position.
          return nb[i] === puzzle.goal[i]
        }
      }
      return false
    })
  }, [difficulty, validNeighbors, current, puzzle.goal])

  const handleSubmit = useCallback(
    (raw: string) => {
      const code = raw.trim().toUpperCase()
      setError(null)
      if (!/^[A-Z]{3}$/.test(code)) {
        setError('Enter a 3-letter airport code.')
        return
      }
      if (!codeSet.has(code)) {
        setError(`${code} isn't a recognized airport code.`)
        return
      }
      if (!oneLetterDiff(current, code)) {
        setError(`${code} differs from ${current} by more than one letter.`)
        return
      }
      setChain((prev) => [...prev, code])
      setInput('')
      setRevealedHints(new Set())
      setHardModeChipsRevealed(false)
    },
    [codeSet, current],
  )

  const handleHint = useCallback(() => {
    // Hard mode: Hint surfaces the full list of valid next codes for this
    // step. Easy/medium already have a chip list, so Hint there reveals a
    // goal letter instead.
    if (difficulty === 'hard') {
      setHardModeChipsRevealed(true)
      setError(null)
      return
    }
    const unmatched: number[] = []
    for (let i = 0; i < 3; i++) {
      if (current[i] !== puzzle.goal[i] && !revealedHints.has(i)) unmatched.push(i)
    }
    if (unmatched.length === 0) {
      setError('No hints left — every letter is either matched or already shown.')
      return
    }
    const pick = unmatched[Math.floor(Math.random() * unmatched.length)]
    setRevealedHints((s) => new Set(s).add(pick))
  }, [difficulty, current, puzzle.goal, revealedHints])

  const handleGiveUp = useCallback(() => {
    if (!confirm('Give up and reveal one valid solution? You can keep playing after.')) return
    const path = puzzle.sample_path?.length
      ? puzzle.sample_path
      : bfs(puzzle.start, puzzle.goal, codeSet)
    setGivenUp(path)
  }, [codeSet, puzzle.goal, puzzle.sample_path, puzzle.start])

  const handleReset = useCallback(() => {
    setChain([puzzle.start])
    setInput('')
    setError(null)
    setRevealedHints(new Set())
    setHardModeChipsRevealed(false)
    setGivenUp(null)
  }, [puzzle.start])

  return (
    <main className="rg-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary, #6B2D8F)', fontWeight: 700, margin: 0 }}>
          Three-Letter Dash
        </p>
        <h1 style={{ margin: '0.375rem 0 0.75rem', fontSize: '2rem', lineHeight: 1.15, color: 'var(--color-primary, #6B2D8F)' }}>
          {puzzle.title}
        </h1>
        {puzzle.story?.intro && (
          <div style={{ color: 'var(--color-text-primary, #1A1A1A)', margin: '0 0 0.75rem', fontSize: '1rem', lineHeight: 1.55 }}>
            {puzzle.story.intro.split('\n\n').map((para, i) => (
              <p key={i} style={{ margin: '0 0 0.75rem' }}>{para}</p>
            ))}
          </div>
        )}
        {puzzle.story?.mission && (
          <p style={{ color: '#c0392b', fontWeight: 700, margin: '0 0 0.75rem', fontSize: '1rem', lineHeight: 1.5 }}>
            {puzzle.story.mission}
          </p>
        )}
        <p style={{ color: 'var(--color-text-secondary, #4A4A4A)', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
          {puzzle.subtitle}
        </p>
      </header>

      {/* How it works — fixes the most common confusion: players assume
          they're routing a real flight. They're not. It's a word puzzle on
          the codes themselves. */}
      <div style={{ background: 'var(--color-background-soft, #F8F5FB)', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: 'var(--radius-card, 0.75rem)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-primary, #6B2D8F)', fontWeight: 700, marginBottom: '0.5rem' }}>
          How it works
        </div>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
          <strong>It&apos;s not the location that matters — it&apos;s the letters.</strong>{' '}Each step swaps one letter of the code, and the new three-letter combo has to be a real airport code somewhere in the world. You&apos;re solving a word puzzle on the codes themselves, not booking real flights.
        </p>
        <p style={{ margin: '0 0 0.625rem', fontSize: '0.9375rem', lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
          For example: <strong>ATL</strong> (Atlanta) and <strong>ATH</strong> (Athens, Greece) are one letter apart — change the L to an H and you&apos;ve made a valid move, because ATH is a real airport. Different country, different continent — doesn&apos;t matter. The letters are what counts.
        </p>
        <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
          <li>Change exactly <strong>one</strong> letter per move.</li>
          <li>Each new three-letter code must be a real airport code.</li>
          <li>Get from {puzzle.start} to {puzzle.goal} in 6 moves or fewer.</li>
        </ul>
      </div>

      {/* Goal panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '1rem 1.25rem', background: 'var(--color-background-soft, #F8F5FB)', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: 'var(--radius-card, 0.75rem)', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.25rem' }}>
            Goal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CodeTiles code={puzzle.goal} goal={puzzle.goal} />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {byCode.get(puzzle.goal)?.city ?? puzzle.goal}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
            Moves used
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stopsTaken >= MAX_GUESSES ? '#c0392b' : 'var(--color-primary)' }}>
            {stopsTaken} / {MAX_GUESSES}
          </div>
        </div>
      </div>

      {/* Difficulty picker */}
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginRight: '0.25rem' }}>
          Difficulty
        </span>
        {(['easy', 'medium', 'hard'] as const).map((d) => {
          const active = difficulty === d
          const label = d === 'easy' ? 'Easy (guided)' : d === 'medium' ? 'Medium (all options)' : 'Hard (blind)'
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              style={{
                padding: '0.375rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border-soft)'}`,
                background: active ? 'var(--color-primary)' : '#fff',
                color: active ? '#fff' : 'var(--color-text-primary)',
                borderRadius: 'var(--radius-ui)',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {chain.map((code, i) => {
          const entry = byCode.get(code)
          const isStart = i === 0
          return (
            <div key={`${code}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '1.5rem', textAlign: 'center', fontFamily: 'ui-monospace, monospace', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {isStart ? '↧' : i}
              </div>
              <CodeTiles code={code} goal={puzzle.goal} />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {entry ? `${entry.city}${entry.country && entry.country !== 'United States' ? `, ${entry.country}` : ''}` : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Input + hint row (hidden when won or failed) */}
      {!isWon && !isFailed && (
        <div style={{ border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Stop {stopsTaken + 1} — change one letter of {current}
          </div>

          {revealedHints.size > 0 && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Hint:{' '}
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: revealedHints.has(i) ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                  {revealedHints.has(i) ? puzzle.goal[i] : '·'}
                </span>
              ))}
              <span style={{ marginLeft: '0.5rem' }}>← letters from the goal at those positions</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(input)
            }}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              placeholder="3-letter code"
              maxLength={3}
              autoFocus
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                padding: '0.5rem 0.75rem',
                border: '2px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                width: '6.5rem',
                textTransform: 'uppercase',
              }}
            />
            <button type="submit" className="rg-btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
              Try it
            </button>
            <button type="button" onClick={handleHint} className="rg-btn-secondary" style={{ padding: '0.5rem 0.875rem' }}>
              Hint
            </button>
            <button type="button" onClick={handleGiveUp} style={{ background: 'transparent', border: '1px dashed var(--color-border-soft)', color: 'var(--color-text-secondary)', padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-ui)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem' }}>
              I give up
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '0.625rem', fontSize: '0.8125rem', color: '#c0392b' }}>{error}</div>
          )}

          {(() => {
            // Which chip set to render, if any:
            //  easy/medium → filteredNeighbors (no list if empty)
            //  hard → only when user clicked Hint for this step; show ALL
            //         valid 1-letter-diff codes for the step
            const chips =
              difficulty === 'hard'
                ? hardModeChipsRevealed
                  ? validNeighbors
                  : []
                : filteredNeighbors
            if (chips.length === 0) return null
            const headerLabel =
              difficulty === 'easy'
                ? `Stops that move Amanda closer (${chips.length})`
                : difficulty === 'hard'
                  ? `Possible next codes (${chips.length})`
                  : `Valid next codes (${chips.length})`
            return (
              <div style={{ marginTop: '0.875rem' }}>
                <div style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.375rem' }}>
                  {headerLabel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {chips.map((nb) => {
                    const e = byCode.get(nb)
                    return (
                      <button
                        key={nb}
                        type="button"
                        onClick={() => handleSubmit(nb)}
                        title={e ? `${e.city}, ${e.country}` : nb}
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          padding: '0.3125rem 0.5rem',
                          border: '1px solid var(--color-border-soft)',
                          borderRadius: 'var(--radius-ui)',
                          background: '#fff',
                          cursor: 'pointer',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {nb}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          {difficulty === 'easy' && filteredNeighbors.length === 0 && validNeighbors.length > 0 && !isWon && (
            <div style={{ marginTop: '0.875rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              No single-letter swap aligns another goal letter from here. Switch to <strong>Medium</strong> to see all valid options, or use a hint.
            </div>
          )}
        </div>
      )}

      {/* Fail state — ran out of guesses */}
      {isFailed && (
        <div style={{ padding: '1.25rem 1.5rem', background: '#fdecea', border: '1px solid #c0392b', borderRadius: 'var(--radius-card)', marginBottom: '1.25rem' }}>
          {puzzle.story?.fail ? (
            <p style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
              {puzzle.story.fail}
            </p>
          ) : (
            <p style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 700, color: '#c0392b' }}>
              Out of moves. Amanda missed the interview.
            </p>
          )}
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>
            One valid route ({puzzle.sample_path.length - 1} stops)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            {puzzle.sample_path.map((code, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{code}</span>
                {i < puzzle.sample_path.length - 1 && <span style={{ color: 'var(--color-text-secondary)' }}>→</span>}
              </span>
            ))}
          </div>
          <button type="button" onClick={handleReset} className="rg-btn-secondary" style={{ padding: '0.4375rem 1rem' }}>
            Try again
          </button>
        </div>
      )}

      {/* Won state */}
      {isWon && (
        <div style={{ padding: '1.25rem 1.5rem', background: '#eaf6ee', border: '1px solid #2e7d4f', borderRadius: 'var(--radius-card)', marginBottom: '1.25rem' }}>
          {puzzle.story?.win ? (
            <div style={{ fontSize: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.55, marginBottom: '0.5rem' }}>
              {puzzle.story.win.replace('{stops}', String(stopsTaken))}
            </div>
          ) : (
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2e7d4f', marginBottom: '0.25rem' }}>
              You made it. {stopsTaken} stop{stopsTaken === 1 ? '' : 's'}.
            </div>
          )}
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {stopsTaken} of {MAX_GUESSES} moves used.
          </div>
          <div style={{ marginTop: '0.625rem' }}>
            <button type="button" onClick={handleReset} className="rg-btn-secondary" style={{ padding: '0.4375rem 1rem' }}>
              Play again
            </button>
          </div>
        </div>
      )}

      {/* Give-up reveal */}
      {givenUp && (
        <div style={{ padding: '1rem 1.25rem', background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-card)', marginBottom: '1.25rem' }}>
          {puzzle.story?.give_up && (
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
              {puzzle.story.give_up}
            </p>
          )}
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>
            One valid route ({givenUp.length - 1} stops)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {givenUp.map((code, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{code}</span>
                {i < givenUp.length - 1 && <span style={{ color: 'var(--color-text-secondary)' }}>→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
