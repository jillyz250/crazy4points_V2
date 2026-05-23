import { notFound } from 'next/navigation'
import puzzles from '@/data/airport-ladder-puzzles.json'
import iataCodes from '@/data/iata-codes.json'
import Game from './Game'

export const dynamic = 'force-static'

interface Puzzle {
  slug: string
  week_of: string
  title: string
  subtitle: string
  start: string
  goal: string
  par: number
  sample_path: string[]
}

interface IataEntry {
  code: string
  name: string
  city: string
  country: string
}

export async function generateStaticParams() {
  return (puzzles as Puzzle[]).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const puzzle = (puzzles as Puzzle[]).find((p) => p.slug === slug)
  if (!puzzle) return { title: 'Puzzle not found' }
  return {
    title: `${puzzle.title} — Airport Code Ladder | crazy4points`,
    description: puzzle.subtitle,
  }
}

export default async function AirportLadderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const puzzle = (puzzles as Puzzle[]).find((p) => p.slug === slug)
  if (!puzzle) notFound()

  // Pass the full IATA dataset to the client so validation + neighbor
  // lookups + give-up BFS all run locally — no per-step network round-trip.
  // Total payload is ~80KB gzipped for ~6000 commercial airports; acceptable
  // for a one-off game page.
  return <Game puzzle={puzzle} iata={iataCodes as IataEntry[]} />
}
