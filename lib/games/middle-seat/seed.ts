import type { Puzzle, Layout } from './types';

// Regional jet — 4 letters, no middle seats. Tight = harder to brute force.
const REGIONAL_LAYOUT: Layout = {
  rows: 4,
  exitRows: [2],
  bulkheadRows: [1],
  blocked: [],
  letters: ['A', 'B', 'C', 'D'],
  aisleAfter: 'B',
  cabins: [
    { class: 'first', rows: [1] },
    { class: 'economy', rows: [2, 3, 4] },
  ],
};

const NARROWBODY_LAYOUT: Layout = {
  rows: 5,
  exitRows: [3],
  bulkheadRows: [1],
  blocked: [],
  letters: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  cabins: [
    { class: 'first', rows: [1] },
    { class: 'economy', rows: [2, 3, 4, 5] },
  ],
};

const BIG_NARROWBODY_LAYOUT: Layout = {
  rows: 6,
  exitRows: [3],
  bulkheadRows: [1],
  blocked: [],
  letters: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  cabins: [
    { class: 'first', rows: [1] },
    { class: 'economy', rows: [2, 3, 4, 5, 6] },
  ],
};

const PUZZLE_ROTATION: Omit<Puzzle, 'date'>[] = [
  {
    id: 'family-trip',
    difficulty: 'easy',
    story:
      "Friday afternoon flight to Orlando. Six passengers boarding a regional jet. Make it work before the gate agent loses patience.",
    clues: [
      "Marcus is a Diamond member and never flies anything but first class.",
      "Sarah is traveling with her two kids, Ezra and Mila — they all need to sit in the same row, side by side.",
      "Sam is 6'5\" — he absolutely must have an aisle seat.",
      "Lila gets motion sick unless she can stare out a window.",
      "Lila is also a light sleeper and gets cranky when kids kick her seat from behind.",
    ],
    layout: REGIONAL_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Marcus', avatar: '💼', avatarSeed: 'marcus-diamond', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'Sarah', avatar: '👩‍🦰', avatarSeed: 'mom-redhair-42', chips: [{ type: 'adjacency', group: 'fam' }] },
      { id: 'p3', name: 'Ezra', avatar: '🧒', avatarSeed: 'ezra-kid-7', minor: true, chips: [{ type: 'adjacency', group: 'fam' }] },
      { id: 'p4', name: 'Mila', avatar: '👧', avatarSeed: 'mila-girl-5', minor: true, chips: [{ type: 'adjacency', group: 'fam' }] },
      { id: 'p5', name: 'Sam', avatar: '🧑‍🦱', avatarSeed: 'sam-tall-curly', chips: [{ type: 'aisle_required' }] },
      {
        id: 'p6',
        name: 'Lila',
        avatar: '👵',
        avatarSeed: 'lila-grandma-67',
        chips: [{ type: 'window_required' }, { type: 'no_minor_behind' }],
      },
    ],
  },
  {
    id: 'business-crew',
    difficulty: 'medium',
    story:
      "Tuesday morning. Eight coworkers heading to the offsite. The CEO booked first class for himself and the CFO. Everyone else is in coach.",
    clues: [
      "The CEO and the CFO are both flying first class — nothing less.",
      "The three engineers (A, B, C) are working on a deck and need to sit in three contiguous seats, same row.",
      "The recruit is 6'4\" and has bad knees — he wants the exit row AND an aisle.",
      "The intern refuses to sit in a middle seat. Refuses.",
      "The new parent is bringing a bassinet — they need the front row of economy.",
    ],
    layout: NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'CEO', avatar: '🤵', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'CFO', avatar: '👔', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p3', name: 'Engineer A', avatar: '👩‍💻', chips: [{ type: 'adjacency', group: 'eng' }] },
      { id: 'p4', name: 'Engineer B', avatar: '👨‍💻', chips: [{ type: 'adjacency', group: 'eng' }] },
      { id: 'p5', name: 'Engineer C', avatar: '🧑‍💻', chips: [{ type: 'adjacency', group: 'eng' }] },
      {
        id: 'p6',
        name: 'Recruit',
        avatar: '🧑‍🎓',
        chips: [{ type: 'exit_row_pref' }, { type: 'aisle_required' }],
      },
      { id: 'p7', name: 'Intern', avatar: '🧑', chips: [{ type: 'no_middle' }] },
      { id: 'p8', name: 'New Parent', avatar: '🤱', chips: [{ type: 'bulkhead_required' }] },
    ],
  },
  {
    id: 'reunion',
    difficulty: 'medium',
    story:
      "Family reunion flight to Phoenix. Grandma upgraded herself. Everyone else is figuring it out at the gate.",
    clues: [
      "Grandma upgraded with miles — she's in first class.",
      "Uncle Joe and Aunt May are a couple. They need to sit next to each other.",
      "The three cousins (Riley, Casey, Jules) want a row together — three contiguous seats, same row.",
      "Jules gets airsick and needs a window.",
      "Sister has a long-haul layover after this — she wants an aisle to stretch.",
      "New Mom has the bassinet baby — front row of economy is the only place it attaches.",
    ],
    layout: NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Grandma', avatar: '👵', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'Uncle Joe', avatar: '👴', chips: [{ type: 'couple', with: 'p3' }] },
      { id: 'p3', name: 'Aunt May', avatar: '👩', chips: [{ type: 'couple', with: 'p2' }] },
      { id: 'p4', name: 'Riley', avatar: '🧑', chips: [{ type: 'adjacency', group: 'cuz' }] },
      { id: 'p5', name: 'Casey', avatar: '👩', chips: [{ type: 'adjacency', group: 'cuz' }] },
      {
        id: 'p6',
        name: 'Jules',
        avatar: '👨',
        chips: [{ type: 'adjacency', group: 'cuz' }, { type: 'window_required' }],
      },
      { id: 'p7', name: 'Sister', avatar: '👩‍🦱', chips: [{ type: 'aisle_required' }] },
      { id: 'p8', name: 'New Mom', avatar: '🤱', chips: [{ type: 'bulkhead_required' }] },
    ],
  },
  {
    id: 'allergy-airlines',
    difficulty: 'hard',
    story:
      "Sunday redeye. Eight strangers, a service dog, a cat in a carrier, and a baby. Good luck.",
    clues: [
      "Diana is Platinum — she's in first class.",
      "Mia is bringing her cat (in a carrier under the seat). She doesn't want a middle seat — the carrier needs aisle access.",
      "Owen is severely allergic to cats. He cannot share a row with the cat. He also wants a window — naps.",
      "Brad is flying with a service dog. The dog needs floor space — no middle seat, ever, and no exit row (FAA rule).",
      "Alex and Jordan used to date. It ended badly. They cannot sit next to each other.",
      "The Parent has the bassinet baby — they need the front row of economy.",
      "The Baby is on the parent's lap, so they share the parent's row exactly.",
    ],
    layout: BIG_NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Diana', avatar: '💼', chips: [{ type: 'class_required', cabin: 'first' }] },
      {
        id: 'p2',
        name: 'Mia',
        avatar: '😺',
        chips: [{ type: 'pet_in_cabin', tag: 'cat' }, { type: 'no_middle' }],
      },
      {
        id: 'p3',
        name: 'Owen',
        avatar: '🤧',
        chips: [{ type: 'allergic_to', tag: 'cat' }, { type: 'window_required' }],
      },
      { id: 'p4', name: 'Brad', avatar: '🦮', chips: [{ type: 'service_animal' }, { type: 'no_middle' }] },
      { id: 'p5', name: 'Alex', avatar: '😠', chips: [{ type: 'feuding_with', with: 'p6' }] },
      { id: 'p6', name: 'Jordan', avatar: '😤', chips: [{ type: 'feuding_with', with: 'p5' }] },
      { id: 'p7', name: 'Parent', avatar: '🤱', chips: [{ type: 'bulkhead_required' }] },
      { id: 'p8', name: 'Baby', avatar: '👶', minor: true, chips: [{ type: 'infant_lap', parent: 'p7' }] },
    ],
  },
];

function dayIndex(date: string): number {
  const epoch = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 86_400_000);
  return ((epoch % PUZZLE_ROTATION.length) + PUZZLE_ROTATION.length) % PUZZLE_ROTATION.length;
}

export function fallbackPuzzleForDate(date: string): Puzzle {
  const base = PUZZLE_ROTATION[dayIndex(date)];
  return { ...base, date };
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
