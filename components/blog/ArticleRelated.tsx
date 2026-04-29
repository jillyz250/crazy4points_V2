import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

interface Props {
  primaryProgramSlug: string | null;
  secondaryProgramSlugs: string[] | null;
  cardSlugs: string[] | null;
}

interface Chip {
  href: string;
  label: string;
  kind: 'program' | 'card';
}

/**
 * "More on these" chip row at the bottom of an article — surfaces every
 * program and card the post is tagged with, each clickable to its own
 * /programs/<slug> or /cards/<slug> page. Pulls display names from the
 * tables (so a slug like `chase-world-of-hyatt-business` renders as
 * "Chase World of Hyatt Business").
 *
 * Server component — fetches names at render time. Renders nothing when
 * no surfaces are tagged (so old posts with no metadata stay clean).
 *
 * Issuer-level chips (Chase, Amex) are out of scope until /issuers/[slug]
 * pages exist.
 */
export default async function ArticleRelated({
  primaryProgramSlug,
  secondaryProgramSlugs,
  cardSlugs,
}: Props) {
  const programSlugs = Array.from(
    new Set(
      [primaryProgramSlug, ...(secondaryProgramSlugs ?? [])].filter(
        (s): s is string => !!s && s.trim().length > 0,
      ),
    ),
  );
  const cleanedCardSlugs = Array.from(
    new Set((cardSlugs ?? []).filter((s) => !!s && s.trim().length > 0)),
  );

  if (programSlugs.length === 0 && cleanedCardSlugs.length === 0) return null;

  const supabase = await createClient();

  const [programsRes, cardsRes] = await Promise.all([
    programSlugs.length > 0
      ? supabase.from('programs').select('slug, name').in('slug', programSlugs)
      : Promise.resolve({ data: [] as { slug: string; name: string }[] }),
    cleanedCardSlugs.length > 0
      ? supabase
          .from('credit_cards')
          .select('slug, name')
          .in('slug', cleanedCardSlugs)
      : Promise.resolve({ data: [] as { slug: string; name: string | null }[] }),
  ]);

  const programs = (programsRes.data ?? []) as { slug: string; name: string }[];
  const cards = (cardsRes.data ?? []) as { slug: string; name: string | null }[];

  // Preserve the ORDER from the props: primary first, then secondaries in
  // their array order, then cards in their array order. The DB queries
  // come back unordered, so we rebuild the chip list by walking the
  // input slugs and looking up each row.
  const chips: Chip[] = [];

  const programByslug = new Map(programs.map((p) => [p.slug, p.name]));
  for (const slug of programSlugs) {
    const name = programByslug.get(slug);
    if (!name) continue; // slug tagged but program row doesn't exist — skip silently
    chips.push({ href: `/programs/${slug}`, label: name, kind: 'program' });
  }

  const cardBySlug = new Map(cards.map((c) => [c.slug, c.name]));
  for (const slug of cleanedCardSlugs) {
    const name = cardBySlug.get(slug);
    if (!name) continue;
    chips.push({ href: `/cards/${slug}`, label: name, kind: 'card' });
  }

  if (chips.length === 0) return null;

  return (
    <section className="mt-14 border-t border-[var(--color-border-soft)] pt-8">
      <h2 className="font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        More on these
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={`${chip.kind}-${chip.href}`}>
            <Link
              href={chip.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-3 py-1.5 font-ui text-sm font-medium text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
            >
              <span aria-hidden className="text-xs opacity-70">
                {chip.kind === 'program' ? '✦' : '▢'}
              </span>
              <span>{chip.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
