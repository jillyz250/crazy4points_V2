'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import {
  upsertHotelProperties,
  updateHotelProperty,
  deleteHotelPropertyById,
  type HotelPropertyInsert,
  type HotelRegion,
} from '@/utils/supabase/queries'

const REGIONS: HotelRegion[] = ['americas', 'europe', 'asia_pacific', 'middle_east_africa']

function parseRegion(value: string | undefined): HotelRegion | null {
  if (!value) return null
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if ((REGIONS as string[]).includes(v)) return v as HotelRegion
  // Common aliases
  if (v === 'mea' || v === 'middle_east' || v === 'africa') return 'middle_east_africa'
  if (v === 'apac' || v === 'asia') return 'asia_pacific'
  if (v === 'na' || v === 'caribbean' || v === 'latam' || v === 'south_america' || v === 'north_america') {
    return 'americas'
  }
  return null
}

function parseInt0(value: string | undefined): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,_\s]/g, '')
  if (!cleaned || cleaned === '-') return null
  const n = Number.parseInt(cleaned, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'true' || v === 'yes' || v === 'y' || v === '1'
}

interface CsvRow {
  name: string
  brand?: string
  city?: string
  country?: string
  region?: string
  category?: string
  off_peak_points?: string
  standard_points?: string
  peak_points?: string
  hotel_url?: string
  all_inclusive?: string
  notes?: string
  last_verified?: string
}

function parseCsv(text: string): CsvRow[] {
  // Lightweight CSV parser — handles quoted fields with commas and escaped quotes.
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (ch === '"') {
          inQuotes = false
        } else {
          cur += ch
        }
      } else {
        if (ch === ',') {
          out.push(cur)
          cur = ''
        } else if (ch === '"' && cur.length === 0) {
          inQuotes = true
        } else {
          cur += ch
        }
      }
    }
    out.push(cur)
    return out
  }

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim()
    })
    rows.push(row as unknown as CsvRow)
  }
  return rows
}

export async function importPropertiesCsvAction(
  programId: string,
  programSlug: string,
  csvText: string
): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] }> {
  const errors: string[] = []
  const parsed = parseCsv(csvText)
  if (parsed.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0, errors: ['No rows found in CSV.'] }
  }

  const today = new Date().toISOString().slice(0, 10)
  const valid: HotelPropertyInsert[] = []
  let skipped = 0

  for (let i = 0; i < parsed.length; i++) {
    const r = parsed[i]
    const rowNum = i + 2 // +1 for header, +1 for 1-indexed
    if (!r.name || r.name.trim().length === 0) {
      errors.push(`Row ${rowNum}: missing name`)
      skipped++
      continue
    }
    valid.push({
      program_id: programId,
      name: r.name.trim(),
      brand: r.brand?.trim() || null,
      city: r.city?.trim() || null,
      country: r.country?.trim() || null,
      region: parseRegion(r.region),
      category: r.category?.trim() || null,
      off_peak_points: parseInt0(r.off_peak_points),
      standard_points: parseInt0(r.standard_points),
      peak_points: parseInt0(r.peak_points),
      hotel_url: r.hotel_url?.trim() || null,
      all_inclusive: parseBool(r.all_inclusive),
      notes: r.notes?.trim() || null,
      last_verified: r.last_verified?.trim() || today,
    })
  }

  const supabase = createAdminClient()
  const { inserted, updated } = await upsertHotelProperties(supabase, valid)

  revalidatePath(`/admin/programs/${programSlug}/properties`)
  revalidatePath(`/programs/${programSlug}`)

  return { inserted, updated, skipped, errors }
}

export async function updatePropertyAction(
  id: string,
  programSlug: string,
  patch: Partial<HotelPropertyInsert>
) {
  const supabase = createAdminClient()
  await updateHotelProperty(supabase, id, patch)
  revalidatePath(`/admin/programs/${programSlug}/properties`)
  revalidatePath(`/programs/${programSlug}`)
}

export async function deletePropertyAction(id: string, programSlug: string) {
  const supabase = createAdminClient()
  await deleteHotelPropertyById(supabase, id)
  revalidatePath(`/admin/programs/${programSlug}/properties`)
  revalidatePath(`/programs/${programSlug}`)
}
