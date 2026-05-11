export type SeatId = string; // e.g. "12C"

export type CabinClass = 'first' | 'economy';

export type ChipType =
  | 'adjacency'
  | 'couple'
  | 'status_row'
  | 'exit_row_pref'
  | 'bulkhead_required'
  | 'window_required'
  | 'aisle_required'
  | 'no_middle'
  | 'service_animal'
  | 'infant_lap'
  | 'class_required'
  | 'allergic_to'
  | 'pet_in_cabin'
  | 'feuding_with'
  | 'no_minor_behind'
  | 'keep_distance';

export type Chip =
  | { type: 'adjacency'; group: string }
  | { type: 'couple'; with: string }
  | { type: 'status_row'; maxRow: number }
  | { type: 'exit_row_pref' }
  | { type: 'bulkhead_required' }
  | { type: 'window_required' }
  | { type: 'aisle_required' }
  | { type: 'no_middle' }
  | { type: 'service_animal' }
  | { type: 'infant_lap'; parent: string }
  | { type: 'class_required'; cabin: CabinClass }
  | { type: 'allergic_to'; tag: string } // can't share row with anyone whose pet_in_cabin tag matches
  | { type: 'pet_in_cabin'; tag: string }
  | { type: 'feuding_with'; with: string }
  | { type: 'no_minor_behind' }
  // Must sit at least `minRows` rows away from any passenger matching `from`
  // ('minor' = pax.minor or lap_infant; 'pet' = anyone with pet_in_cabin).
  | { type: 'keep_distance'; from: 'minor' | 'pet'; minRows: number };

export type Passenger = {
  id: string;
  name: string;
  avatar: string; // emoji fallback
  avatarSeed?: string; // DiceBear seed — when set, used instead of emoji
  avatarStyle?: 'personas' | 'notionists' | 'avataaars'; // DiceBear style
  minor?: boolean;
  chips: Chip[];
};

export type Cabin = {
  class: CabinClass;
  rows: number[];
};

export type Layout = {
  rows: number;
  exitRows: number[];
  bulkheadRows: number[];
  blocked: SeatId[];
  letters: string[];
  aisleAfter: string;
  cabins: Cabin[];
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Puzzle = {
  id: string;
  date: string;
  difficulty: Difficulty;
  story?: string; // 1-2 sentence setup ("Friday redeye to Vegas. Boarding starts in 8 minutes.")
  clues: string[]; // prose logic-puzzle clues — what the player reads to deduce constraints
  layout: Layout;
  passengers: Passenger[];
};

export type Placement = { passengerId: string; seat: SeatId };

export type ValidationResult = {
  hardViolations: string[];
  isComplete: boolean;
  allSeated: boolean;
};

export type Tier = {
  key: string;
  emoji: string;
  name: string;
  copy: string;
  maxSeconds: number;
};
