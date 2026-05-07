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

type Props = { puzzle: Puzzle };

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

export default function MiddleSeatGame({ puzzle }: Props) {
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

  const handleSeatClick = useCallback(
    (seat: SeatId) => {
      if (finishedAt || !gameStarted) return;
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
    [finishedAt, seatToPid, selectedPid, startTimerIfNeeded],
  );

  const handlePassengerClick = useCallback(
    (pid: string) => {
      if (finishedAt || !gameStarted) return;
      setSelectedPid((cur) => (cur === pid ? null : pid));
    },
    [finishedAt, gameStarted],
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
      if (finishedAt || !gameStarted) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', pid);
      e.dataTransfer.effectAllowed = 'move';
      // Use the avatar image as the drag preview (not the whole card).
      const avatarImg = e.currentTarget.querySelector('img');
      if (avatarImg) {
        const w = avatarImg.naturalWidth || avatarImg.width || 36;
        const h = avatarImg.naturalHeight || avatarImg.height || 36;
        e.dataTransfer.setDragImage(avatarImg, w / 2, h / 2);
      }
      setSelectedPid(pid);
    },
    [finishedAt, gameStarted],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, seat: SeatId) => {
      e.preventDefault();
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
  const badge = difficultyBadge(puzzle.difficulty);

  // Layout has middle seats only if there are letters between aisle and edges.
  const hasMiddles = (() => {
    const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
    return layout.letters.some((_, i) => i > 0 && i < layout.letters.length - 1 && i !== aisleIdx && i !== aisleIdx + 1);
  })();

  const cabinSeparators = new Set<number>();
  for (let i = 1; i < layout.rows; i++) {
    if (cabinForRow(i, layout) !== cabinForRow(i + 1, layout)) cabinSeparators.add(i);
  }

  const unseatedCount = passengers.length - placements.length;

  return (
    <div className="rg-container py-8">
      <header className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-display text-[color:var(--color-primary)]">Middle Seat</h1>
          <p className="text-[color:var(--color-text-secondary)] mt-2 text-sm">
            Tap a passenger, then tap a seat. Hard constraints must be met to submit. Faster = better tier.
          </p>
        </div>
        <span className={`text-xs font-ui uppercase tracking-wide px-2 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </header>

      <button
        type="button"
        onClick={() => setRulesOpen((v) => !v)}
        className="text-xs text-[color:var(--color-primary)] underline font-ui mb-3"
      >
        {rulesOpen ? 'Hide rules' : 'How do exit rows / front rows work?'}
      </button>

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
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-[var(--radius-ui)] bg-[color:var(--color-background-soft)]">
        <div className="font-ui text-sm">
          {!gameStarted
            ? 'Read the case, then press Start.'
            : unseatedCount === 0
            ? '✅ Everyone seated'
            : `${unseatedCount} left to seat`}
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
      <div className="grid gap-4 md:grid-cols-[240px_180px_1fr]">
        {/* LEFT COLUMN: hint + case */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setLogicMode((v) => !v)}
            className={[
              'self-start text-xs font-ui px-3 py-1.5 rounded-full border transition',
              logicMode
                ? 'bg-white border-[color:var(--color-primary)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-background-soft)]'
                : 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] text-white',
            ].join(' ')}
          >
            {logicMode ? '💡 Hint' : '✕ Hide hint'}
          </button>
          {puzzle.clues && puzzle.clues.length > 0 ? (
            <div className="p-3 rounded-[var(--radius-card)] bg-white border border-[color:var(--color-border-soft)] shadow-sm">
              <div className="text-xs font-ui uppercase tracking-wide text-[color:var(--color-text-secondary)] mb-2">
                The Case
              </div>
              {puzzle.story ? (
                <p className="text-xs italic text-[color:var(--color-text-secondary)] mb-2">
                  {puzzle.story}
                </p>
              ) : null}
              <ol className="text-xs space-y-1.5 list-decimal pl-4 marker:text-[color:var(--color-primary)] marker:font-bold">
                {puzzle.clues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        {/* MIDDLE COLUMN: passenger list */}
        <div>
          <h2 className="text-sm font-ui uppercase tracking-wide text-[color:var(--color-text-secondary)] mb-2">
            Passengers
          </h2>
          <div className="flex flex-col gap-1.5">
            {passengers.map((pax) => {
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
                      ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)] shadow-md'
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
        </div>

        {/* AIRPLANE */}
        <div className="relative mx-auto" style={{ maxWidth: 'fit-content' }}>
          {/* Nose */}
          <div className="mx-auto w-28 h-14 rounded-t-[3rem] bg-gradient-to-b from-white to-zinc-100 border-2 border-zinc-300 border-b-0 flex items-end justify-center pb-1">
            <span className="text-[10px] font-ui uppercase tracking-widest text-zinc-500">cockpit</span>
          </div>

          {/* Fuselage */}
          <div className="relative bg-zinc-50 border-x-4 border-zinc-300 px-4 py-4">
            {/* SWEPT-BACK WINGS — SVG */}
            <div
              className="absolute left-0 right-0 pointer-events-none z-0"
              style={{ top: `calc(${(wingRow - 0.5) / layout.rows} * 100%)` }}
            >
              {/* Left wing */}
              <svg
                className="absolute right-full top-1/2 -translate-y-1/2"
                width="120"
                height="56"
                viewBox="0 0 120 56"
                aria-hidden
              >
                <path
                  d="M120 16 L20 22 L0 36 L8 42 L120 40 Z"
                  fill="#d4d4d8"
                  stroke="#a1a1aa"
                  strokeWidth="1"
                />
                <path d="M118 18 L118 38" stroke="#a1a1aa" strokeWidth="0.5" />
              </svg>
              {/* Right wing */}
              <svg
                className="absolute left-full top-1/2 -translate-y-1/2"
                width="120"
                height="56"
                viewBox="0 0 120 56"
                aria-hidden
              >
                <path
                  d="M0 16 L100 22 L120 36 L112 42 L0 40 Z"
                  fill="#d4d4d8"
                  stroke="#a1a1aa"
                  strokeWidth="1"
                />
                <path d="M2 18 L2 38" stroke="#a1a1aa" strokeWidth="0.5" />
              </svg>
            </div>

            <div className="flex flex-col gap-1.5 mx-auto relative z-10" style={{ width: 'fit-content' }}>
              {rows.map((row) => {
                const isExit = layout.exitRows.includes(row);
                const isBulkhead = layout.bulkheadRows.includes(row);
                const cabin = cabinForRow(row, layout);
                const isFirstRowOfFirstClass = cabin === 'first' && !rows.includes(row - 1) ? false : false;
                const showFirstClassPill =
                  cabin === 'first' && (row === 1 || cabinForRow(row - 1, layout) !== 'first');
                const showExitPill = isExit;
                return (
                  <div key={row}>
                    {showFirstClassPill ? (
                      <div className="flex justify-center mb-1">
                        <span className="text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          🥂 First Class
                        </span>
                      </div>
                    ) : null}
                    {showExitPill ? (
                      <div className="flex justify-center mb-1">
                        <span className="text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🚪 Exit Row
                        </span>
                      </div>
                    ) : null}
                    <div className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 ${cabinColor(cabin)}`}>
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
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, seat)}
                              title={pax ? pax.name : `Seat ${seat}`}
                              aria-label={`Seat ${seat}${pax ? `, ${pax.name}` : ''}`}
                              className={[
                                'rg-tap-target relative flex items-center justify-center font-ui rounded-md border-2 transition w-12 h-12',
                                blocked
                                  ? 'bg-zinc-200 border-zinc-300 cursor-not-allowed'
                                  : pax
                                  ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] shadow-md cursor-grab active:cursor-grabbing'
                                  : middle
                                  ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white border-zinc-300 hover:bg-[color:var(--color-background-soft)] hover:border-[color:var(--color-primary)]/40',
                                isExit ? 'ring-2 ring-emerald-400 ring-offset-1' : '',
                                isBulkhead ? 'ring-2 ring-sky-400 ring-offset-1' : '',
                              ].join(' ')}
                            >
                              {pax ? (
                                <span className="overflow-hidden rounded-sm">
                                  <Avatar pax={pax} size={40} />
                                </span>
                              ) : (
                                <span className="text-[10px] opacity-50">{letter}</span>
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

          {/* Tail */}
          <div className="mx-auto w-32 h-16 rounded-b-[3rem] bg-gradient-to-t from-white to-zinc-100 border-2 border-zinc-300 border-t-0 flex items-start justify-center pt-1">
            <span className="text-[10px] font-ui uppercase tracking-widest text-zinc-500">tail</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[color:var(--color-text-secondary)] mt-4 justify-center font-ui">
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
        <div className="p-5 rounded-[var(--radius-card)] bg-[color:var(--color-background-soft)] border border-[color:var(--color-border-soft)]">
          <div className="text-4xl mb-2">{tier.emoji}</div>
          <div className="text-xl font-display text-[color:var(--color-primary)] mb-1">{tier.name}</div>
          <div className="font-ui tabular-nums text-sm text-[color:var(--color-text-secondary)] mb-3">
            Time: {formatTime(elapsedSeconds)}
          </div>
          <p className="text-sm mb-4">{tier.copy}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleShare} className="rg-btn-primary text-sm px-4 py-2">
              {showShareCopied ? 'Copied!' : 'Copy share text'}
            </button>
            <button type="button" onClick={handleReset} className="rg-btn-secondary text-sm px-4 py-2">
              Play again
            </button>
          </div>
        </div>
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
