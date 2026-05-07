import type { CabinClass, Layout, Passenger, Placement, SeatId, ValidationResult } from './types';

export function parseSeat(seat: SeatId): { row: number; letter: string } {
  const m = seat.match(/^(\d+)([A-Z])$/);
  if (!m) throw new Error(`bad seat id: ${seat}`);
  return { row: Number(m[1]), letter: m[2] };
}

export function isMiddleSeat(seat: SeatId, layout: Layout): boolean {
  const { letter } = parseSeat(seat);
  const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
  const idx = layout.letters.indexOf(letter);
  if (idx <= 0 || idx >= layout.letters.length - 1) return false;
  if (idx === aisleIdx || idx === aisleIdx + 1) return false;
  return true;
}

export function isWindowSeat(seat: SeatId, layout: Layout): boolean {
  const { letter } = parseSeat(seat);
  const idx = layout.letters.indexOf(letter);
  return idx === 0 || idx === layout.letters.length - 1;
}

export function isAisleSeat(seat: SeatId, layout: Layout): boolean {
  const { letter } = parseSeat(seat);
  const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
  const idx = layout.letters.indexOf(letter);
  return idx === aisleIdx || idx === aisleIdx + 1;
}

export function cabinForRow(row: number, layout: Layout): CabinClass | null {
  for (const c of layout.cabins) if (c.rows.includes(row)) return c.class;
  return null;
}

function seatsAdjacentSameRow(a: SeatId, b: SeatId, layout: Layout): boolean {
  const pa = parseSeat(a);
  const pb = parseSeat(b);
  if (pa.row !== pb.row) return false;
  const ia = layout.letters.indexOf(pa.letter);
  const ib = layout.letters.indexOf(pb.letter);
  if (ia < 0 || ib < 0) return false;
  const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
  const between = Math.min(ia, ib) <= aisleIdx && Math.max(ia, ib) > aisleIdx;
  if (between) return false;
  return Math.abs(ia - ib) === 1;
}

function seatsInSameRow(a: SeatId, b: SeatId): boolean {
  return parseSeat(a).row === parseSeat(b).row;
}

