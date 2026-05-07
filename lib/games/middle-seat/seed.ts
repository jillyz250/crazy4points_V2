import type { Puzzle, Layout } from './types';

// Regional jet — 4 letters, no middle seats. Tight = harder to brute force.
const REGIONAL_LAYOUT: Layout = {
  rows: 4,
  exitRows: [2],
  bulkheadRows: [2],
  // 2-2 layout (regional jet) — first class already 2-2 by default.
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
  bulkheadRows: [2],
  // First class is 2-2: 1A,1B and 1E,1F (1C and 1D are aisle width).
  blocked: ['1C', '1D'],
  letters: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  cabins: [
    { class: 'first', rows: [1] },
    { class: 'economy', rows: [2, 3, 4, 5] },
  ],
};

const BIG_NARROWBODY_LAYOUT: Layout = {
  rows: 5,
  exitRows: [3],
  bulkheadRows: [2],
  // First class is 2-2: 1A,1B and 1E,1F.
  blocked: ['1C', '1D'],
  letters: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  cabins: [
    { class: 'first', rows: [1] },
    { class: 'economy', rows: [2, 3, 4, 5] },
  ],
};

export const PUZZLE_ROTATION: Omit<Puzzle, 'date'>[] = [
  {
    id: 'family-trip',
    difficulty: 'easy',
    story:
      "Friday afternoon flight to Orlando. Six passengers boarding a regional jet. Make it work before the gate agent loses patience.",
    clues: [
      "Marcus is a Diamond member and never flies anything but first class.",
      "Sarah is traveling with her toddler Ezra — they need to sit next to each other (same side of the aisle).",
      "Mila is Sarah's older kid — old enough to sit alone, but she gets bored fast and wants a window to watch the clouds.",
      "Sam is 6'5\" — he absolutely must have an aisle seat.",
      "Lila gets motion sick unless she can stare out a window.",
      "Lila is also a light sleeper and gets cranky when kids kick her seat from behind.",
    ],
    layout: REGIONAL_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Marcus', avatar: '💼', avatarSeed: 'marcus-diamond', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'Sarah', avatar: '👩‍🦰', avatarSeed: 'mom-redhair-42', chips: [{ type: 'adjacency', group: 'fam' }] },
      { id: 'p3', name: 'Ezra', avatar: '🧒', avatarSeed: 'ezra-kid-7', minor: true, chips: [{ type: 'adjacency', group: 'fam' }] },
      { id: 'p4', name: 'Mila', avatar: '👧', avatarSeed: 'mila-girl-5', minor: true, chips: [{ type: 'window_required' }] },
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
      "Tuesday morning. Eight coworkers heading to the offsite. The CEO booked first class for herself and the CFO. Everyone else is in coach.",
    clues: [
      "The CEO and the CFO are both flying first class — nothing less.",
      "The three engineers (A, B, C) are reviewing a pitch deck mid-flight — they need three contiguous seats in the same row.",
      "The recruit is 6'4\" with bad knees — he wants the exit row AND an aisle.",
      "The intern refuses to sit in a middle seat. Refuses.",
      "Maya is on maternity leave for the offsite — she's bringing her bassinet baby and needs the front row of economy.",
    ],
    layout: NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'CEO', avatar: '🤵', avatarSeed: 'drew-ceo-exec', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'CFO', avatar: '👔', avatarSeed: 'priya-cfo', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p3', name: 'Engineer A', avatar: '👩‍💻', avatarSeed: 'nora-engineer', chips: [{ type: 'adjacency', group: 'eng' }] },
      { id: 'p4', name: 'Engineer B', avatar: '👨‍💻', avatarSeed: 'ben-engineer', chips: [{ type: 'adjacency', group: 'eng' }] },
      { id: 'p5', name: 'Engineer C', avatar: '🧑‍💻', avatarSeed: 'carlos-engineer', chips: [{ type: 'adjacency', group: 'eng' }] },
      {
        id: 'p6',
        name: 'Recruit',
        avatar: '🧑‍🎓',
        avatarSeed: 'ash-recruit-tall',
        chips: [{ type: 'exit_row_pref' }, { type: 'aisle_required' }],
      },
      { id: 'p7', name: 'Intern', avatar: '🧑', avatarSeed: 'theo-intern', chips: [{ type: 'no_middle' }] },
      { id: 'p8', name: 'Maya', avatar: '🤱', avatarSeed: 'maya-bassinet', chips: [{ type: 'bulkhead_required' }] },
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
      "Sister has a long-haul layover after this — she wants an aisle so she can stretch.",
      "Bea has the bassinet baby — front row of economy is the only place it attaches.",
    ],
    layout: NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Grandma', avatar: '👵', avatarSeed: 'eleanor-grandma', chips: [{ type: 'class_required', cabin: 'first' }] },
      { id: 'p2', name: 'Uncle Joe', avatar: '👴', avatarSeed: 'joe-uncle', chips: [{ type: 'couple', with: 'p3' }] },
      { id: 'p3', name: 'Aunt May', avatar: '👩', avatarSeed: 'may-aunt', chips: [{ type: 'couple', with: 'p2' }] },
      { id: 'p4', name: 'Riley', avatar: '🧑', avatarSeed: 'riley-cousin', chips: [{ type: 'adjacency', group: 'cuz' }] },
      { id: 'p5', name: 'Casey', avatar: '👩', avatarSeed: 'casey-cousin', chips: [{ type: 'adjacency', group: 'cuz' }] },
      {
        id: 'p6',
        name: 'Jules',
        avatar: '👨',
        avatarSeed: 'jules-cousin',
        chips: [{ type: 'adjacency', group: 'cuz' }, { type: 'window_required' }],
      },
      { id: 'p7', name: 'Sister', avatar: '👩‍🦱', avatarSeed: 'tess-sister', chips: [{ type: 'aisle_required' }] },
      { id: 'p8', name: 'Bea', avatar: '🤱', avatarSeed: 'bea-newmom', chips: [{ type: 'bulkhead_required' }] },
    ],
  },
  {
    id: 'allergy-airlines',
    difficulty: 'hard',
    story:
      "Sunday redeye. Eight strangers, a service dog, a cat in a carrier, and a baby. Good luck.",
    clues: [
      "Diana and her husband Marcus are both Platinum — booked first class. They want to sit together (same side of the aisle).",
      "Mia is bringing her cat (carrier under the seat). She wants an aisle — no middle.",
      "Owen is severely allergic to cats. He needs at least 2 rows between him and the cat. He also wants a window — naps.",
      "Brad is flying with a service dog. The dog needs floor space — no middle seat, and FAA forbids exit row.",
      "Alex and Jordan used to date. It ended badly. They cannot sit next to each other.",
      "Alex is a Gold elite — never sits past row 3.",
      "Jordan is also Gold — also won't sit past row 4.",
      "Hannah has the bassinet baby — she needs the front row of economy.",
      "Eli is on Hannah's lap, so he rides along (no separate seat).",
      "Tom is 6'5\" — needs the exit row, with an aisle.",
      "Pria is a CEO trying to sleep — she needs at least 2 rows between her and any kid OR pet, AND a window.",
    ],
    layout: BIG_NARROWBODY_LAYOUT,
    passengers: [
      { id: 'p1', name: 'Diana', avatar: '💼', avatarSeed: 'diana-platinum', chips: [{ type: 'class_required', cabin: 'first' }, { type: 'couple', with: 'p9' }] },
      {
        id: 'p2',
        name: 'Mia',
        avatar: '😺',
        avatarSeed: 'mia-catlady',
        chips: [{ type: 'pet_in_cabin', tag: 'cat' }, { type: 'aisle_required' }],
      },
      {
        id: 'p3',
        name: 'Owen',
        avatar: '🤧',
        avatarSeed: 'owen-allergic',
        chips: [{ type: 'allergic_to', tag: 'cat' }, { type: 'window_required' }, { type: 'keep_distance', from: 'pet', minRows: 2 }],
      },
      { id: 'p4', name: 'Brad', avatar: '🦮', avatarSeed: 'brad-servicedog', chips: [{ type: 'service_animal' }, { type: 'no_middle' }] },
      { id: 'p5', name: 'Alex', avatar: '😠', avatarSeed: 'alex-ex', chips: [{ type: 'feuding_with', with: 'p6' }, { type: 'status_row', maxRow: 3 }] },
      { id: 'p6', name: 'Jordan', avatar: '😤', avatarSeed: 'jordan-ex', chips: [{ type: 'feuding_with', with: 'p5' }, { type: 'status_row', maxRow: 4 }] },
      { id: 'p7', name: 'Hannah', avatar: '🤱', avatarSeed: 'hannah-parent', chips: [{ type: 'bulkhead_required' }] },
      { id: 'p8', name: 'Eli', avatar: '👶', minor: true, chips: [{ type: 'infant_lap', parent: 'p7' }] },
      { id: 'p9', name: 'Marcus', avatar: '🤵', avatarSeed: 'marcus-husband-platinum', chips: [{ type: 'class_required', cabin: 'first' }, { type: 'couple', with: 'p1' }] },
      { id: 'p10', name: 'Tom', avatar: '🧑‍🦱', avatarSeed: 'tom-tall', chips: [{ type: 'exit_row_pref' }, { type: 'aisle_required' }] },
      {
        id: 'p11',
        name: 'Pria',
        avatar: '👩',
        avatarSeed: 'pria-lightsleeper',
        chips: [
          { type: 'window_required' },
          { type: 'keep_distance', from: 'minor', minRows: 2 },
          { type: 'keep_distance', from: 'pet', minRows: 2 },
        ],
      },
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
