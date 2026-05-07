import type { Tier } from './types';

export const TIERS: Tier[] = [
  {
    key: 'first_class',
    emoji: '🥂',
    name: 'First Class Suite, Arriving Early',
    copy: "Lie-flat, caviar service, and a tailwind shaved 40 minutes off the flight. The pilot personally thanks you for flying.",
    maxSeconds: 45,
  },
  {
    key: 'business',
    emoji: '🍾',
    name: 'Business Class Window, Upgrade Cleared',
    copy: "You paid economy. Got tapped at the gate. Pajamas in a bag. Champagne before takeoff. This was meant for you.",
    maxSeconds: 90,
  },
  {
    key: 'premium_economy',
    emoji: '💺',
    name: 'Premium Economy 7A, Empty Middle',
    copy: "Extra legroom AND nobody next to you. You spread out like you own the row. You do. You own the row.",
    maxSeconds: 150,
  },
  {
    key: 'main_aisle',
    emoji: '🎒',
    name: 'Main Cabin Aisle, Exit Row',
    copy: "Legs out. Bag at your feet. First off the plane. Solid travel day, no notes.",
    maxSeconds: 240,
  },
  {
    key: 'window_24a',
    emoji: '🪟',
    name: 'Window in 24A, Decent Nap',
    copy: "Behind the wing. Engine hum. You slept through the snack cart and you don't regret it.",
    maxSeconds: 330,
  },
  {
    key: 'galley_baby',
    emoji: '😬',
    name: 'Middle Seat by the Galley, Crying Baby',
    copy: "Cart hits your elbow every 11 minutes. The baby has been crying since boarding. Your headphones are in your checked bag.",
    maxSeconds: 420,
  },
  {
    key: 'lav_flush',
    emoji: '🚽',
    name: 'Middle Seat by the Lav, Broken Flush Light',
    copy: "It dings. It dings AGAIN. Someone's been in there 22 minutes. You've stopped speculating about why.",
    maxSeconds: 540,
  },
  {
    key: 'last_row',
    emoji: '🧌',
    name: "Last Row, Middle, Doesn't Recline, TV Broken, Diverted to Buffalo",
    copy: "Bin's full. Ankle in your face. Black screen for six hours. Then a weather diversion. You're sleeping on an airport bench tonight.",
    maxSeconds: Infinity,
  },
];

export function tierForSeconds(seconds: number): Tier {
  return TIERS.find((t) => seconds < t.maxSeconds) ?? TIERS[TIERS.length - 1];
}
