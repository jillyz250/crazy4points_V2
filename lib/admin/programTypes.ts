import type { Program, ProgramType } from '@/utils/supabase/queries'

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  credit_card: 'Credit Card',
  airline: 'Airline',
  hotel: 'Hotel',
  loyalty_program: 'Loyalty Program',
  alliance: 'Alliance',
  car_rental: 'Car Rental',
  cruise: 'Cruise',
  shopping_portal: 'Shopping Portal',
  travel_portal: 'Travel Portal',
  lounge_network: 'Lounge Network',
  ota: 'OTA',
}

export type ProgramLite = Pick<Program, 'id' | 'name' | 'type'>

export function groupProgramsByType<T extends ProgramLite>(programs: T[]): Record<string, T[]> {
  return programs.reduce<Record<string, T[]>>((acc, p) => {
    const key = p.type as string
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})
}
