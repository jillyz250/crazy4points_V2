'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Chip,
  Passenger,
  Placement,
  Puzzle,
  SeatId,
  CabinClass,
} from '@/lib/games/middle-seat/types';
import { cabinForRow, isMiddleSeat, validate } from '@/lib/games/middle-seat/validator';
import { tierForSeconds } from '@/lib/games/middle-seat/tiers';
import { buildShareString, formatTime } from '@/lib/games/middle-seat/share';

type Props = { puzzle: Puzzle; allPuzzles?: Puzzle[] };

function ResultModal({
  tier,
  seconds,
  onShare,
  onPlayAgain,
  showShareCopied,
  allPuzzles,
  activePuzzleId,
  onSwitchPuzzle,
}: {
  tier: ReturnType<typeof tierForSeconds>;
  seconds: number;
  onShare: () => void;
  onPlayAgain: () => void;
  showShareCopied: boolean;
  allPuzzles?: Puzzle[];
  activePuzzleId: string;
  onSwitchPuzzle: (p: Puzzle) => void;
}) {
  // Tier rank (0 = best). Used to pick a celebration vs chaos vibe.
  const isWin = tier.maxSeconds <= 240; // first/business/premium/main aisle
  const isMid = tier.maxSeconds > 240 && tier.maxSeconds <= 420;
  const isLoss = tier.maxSeconds > 420;

  const fallEmojis = isWin
    ? ['🥂', '🍾', '✨', '🎉', '🎊', '🌟', '💎']
    : isMid
    ? ['💺', '🪟', '🧳', '☁️']
    : ['🐈', '🤧', '👶', '😴', '🚽', '🍼', '🐾', '😬'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color:var(--color-primary)]/40 backdrop-blur-sm overflow-hidden">
      {/* One-shot confetti burst (wins only) */}
      {isWin ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i / 36) * Math.PI * 2;
            const dist = 220 + ((i * 17) % 180);
            const mx = `${Math.cos(angle) * dist}px`;
            const my = `${Math.sin(angle) * dist}px`;
            const size = 14 + ((i * 11) % 18);
            const palette = ['#6B2D8F', '#D4AF37', '#F8F5FB', '#FFFFFF'];
            const bg = palette[i % palette.length];
            return (
              <span
                key={i}
                className="absolute top-1/2 left-1/2 animate-ms-burst rounded-sm"
                style={{
                  width: `${size}px`,
                  height: `${size * 0.4}px`,
                  background: bg,
                  animationDelay: `${(i % 6) * 0.04}s`,
                  '--mx': mx,
                  '--my': my,
                } as React.CSSProperties}
                aria-hidden
              />
            );
          })}
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const emoji = fallEmojis[i % fallEmojis.length];
            const left = (i * 37) % 100;
            const delay = (i % 6) * 0.3;
            const duration = 5 + ((i * 7) % 4);
            const size = 22 + ((i * 13) % 24);
            return (
              <span
                key={i}
                className="absolute animate-msfall opacity-80"
                style={{
                  left: `${left}%`,
                  top: '-10%',
                  fontSize: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
                aria-hidden
              >
                {emoji}
              </span>
            );
          })}
        </div>
      )}

      <div
        className={[
          'relative max-w-md w-full rounded-[var(--radius-card)] p-6 shadow-2xl border-2',
          isWin
            ? 'bg-white border-[color:var(--color-accent)]'
            : isMid
            ? 'bg-white border-[color:var(--color-border-soft)]'
            : 'bg-[color:var(--color-background-soft)] border-[color:var(--color-border-soft)]',
        ].join(' ')}
      >
        {isWin ? (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-ui font-bold uppercase tracking-widest bg-[color:var(--color-accent)] text-[color:var(--color-text-primary)] shadow-md">
            ✦ Champagne Toast ✦
          </div>
        ) : null}
        <div className="text-7xl mb-3 text-center">{tier.emoji}</div>
        <div className="text-2xl font-display text-[color:var(--color-primary)] text-center mb-1 leading-tight">
          {tier.name}
        </div>
        <div className="font-ui tabular-nums text-sm text-[color:var(--color-text-secondary)] mb-3 text-center">
          Solved in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </div>
        <p className="text-sm mb-5 text-center italic text-[color:var(--color-text-primary)]">
          &ldquo;{tier.copy}&rdquo;
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={onShare} className="rg-btn-primary text-sm px-4 py-2">
            {showShareCopied ? '✓ Copied!' : 'Copy share text'}
          </button>
          <button type="button" onClick={onPlayAgain} className="rg-btn-secondary text-sm px-4 py-2">
            Play again
          </button>
        </div>
        {allPuzzles && allPuzzles.length > 1 ? (
          <div className="mt-4 pt-4 border-t border-[color:var(--color-border-soft)] text-center">
            <div className="text-xs text-[color:var(--color-text-secondary)] font-ui mb-2 uppercase tracking-wide">
              Try a different difficulty
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap">
              {allPuzzles
                .filter((p) => p.id !== activePuzzleId)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSwitchPuzzle(p)}
                    className="text-xs font-ui px-3 py-1 rounded-full bg-white border border-[color:var(--color-border-soft)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] uppercase tracking-wide"
                  >
                    {p.difficulty}
                  </button>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ pax, size = 32 }: { pax: Passenger; size?: number }) {
  if (pax.avatarSeed) {
    const style = pax.avatarStyle ?? 'personas';
    const url = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(pax.avatarSeed)}&backgroundType=solid&backgroundColor=ffffff`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full bg-white"
        draggable={false}
        data-avatar
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden>
      {pax.avatar}
    </span>
  );
}

function chipLabel(chip: Chip, all: Passenger[]): string {
  switch (chip.type) {
    case 'status_row':
      return `Row ≤${chip.maxRow}`;
    case 'class_required':
      return chip.cabin === 'first' ? '🥂 First class only' : '💺 Economy only';
    case 'couple': {
      const partner = all.find((p) => p.id === chip.with);
      return `❤️ Couple w/ ${partner?.name ?? '?'}`;
    }
    case 'adjacency':
      return `👥 Sit together (${chip.group})`;
    case 'exit_row_pref':
      return '📏 Tall — wants exit row';
    case 'bulkhead_required':
      return '🍼 Front row (bassinet)';
    case 'window_required':
      return '🪟 Window';
    case 'aisle_required':
      return '🚶 Aisle';
    case 'no_middle':
      return '🚫 No middle';
    case 'service_animal':
      return '🦮 Service animal';
    case 'infant_lap': {
      const parent = all.find((p) => p.id === chip.parent);
      return `🍼 Lap of ${parent?.name ?? '?'}`;
    }
    case 'allergic_to':
      return `🤧 Allergic to ${chip.tag}`;
    case 'pet_in_cabin':
      return `🐾 ${chip.tag} in carrier`;
    case 'feuding_with': {
      const enemy = all.find((p) => p.id === chip.with);
      return `😤 NOT next to ${enemy?.name ?? '?'}`;
    }
    case 'no_minor_behind':
      return '😴 No kid behind';
    case 'keep_distance':
      return chip.from === 'minor'
        ? `🚸 ≥${chip.minRows} rows from kids`
        : `🐾 ≥${chip.minRows} rows from pets`;
  }
}

function cabinColor(cabin: CabinClass | null): string {
  if (cabin === 'first') return 'bg-amber-50/80';
  return 'bg-white';
}

function cabinLabel(cabin: CabinClass): string {
  return cabin === 'first' ? '🥂 First Class' : '💺 Economy';
}

function difficultyBadge(d: Puzzle['difficulty']) {
  if (d === 'easy') return { label: 'Easy', className: 'bg-emerald-100 text-emerald-800' };
  if (d === 'medium') return { label: 'Medium', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Hard', className: 'bg-rose-100 text-rose-800' };
}

export default function MiddleSeatGame({ puzzle: initialPuzzle, allPuzzles }: Props) {
  const [activePuzzle, setActivePuzzle] = useState<Puzzle>(initialPuzzle);
  const puzzle = activePuzzle;
  const { layout, passengers } = puzzle;

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [showShareCopied, setShowShareCopied] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [logicMode, setLogicMode] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [hoverSeat, setHoverSeat] = useState<SeatId | null>(null);
  const tickRef = useRef<number | null>(null);

  const elapsedSeconds = useMemo(() => {
    if (!startedAt) return 0;
    const end = finishedAt ?? now;
    return Math.max(0, Math.floor((end - startedAt) / 1000));
  }, [startedAt, finishedAt, now]);

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    function tick() {
      if (document.visibilityState === 'visible') setNow(Date.now());
    }
    tickRef.current = window.setInterval(tick, 250) as unknown as number;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [startedAt, finishedAt]);

  useEffect(() => {
    let hiddenAt: number | null = null;
    function onVis() {
      if (!startedAt || finishedAt) return;
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt) {
        const drift = Date.now() - hiddenAt;
        setStartedAt((s) => (s ? s + drift : s));
        hiddenAt = null;
      }
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [startedAt, finishedAt]);

  const seatToPid = useMemo(() => {
    const m = new Map<SeatId, string>();
    for (const p of placements) m.set(p.seat, p.passengerId);
    return m;
  }, [placements]);

  const pidToSeat = useMemo(() => {
    const m = new Map<string, SeatId>();
    for (const p of placements) m.set(p.passengerId, p.seat);
    return m;
  }, [placements]);

  const seatedPids = useMemo(() => new Set(placements.map((p) => p.passengerId)), [placements]);

  const result = useMemo(
    () => validate(layout, passengers, placements),
    [layout, passengers, placements],
  );

  const startTimerIfNeeded = useCallback(() => {
    if (!startedAt) setStartedAt(Date.now());
  }, [startedAt]);

  const handleStart = useCallback(() => {
    setGameStarted(true);
    setStartedAt(Date.now());
  }, []);

  const autoStartIfNeeded = useCallback(() => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartedAt(Date.now());
    }
  }, [gameStarted]);

  const handleSeatClick = useCallback(
    (seat: SeatId) => {
      if (finishedAt) return;
      autoStartIfNeeded();
      const occupant = seatToPid.get(seat);
      if (selectedPid) {
        startTimerIfNeeded();
        setPlacements((prev) => {
          const next = prev.filter((p) => p.seat !== seat && p.passengerId !== selectedPid);
          next.push({ passengerId: selectedPid, seat });
          return next;
        });
        setSelectedPid(null);
        return;
      }
      if (occupant) setSelectedPid(occupant);
    },
    [finishedAt, seatToPid, selectedPid, startTimerIfNeeded, autoStartIfNeeded],
  );

  const handlePassengerClick = useCallback(
    (pid: string) => {
      if (finishedAt) return;
      autoStartIfNeeded();
      setSelectedPid((cur) => (cur === pid ? null : pid));
    },
    [finishedAt, autoStartIfNeeded],
  );

  const placeAt = useCallback(
    (pid: string, seat: SeatId) => {
      startTimerIfNeeded();
      setPlacements((prev) => {
        const next = prev.filter((p) => p.seat !== seat && p.passengerId !== pid);
        next.push({ passengerId: pid, seat });
        return next;
      });
      setSelectedPid(null);
    },
    [startTimerIfNeeded],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, pid: string) => {
      if (finishedAt) {
        e.preventDefault();
        return;
      }
      autoStartIfNeeded();
      e.dataTransfer.setData('text/plain', pid);
      e.dataTransfer.effectAllowed = 'move';
      // Use the avatar image as the drag preview (not the whole card).
      // The seat tile may also contain a 🍼 badge — target the avatar specifically.
      const avatarImg =
        e.currentTarget.querySelector<HTMLImageElement>('img[data-avatar]') ??
        e.currentTarget.querySelector('img');
      if (avatarImg) {
        const w = avatarImg.naturalWidth || avatarImg.width || 36;
        const h = avatarImg.naturalHeight || avatarImg.height || 36;
        e.dataTransfer.setDragImage(avatarImg, w / 2, h / 2);
      }
      setSelectedPid(pid);
    },
    [finishedAt, autoStartIfNeeded],
  );

  const handleDragOver = useCallback((e: React.DragEvent, seat?: SeatId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (seat) setHoverSeat(seat);
  }, []);

  const handleDragLeave = useCallback((seat: SeatId) => {
    setHoverSeat((cur) => (cur === seat ? null : cur));
  }, []);

  // Clear sticky drop-target highlight when a drag is cancelled (Esc, drop
  // outside, or browser cancel). Without this, the ring stays on a random seat.
  useEffect(() => {
    function onDragEnd() {
      setHoverSeat(null);
    }
    document.addEventListener('dragend', onDragEnd);
    return () => document.removeEventListener('dragend', onDragEnd);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, seat: SeatId) => {
      e.preventDefault();
      setHoverSeat(null);
      if (finishedAt) return;
      const pid = e.dataTransfer.getData('text/plain');
      if (!pid) return;
      placeAt(pid, seat);
    },
    [finishedAt, placeAt],
  );

  const handleSubmit = useCallback(() => {
    if (!result.isComplete) return;
    setFinishedAt(Date.now());
    setSelectedPid(null);
  }, [result.isComplete]);

  const handleReset = useCallback(() => {
    setPlacements([]);
    setSelectedPid(null);
    setStartedAt(null);
    setFinishedAt(null);
    setGameStarted(false);
    setNow(Date.now());
  }, []);

  const switchPuzzle = useCallback((p: Puzzle) => {
    setActivePuzzle(p);
    setPlacements([]);
    setSelectedPid(null);
    setStartedAt(null);
    setFinishedAt(null);
    setGameStarted(false);
    setNow(Date.now());
  }, []);

  const tier = finishedAt ? tierForSeconds(elapsedSeconds) : null;

  const handleShare = useCallback(async () => {
    if (!tier) return;
    const text = buildShareString(puzzle.date, tier, elapsedSeconds);
    try {
      await navigator.clipboard.writeText(text);
      setShowShareCopied(true);
      setTimeout(() => setShowShareCopied(false), 2000);
    } catch {
      /* noop */
    }
  }, [tier, puzzle.date, elapsedSeconds]);

  const rows = Array.from({ length: layout.rows }, (_, i) => i + 1);
  const wingRow = layout.exitRows[0] ?? Math.ceil(layout.rows / 2);
  const wingRowRef = useRef<HTMLDivElement | null>(null);
  const fuselageRef = useRef<HTMLDivElement | null>(null);
  const [wingTop, setWingTop] = useState<number | null>(null);
  useEffect(() => {
    function recompute() {
      const wingEl = wingRowRef.current;
      const fusEl = fuselageRef.current;
      if (!wingEl || !fusEl) return;
      const wingRect = wingEl.getBoundingClientRect();
      const fusRect = fusEl.getBoundingClientRect();
      setWingTop(wingRect.top - fusRect.top + wingRect.height / 2);
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    if (fuselageRef.current) ro.observe(fuselageRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [layout.rows, layout.letters.length]);
  const badge = difficultyBadge(puzzle.difficulty);

  // Layout has middle seats only if there are letters between aisle and edges.
  const hasMiddles = (() => {
    const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
    return layout.letters.some((_, i) => i > 0 && i < layout.letters.length - 1 && i !== aisleIdx && i !== aisleIdx + 1);
  })();

  // Lap infants ride with their parent and don't take their own seat.
  const lapInfants = passengers.filter((p) =>
    p.chips.some((c) => c.type === 'infant_lap'),
  );
  const seatablePassengers = passengers.filter((p) => !lapInfants.includes(p));
  const unseatedCount = seatablePassengers.length - placements.length;

  return (
    <div className="rg-container py-8">
      <header className="mb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display text-[color:var(--color-primary)]">Middle Seat</h1>
          <p className="text-[color:var(--color-text-secondary)] mt-2 text-sm max-w-2xl">
            Read the case. Drag every passenger to a seat that satisfies the clues. Solve as fast as you can — your finish time picks your tier, from 🥂 First Class Suite to 🧌 Last Row, Middle, TV Broken.
          </p>
        </div>
        {allPuzzles && allPuzzles.length > 1 ? (
          <div className="flex gap-1.5 shrink-0">
            {(['easy', 'medium', 'hard'] as const).map((diff) => {
              const isActive = puzzle.difficulty === diff;
              const targetPuzzle = (() => {
                // Cycle through puzzles of this difficulty if multiple exist;
                // pick the next one after the current.
                const matches = allPuzzles.filter((p) => p.difficulty === diff);
                if (matches.length === 0) return null;
                if (!isActive) return matches[0];
                const i = matches.findIndex((p) => p.id === puzzle.id);
                return matches[(i + 1) % matches.length];
              })();
              const dot =
                diff === 'easy' ? '🟢' : diff === 'medium' ? '🟡' : '🔴';
              const styles = isActive
                ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)] shadow-md scale-105'
                : 'bg-white text-[color:var(--color-text-primary)] border-[color:var(--color-border-soft)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] shadow-sm';
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => targetPuzzle && switchPuzzle(targetPuzzle)}
                  disabled={!targetPuzzle}
                  className={[
                    'text-xs font-ui font-bold uppercase tracking-wide px-3.5 py-2 rounded-full border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5',
                    styles,
                  ].join(' ')}
                >
                  <span aria-hidden className="text-[8px] leading-none">{dot}</span>
                  {diff}
                </button>
              );
            })}
          </div>
        ) : (
          <span className={`text-xs font-ui uppercase tracking-wide px-2 py-1 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </header>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <button
          type="button"
          onClick={() => setRulesOpen((v) => !v)}
          className="text-xs text-[color:var(--color-primary)] underline font-ui"
        >
          {rulesOpen ? 'Hide rules' : 'How do exit rows / front rows work?'}
        </button>
        <button
          type="button"
          onClick={() => setLogicMode((v) => !v)}
          role="switch"
          aria-checked={!logicMode}
          className="flex items-center gap-2 text-xs font-ui select-none"
        >
          <span className="text-[color:var(--color-text-secondary)]">Hint</span>
          <span
            className={[
              'relative inline-block w-10 h-5 rounded-full transition border',
              !logicMode
                ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]'
                : 'bg-zinc-200 border-zinc-300',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                !logicMode ? 'translate-x-[22px]' : 'translate-x-0.5',
              ].join(' ')}
            />
          </span>
        </button>
      </div>

      {rulesOpen ? (
        <div className="mb-4 p-3 rounded-[var(--radius-ui)] bg-[color:var(--color-background-soft)] border border-[color:var(--color-border-soft)] text-sm space-y-1.5">
          <p>
            <strong>Exit row</strong> (green ring) — the row by the emergency door. Extra legroom, but FAA
            says no minors, no infants on lap, and no service animals (they&apos;d block the exit).
          </p>
          <p>
            <strong>Front row</strong> (blue ring) — the first row of a cabin, with a wall in front. No
            seat ahead = extra legroom AND the only place a bassinet attaches for babies.
          </p>
          <p>
            <strong>Middle seat</strong> (amber) — the dreaded one. Some passengers have constraints
            saying they can&apos;t end up here.
          </p>
          <p>
            <strong>First class</strong> (gold tint) — reserved. Only passengers with a first-class
            ticket can sit here.
          </p>
          <p>
            <strong>Lap infants</strong> ride with their parent and don&apos;t take their own seat —
            you&apos;ll see them in &ldquo;Riding along&rdquo; below the passenger list.
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-[var(--radius-ui)] bg-[color:var(--color-background-soft)]">
        <div className="font-ui text-sm">
          {!gameStarted
            ? 'Read the case, then press Start.'
            : unseatedCount === 0
            ? '✅ Everyone seated'
            : (
              <>
                <span className="font-semibold text-[color:var(--color-primary)]">{unseatedCount}</span>{' '}
                <span className="text-[color:var(--color-text-secondary)]">left to seat — drag, or tap a passenger then a seat</span>
              </>
            )}
        </div>
        <div className="font-ui text-lg tabular-nums">{formatTime(elapsedSeconds)}</div>
        {!gameStarted ? (
          <button type="button" onClick={handleStart} className="rg-btn-primary text-sm px-5 py-2">
            ▶ Start
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!result.isComplete || !!finishedAt}
            className="rg-btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm px-4 py-2"
          >
            {finishedAt ? 'Done' : 'Submit'}
          </button>
        )}
      </div>

      {/* THREE-COLUMN: case (left) + passengers (middle) + airplane (right) */}
      <div className="grid gap-4 lg:grid-cols-[220px_180px_minmax(420px,_1fr)]">
        {/* LEFT COLUMN: case */}
        <div className="flex flex-col gap-3">
          {(puzzle.story || (puzzle.clues && puzzle.clues.length > 0)) ? (
            <div className="relative p-4 rounded-[var(--radius-card)] bg-[color:var(--color-background-soft)] border border-[color:var(--color-border-soft)] shadow-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[color:var(--color-primary)] via-[color:var(--color-accent)] to-[color:var(--color-primary)]" />
              <div className="font-display text-sm tracking-wider uppercase text-[color:var(--color-primary)] mb-2 flex items-center gap-1.5">
                <span aria-hidden>📁</span> The Case
              </div>
              {puzzle.story ? (
                <p className="text-xs italic text-[color:var(--color-text-secondary)] mb-2">
                  {puzzle.story}
                </p>
              ) : null}
              {puzzle.clues && puzzle.clues.length > 0 ? (
                <ol className="text-xs space-y-1.5 list-decimal pl-4 marker:text-[color:var(--color-primary)] marker:font-bold">
                  {puzzle.clues.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* MIDDLE COLUMN: passenger list */}
        <div>
          <h2 className="text-sm font-ui uppercase tracking-wide text-[color:var(--color-text-secondary)] mb-2">
            Passengers
          </h2>
          <div className="flex flex-col gap-1.5">
            {seatablePassengers.map((pax) => {
              const seated = seatedPids.has(pax.id);
              const seat = pidToSeat.get(pax.id);
              const selected = selectedPid === pax.id;
              return (
                <button
                  key={pax.id}
                  type="button"
                  draggable={!finishedAt}
                  onDragStart={(e) => handleDragStart(e, pax.id)}
                  onClick={() => handlePassengerClick(pax.id)}
                  disabled={!!finishedAt}
                  className={[
                    'text-left px-2.5 py-2 rounded-[var(--radius-ui)] border transition font-ui cursor-grab active:cursor-grabbing',
                    selected
                      ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)] shadow-md animate-ms-select'
                      : seated
                      ? 'bg-[color:var(--color-background-soft)] border-zinc-300 opacity-60'
                      : 'bg-white border-zinc-300 hover:bg-[color:var(--color-background-soft)] hover:shadow-sm',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0">
                      <Avatar pax={pax} size={36} />
                    </span>
                    <span className="text-sm font-medium flex-1 truncate">{pax.name}</span>
                    {seat ? (
                      <span
                        className={
                          selected
                            ? 'text-white/80 text-[11px] tabular-nums shrink-0'
                            : 'text-[color:var(--color-text-secondary)] text-[11px] tabular-nums shrink-0'
                        }
                      >
                        {seat}
                      </span>
                    ) : null}
                  </div>
                  {!logicMode && pax.chips.length > 0 ? (
                    <div className="text-xs flex flex-wrap gap-1 mt-1.5">
                      {pax.chips.map((c, i) => (
                        <span
                          key={i}
                          className={[
                            'px-1.5 py-0.5 rounded text-[10px]',
                            selected ? 'bg-white/20' : 'bg-[color:var(--color-background-soft)]',
                          ].join(' ')}
                        >
                          {chipLabel(c, passengers)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {!logicMode && pax.minor ? (
                    <div
                      className={
                        'text-[10px] mt-1 ' +
                        (selected ? 'text-white/70' : 'text-[color:var(--color-text-secondary)]')
                      }
                    >
                      minor (no exit row)
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          {lapInfants.length > 0 ? (
            <div className="mt-3 p-2 rounded-[var(--radius-ui)] bg-[color:var(--color-background-soft)] border border-[color:var(--color-border-soft)]">
              <div className="text-[10px] font-ui uppercase tracking-wider text-[color:var(--color-text-secondary)] mb-1">
                🍼 Riding along
              </div>
              {lapInfants.map((baby) => {
                const lapChip = baby.chips.find((c) => c.type === 'infant_lap');
                const parentName =
                  lapChip && lapChip.type === 'infant_lap'
                    ? passengers.find((p) => p.id === lapChip.parent)?.name
                    : null;
                return (
                  <div key={baby.id} className="flex items-center gap-2 text-xs">
                    <Avatar pax={baby} size={24} />
                    <span className="font-medium">{baby.name}</span>
                    <span className="text-[color:var(--color-text-secondary)]">
                      on {parentName ?? '?'}'s lap
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* AIRPLANE — wrapper clips wing overflow on narrow viewports */}
        <div className="relative w-full overflow-x-clip flex justify-center">
        <div className="relative mx-auto" style={{ maxWidth: 'fit-content' }}>
          {/* Nose with pilot — cockpit window */}
          <div className="mx-auto w-36 h-24 rounded-t-[4rem] bg-gradient-to-b from-white via-zinc-50 to-zinc-100 border-2 border-zinc-300 border-b-0 flex flex-col items-center justify-end pb-2 overflow-hidden relative">
            {/* Cockpit windshield */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-[1.5rem] rounded-b-md bg-gradient-to-b from-[color:var(--color-primary)] via-[#3a1a4a] to-[#1a0a25] border border-[color:var(--color-primary)]/40 shadow-inner overflow-hidden flex items-end justify-center pb-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.dicebear.com/9.x/personas/svg?seed=captain-amelia&backgroundType=solid&backgroundColor=ffffff"
                alt=""
                width={28}
                height={28}
                className="rounded-full ring-1 ring-white/40"
                draggable={false}
              />
            </div>
            <span className="text-[9px] font-ui uppercase tracking-[0.18em] text-zinc-500 mt-0.5 relative z-10">
              Capt. Amelia
            </span>
          </div>

          {/* Fuselage */}
          <div
            ref={fuselageRef}
            className="relative bg-gradient-to-b from-white via-zinc-50 to-white border-x-4 border-zinc-300 px-5 py-4"
          >
            {/* Livery stripe — subtle purple band along the fuselage */}
            <div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                left: 0,
                right: 0,
                background:
                  'linear-gradient(to bottom, transparent 0, transparent 4px, rgba(107,45,143,0.08) 4px, rgba(107,45,143,0.08) 6px, transparent 6px, transparent calc(100% - 6px), rgba(107,45,143,0.08) calc(100% - 6px), rgba(107,45,143,0.08) calc(100% - 4px), transparent calc(100% - 4px))',
              }}
              aria-hidden
            />

            {/* SWEPT-BACK WINGS — anchored to actual exit row */}
            {wingTop !== null ? (
              <div
                className="absolute left-0 right-0 pointer-events-none z-0"
                style={{ top: `${wingTop}px` }}
                aria-hidden
              >
                {/* Left wing */}
                <svg
                  className="absolute right-full top-1/2 -translate-y-1/2"
                  width="140"
                  height="64"
                  viewBox="0 0 140 64"
                >
                  <defs>
                    <linearGradient id="ms-wing-l" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#e4e4e7" />
                      <stop offset="100%" stopColor="#a1a1aa" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M140 18 L24 24 L0 40 L10 48 L140 44 Z"
                    fill="url(#ms-wing-l)"
                    stroke="#71717a"
                    strokeWidth="1"
                  />
                  {/* Engine */}
                  <ellipse cx="38" cy="44" rx="14" ry="5" fill="#52525b" stroke="#3f3f46" strokeWidth="0.5" />
                  <path d="M132 22 L132 42" stroke="#71717a" strokeWidth="0.5" />
                </svg>
                {/* Right wing */}
                <svg
                  className="absolute left-full top-1/2 -translate-y-1/2"
                  width="140"
                  height="64"
                  viewBox="0 0 140 64"
                >
                  <defs>
                    <linearGradient id="ms-wing-r" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#a1a1aa" />
                      <stop offset="100%" stopColor="#e4e4e7" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 18 L116 24 L140 40 L130 48 L0 44 Z"
                    fill="url(#ms-wing-r)"
                    stroke="#71717a"
                    strokeWidth="1"
                  />
                  <ellipse cx="102" cy="44" rx="14" ry="5" fill="#52525b" stroke="#3f3f46" strokeWidth="0.5" />
                  <path d="M8 22 L8 42" stroke="#71717a" strokeWidth="0.5" />
                </svg>
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5 mx-auto relative z-10" style={{ width: 'fit-content' }}>
              {rows.map((row) => {
                const isExit = layout.exitRows.includes(row);
                const isBulkhead = layout.bulkheadRows.includes(row);
                const cabin = cabinForRow(row, layout);
                const isCabinTransition =
                  row > 1 && cabinForRow(row - 1, layout) !== cabin;
                const showFirstClassPill =
                  cabin === 'first' && (row === 1 || cabinForRow(row - 1, layout) !== 'first');
                const showExitPill = isExit;
                return (
                  <div key={row}>
                    {showFirstClassPill ? (
                      <div className="flex justify-center mb-1">
                        <span className="text-[10px] font-ui uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[color:var(--color-accent)]/20 text-[color:var(--color-text-primary)] border border-[color:var(--color-accent)]/60">
                          🥂 First Class
                        </span>
                      </div>
                    ) : null}
                    {isCabinTransition ? (
                      <div className="flex items-center justify-center gap-2 my-2" aria-hidden>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent" />
                        <span className="text-[9px] font-ui uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
                          ✦ Galley ✦
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent" />
                      </div>
                    ) : null}
                    {showExitPill ? (
                      <div className="flex justify-center mb-1">
                        <span className="text-[10px] font-ui uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                          🚪 Exit Row
                        </span>
                      </div>
                    ) : null}
                    <div
                      ref={row === wingRow ? wingRowRef : undefined}
                      className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 ${cabinColor(cabin)}`}
                    >
                      <span className="w-8 h-8 flex items-center justify-center text-sm font-ui font-bold rounded-full bg-[color:var(--color-primary)] text-white tabular-nums shrink-0 shadow-sm">
                        {row}
                      </span>
                      {layout.letters.map((letter) => {
                        const seat: SeatId = `${row}${letter}`;
                        const pid = seatToPid.get(seat);
                        const pax = pid ? passengers.find((p) => p.id === pid) : null;
                        const blocked = layout.blocked.includes(seat);
                        const middle = isMiddleSeat(seat, layout);
                        const showAisleGap = letter === layout.aisleAfter;
                        return (
                          <div key={seat} className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={blocked || !!finishedAt}
                              onClick={() => handleSeatClick(seat)}
                              draggable={!!pax && !finishedAt}
                              onDragStart={(e) => pax && handleDragStart(e, pax.id)}
                              onDragOver={(e) => handleDragOver(e, seat)}
                              onDragLeave={() => handleDragLeave(seat)}
                              onDrop={(e) => handleDrop(e, seat)}
                              title={pax ? pax.name : `Seat ${seat}`}
                              aria-label={`Seat ${seat}${pax ? `, ${pax.name}` : ''}`}
                              className={[
                                'rg-tap-target relative flex items-center justify-center font-ui rounded-md border-2 transition w-12 h-12',
                                blocked
                                  ? 'bg-zinc-100 border-zinc-200 cursor-not-allowed opacity-50 [background-image:repeating-linear-gradient(45deg,_transparent,_transparent_4px,_rgba(0,0,0,0.06)_4px,_rgba(0,0,0,0.06)_5px)]'
                                  : pax
                                  ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] shadow-md cursor-grab active:cursor-grabbing'
                                  : middle
                                  ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white border-zinc-300 hover:bg-[color:var(--color-background-soft)] hover:border-[color:var(--color-primary)]/40',
                                hoverSeat === seat && !blocked
                                  ? 'ring-4 ring-[color:var(--color-primary)] scale-105 bg-[color:var(--color-background-soft)]'
                                  : '',
                                isExit ? 'ring-2 ring-emerald-400 ring-offset-1' : '',
                                isBulkhead ? 'ring-2 ring-sky-400 ring-offset-1' : '',
                              ].join(' ')}
                            >
                              {blocked ? null : pax ? (
                                <>
                                  <Avatar pax={pax} size={44} />
                                  {lapInfants.some((b) =>
                                    b.chips.some(
                                      (c) => c.type === 'infant_lap' && c.parent === pax.id,
                                    ),
                                  ) ? (
                                    <span
                                      className="absolute -bottom-1 -right-1 text-base bg-white rounded-full ring-2 ring-[color:var(--color-primary)] w-5 h-5 flex items-center justify-center shadow"
                                      aria-label="lap infant"
                                    >
                                      🍼
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-[11px] font-medium text-zinc-500">{letter}</span>
                              )}
                            </button>
                            {showAisleGap ? <span className="w-4" /> : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tail with vertical stabilizer + c4p mark */}
          <div className="relative mx-auto w-36 h-20 rounded-b-[3.5rem] bg-gradient-to-t from-white via-zinc-50 to-zinc-100 border-2 border-zinc-300 border-t-0 flex items-start justify-center pt-1.5">
            <div className="w-8 h-12 bg-gradient-to-b from-[color:var(--color-primary)] to-[#3a1a4a] rounded-t-md flex items-start justify-center pt-1 shadow-sm">
              <span className="text-[8px] font-display text-[color:var(--color-accent)] tracking-wider">c4p</span>
            </div>
          </div>

          {/* Ground shadow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-3 h-5 rounded-[100%] bg-black/15 blur-md animate-ms-shadow pointer-events-none"
            style={{ width: '60%' }}
            aria-hidden
          />

          <div className="flex flex-wrap gap-3 text-xs text-[color:var(--color-text-secondary)] mt-6 justify-center font-ui">
            {hasMiddles ? (
              <span>
                <span className="inline-block w-3 h-3 align-middle bg-amber-50 border border-amber-200 rounded-sm mr-1" />{' '}
                middle seat
              </span>
            ) : null}
            <span>
              <span className="inline-block w-3 h-3 align-middle ring-2 ring-emerald-400 bg-white rounded-sm mr-1" />{' '}
              exit row
            </span>
            <span>
              <span className="inline-block w-3 h-3 align-middle ring-2 ring-sky-400 bg-white rounded-sm mr-1" />{' '}
              front row
            </span>
          </div>
        </div>
        </div>
      </div>

      {!finishedAt && result.hardViolations.length > 0 ? (
        <div className="mb-6 p-3 rounded-[var(--radius-ui)] bg-amber-50 border border-amber-200 text-sm">
          {logicMode ? (
            <div>
              <span className="font-medium">{result.hardViolations.length}</span>{' '}
              {result.hardViolations.length === 1 ? 'clue' : 'clues'} still violated. Re-read the case.
            </div>
          ) : (
            <>
              <div className="font-medium mb-1">Constraints not yet met:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {result.hardViolations.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}

      {finishedAt && tier ? (
        <ResultModal
          tier={tier}
          seconds={elapsedSeconds}
          onShare={handleShare}
          onPlayAgain={handleReset}
          showShareCopied={showShareCopied}
          allPuzzles={allPuzzles}
          activePuzzleId={activePuzzle.id}
          onSwitchPuzzle={switchPuzzle}
        />
      ) : null}

      {!finishedAt && placements.length > 0 ? (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[color:var(--color-text-secondary)] underline"
          >
            Reset board
          </button>
        </div>
      ) : null}
    </div>
  );
}
