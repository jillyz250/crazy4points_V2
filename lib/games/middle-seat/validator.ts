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

  const allSeated = passengers.every((pax) => seatByPid.has(pax.id));

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
    const seat = seatByPid.get(pax.id);
    if (!seat) continue;
    const { row } = parseSeat(seat);

    // FAA-style exit row rule: minors, infants on lap, and service animals
    // can't sit in exit rows.
    if (layout.exitRows.includes(row)) {
      if (pax.minor) {
        violations.push(`${pax.name} is a minor — can't sit in the exit row.`);
      }
      if (pax.chips.some((c) => c.type === 'infant_lap')) {
        violations.push(`${pax.name} (lap infant) can't sit in the exit row.`);
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
          violations.push(`${pax.name} can't sit next to ${chip.with}.`);
        }
      }
      if (chip.type === 'infant_lap') {
        const parentSeat = seatByPid.get(chip.parent);
        if (parentSeat && !seatsInSameRow(seat, parentSeat)) {
          violations.push(`${pax.name} must be in the same row as their parent.`);
        }
      }
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
            const indexes = seats
              .map((s) => layout.letters.indexOf(parseSeat(s).letter))
              .sort((a, b) => a - b);
            const contiguous = indexes.every((v, i) => i === 0 || v === indexes[i - 1] + 1);
            if (!contiguous) {
              violations.push(`Group "${chip.group}" must sit in contiguous seats.`);
            }
          }
        }
      }
    }
  }

  const hardViolations = Array.from(new Set(violations));

  return {
    hardViolations,
    allSeated,
    isComplete: allSeated && hardViolations.length === 0,
  };
}