export function validate(
  layout: Layout,
  passengers: Passenger[],
  placements: Placement[],
): ValidationResult {
  const violations: string[] = [];
  const seatByPid = new Map<string, SeatId>();
  for (const p of placements) seatByPid.set(p.passengerId, p.seat);

  // Lap infants don't get their own seat — they ride along with their parent.
  // They count as "seated" once the parent is seated.
  const isLapInfant = (pax: Passenger) =>
    pax.chips.some((c) => c.type === 'infant_lap');
  const allSeated = passengers.every((pax) => {
    if (isLapInfant(pax)) {
      const lapChip = pax.chips.find((c) => c.type === 'infant_lap');
      if (lapChip && lapChip.type === 'infant_lap') {
        return seatByPid.has(lapChip.parent);
      }
    }
    return seatByPid.has(pax.id);
  });

  // Tag pets by tag for allergy checks.
  const petsByTag = new Map<string, string[]>(); // tag -> passenger ids
  for (const pax of passengers) {
    for (const c of pax.chips) {
      if (c.type === 'pet_in_cabin') {
        const arr = petsByTag.get(c.tag) ?? [];
        arr.push(pax.id);
        petsByTag.set(c.tag, arr);
      }
    }
  }

  for (const pax of passengers) {
    // Lap infants don't get a seat — skip seat-based checks for them; their
    // location is implied by their parent's seat (validated below).
    if (isLapInfant(pax)) continue;
    const seat = seatByPid.get(pax.id);
    if (!seat) continue;
    const { row } = parseSeat(seat);
    const cabin = cabinForRow(row, layout);

    // First-class is reserved: only passengers with class_required:first
    // are allowed in first class rows.
    if (cabin === 'first' && !pax.chips.some((c) => c.type === 'class_required' && c.cabin === 'first')) {
      violations.push(`${pax.name} doesn't have a first-class ticket — can't sit in first class.`);
    }

    // FAA-style exit row rule: minors and service animals can't sit in exit rows.
    if (layout.exitRows.includes(row)) {
      if (pax.minor) {
        violations.push(`${pax.name} is a minor — can't sit in the exit row.`);
      }
      if (pax.chips.some((c) => c.type === 'service_animal')) {
        violations.push(`${pax.name}'s service animal can't sit in the exit row.`);
      }
    }

    for (const chip of pax.chips) {
      if (chip.type === 'status_row' && row > chip.maxRow) {
        violations.push(`${pax.name} needs row ${chip.maxRow} or earlier.`);
      }
      if (chip.type === 'bulkhead_required' && !layout.bulkheadRows.includes(row)) {
        violations.push(`${pax.name} needs a bulkhead row.`);
      }
      if (chip.type === 'window_required' && !isWindowSeat(seat, layout)) {
        violations.push(`${pax.name} needs a window.`);
      }
      if (chip.type === 'aisle_required' && !isAisleSeat(seat, layout)) {
        violations.push(`${pax.name} needs an aisle.`);
      }
      if (chip.type === 'no_middle' && isMiddleSeat(seat, layout)) {
        violations.push(`${pax.name} can't be in a middle seat.`);
      }
      if (chip.type === 'service_animal') {
        if (isMiddleSeat(seat, layout)) {
          violations.push(`${pax.name}'s service animal needs aisle or window — not middle.`);
        }
      }
      if (chip.type === 'class_required') {
        const cabin = cabinForRow(row, layout);
        if (cabin !== chip.cabin) {
          violations.push(`${pax.name} must sit in ${chip.cabin}.`);
        }
      }
      if (chip.type === 'couple') {
        const other = seatByPid.get(chip.with);
        if (other && !seatsAdjacentSameRow(seat, other, layout)) {
          violations.push(`${pax.name} must sit next to their partner.`);
        }
      }
      if (chip.type === 'no_minor_behind') {
        // No passenger flagged minor in the same column, exactly one row behind.
        const myCol = layout.letters.indexOf(parseSeat(seat).letter);
        for (const other of passengers) {
          if (other.id === pax.id) continue;
          if (!other.minor) continue;
          const otherSeat = seatByPid.get(other.id);
          if (!otherSeat) continue;
          const op = parseSeat(otherSeat);
          if (op.row === row + 1 && layout.letters.indexOf(op.letter) === myCol) {
            violations.push(`${pax.name} doesn't want a kid kicking their seat from behind.`);
          }
        }
      }
      if (chip.type === 'feuding_with') {
        const other = seatByPid.get(chip.with);
        if (other && seatsAdjacentSameRow(seat, other, layout)) {
          const enemy = passengers.find((q) => q.id === chip.with);
          violations.push(`${pax.name} can't sit next to ${enemy?.name ?? chip.with}.`);
        }
      }
      if (chip.type === 'exit_row_pref' && !layout.exitRows.includes(row)) {
        violations.push(`${pax.name} needs the exit row.`);
      }
      // (infant_lap chip is handled below via parent's seat — the infant
      //  doesn't have their own seat to check.)
      if (chip.type === 'allergic_to') {
        const petIds = petsByTag.get(chip.tag) ?? [];
        for (const petId of petIds) {
          const petSeat = seatByPid.get(petId);
          if (petSeat && seatsInSameRow(seat, petSeat)) {
            violations.push(`${pax.name} is allergic — can't share a row with the pet.`);
          }
        }
      }
      if (chip.type === 'adjacency') {
        const groupMembers = passengers.filter((q) =>
          q.chips.some((c) => c.type === 'adjacency' && c.group === chip.group),
        );
        const seats = groupMembers.map((q) => seatByPid.get(q.id)).filter(Boolean) as SeatId[];
        if (seats.length === groupMembers.length) {
          const rows = new Set(seats.map((s) => parseSeat(s).row));
          if (rows.size > 1) {
            violations.push(`Group "${chip.group}" must sit in the same row.`);
          } else {
            const aisleIdx = layout.letters.indexOf(layout.aisleAfter);
            const indexes = seats
              .map((s) => layout.letters.indexOf(parseSeat(s).letter))
              .sort((a, b) => a - b);
            const contiguous = indexes.every((v, i) => i === 0 || v === indexes[i - 1] + 1);
            // "Side by side" must mean same side of the aisle — no aisle-spanning groups.
            const spansAisle = indexes.some((v) => v <= aisleIdx) && indexes.some((v) => v > aisleIdx);
            if (!contiguous || spansAisle) {
              violations.push(`Group "${chip.group}" must sit side by side on the same side of the aisle.`);
            }
          }
        }
      }
    }
  }

  // Lap infants ride with their parent. If the parent is in an exit row,
  // FAA forbids it (so it's the parent that's violating, not the infant).
  for (const pax of passengers) {
    if (!isLapInfant(pax)) continue;
    const lapChip = pax.chips.find((c) => c.type === 'infant_lap');
    if (!lapChip || lapChip.type !== 'infant_lap') continue;
    const parentSeat = seatByPid.get(lapChip.parent);
    if (!parentSeat) continue;
    const parentRow = parseSeat(parentSeat).row;
    if (layout.exitRows.includes(parentRow)) {
      const parent = passengers.find((q) => q.id === lapChip.parent);
      violations.push(
        `${parent?.name ?? 'Parent'} can't sit in the exit row with a lap infant (${pax.name}).`,
      );
    }
  }

  const hardViolations = Array.from(new Set(violations));

  return {
    hardViolations,
    allSeated,
    isComplete: allSeated && hardViolations.length === 0,
  };
}
