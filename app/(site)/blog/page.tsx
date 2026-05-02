import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { BLOG_CATEGORIES, isBlogCategorySlug, getBlogCategoryLabel } from '@/lib/blog/categories';
import HeroImageOrFallback from '@/components/blog/HeroImageOrFallback';

export const revalidate = 60;

/**
 * Phase 2 — type/program/card filter taxonomy.
 *
 * "Type" is the top-level filter the reader picks first: Airlines,
 * Hotels, or Credit Cards. Each post's type-set is derived dynamically
 * from its tagged programs (lookup type via `programs.type`) and from
 * whether it has any `card_slugs`. Cross-type posts (e.g. Marriott →
 * American) appear under all matching types.
 *
 * Editorial intent: we don't expose a fourth "Transferable Currencies"
 * type even though programs.type='transferable' exists in the DB. Posts
 * about Chase UR / Amex MR are tagged with the destination program (if
 * any) so they bucket as airlines or hotels. If we author a lot of
 * pure-transferable content later, add a 'currencies' bucket here.
 */
const TYPE_BUCKETS = [
  { slug: 'airlines', label: 'Airlines', programType: 'airline' as const },
  { slug: 'hotels', label: 'Hotels', programType: 'hotel' as const },
  { slug: 'cards', label: 'Credit Cards', programType: null }, // 'cards' uses card_slugs, not programs
] as const;

type TypeBucketSlug = (typeof TYPE_BUCKETS)[number]['slug'];

function isTypeBucketSlug(value: string | null | undefined): value is TypeBucketSlug {
  return !!value && TYPE_BUCKETS.some((t) => t.slug === value);
}

interface BlogRow {
  slug: string;
  title: string;
  pitch: string;
  excerpt: string | null;
  hero_image_url: string | null;
  category: string | null;
  primary_program_slug: string | null;
  // Phase 2 — needed for cross-type filtering and the "Hotel · Airline" badge.
  secondary_program_slugs: string[] | null;
  card_slugs: string[] | null;
  reading_time_minutes: number | null;
  written_by: string | null;
  published_at: string | null;
  featured: boolean | null;
  featured_rank: number | null;
}

type Props = {
  searchParams: Promise<{
    category?: string;
    type?: string;
    program?: string;
    card?: string;
    q?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const category = sp.category;

  // Filtered category views are noindex+canonical-to-base. Avoids duplicate-content
  // issues until we promote category to its own route in a later ship.
  if (category && isBlogCategorySlug(category)) {
    const label = getBlogCategoryLabel(category);
    return {
      title: `${label} — Blog — crazy4points`,
      description: `Articles in ${label}. Award travel tactics, transfer plays, and the occasional sweet spot.`,
      alternates: { canonical: '/blog' },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: 'Blog — crazy4points',
    description:
      'Award travel tactics, transfer plays, and the occasional sweet spot — written in plain English.',
    alternates: { canonical: '/blog' },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Build a /blog URL preserving the active filters that should carry over,
 * dropping the ones that should reset. Nudges:
 *   - Changing CATEGORY preserves type/program/card so the reader can drill
 *     across categories within the same subject.
 *   - Changing TYPE drops program/card because those are scoped to a type
 *     (a hotel program filter doesn't make sense after switching to airlines).
 *   - Changing PROGRAM/CARD preserves type but drops the other axis.
 */
function buildBlogHref(params: {
  category?: string | null;
  type?: string | null;
  program?: string | null;
  card?: string | null;
  q?: string | null;
}): string {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  if (params.type) search.set('type', params.type);
  if (params.program) search.set('program', params.program);
  if (params.card) search.set('card', params.card);
  if (params.q) search.set('q', params.q);
  const qs = search.toString();
  return qs ? `/blog?${qs}` : '/blog';
}

export default async function BlogIndex({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryFilter = isBlogCategorySlug(sp.category) ? sp.category : null;
  const typeFilter = isTypeBucketSlug(sp.type) ? sp.type : null;
  // program/card filters are free-form slugs; we sanitize via existence
  // check after the DB returns the program/card lists.
  const programFilterRaw = sp.program?.trim() || null;
  const cardFilterRaw = sp.card?.trim() || null;
  // Search query — trim, lowercase for case-insensitive ilike. Capped at
  // 80 chars to keep URLs sane and prevent silly inputs.
  const qRaw = sp.q?.trim() ?? '';
  const qFilter = qRaw.length > 0 ? qRaw.slice(0, 80) : null;

  const supabase = await createClient();
  let query = supabase
    .from('content_ideas')
    .select(
      'slug, title, pitch, excerpt, hero_image_url, category, primary_program_slug, secondary_program_slugs, card_slugs, reading_time_minutes, written_by, published_at, featured, featured_rank'
    )
    .eq('type', 'blog')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('featured', { ascending: false })
    .order('featured_rank', { ascending: true, nullsFirst: false })
    .order('published_at', { ascending: false })
    .limit(60);

  if (categoryFilter) {
    query = query.eq('category', categoryFilter);
  }

  if (qFilter) {
    // Title + excerpt search. PostgREST .or() with ilike on both columns;
    // % wildcards on each side so substrings match. Excerpt commonly
    // captures the article's key entities (program names, dates) so this
    // covers most reader intent without needing to scan article_body.
    const escaped = qFilter.replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`);
  }

  // Fetch posts + programs + cards in parallel. Programs gives us the
  // slug→type map for computing each post's type-set; cards is needed
  // to render the second-row chips when type=cards.
  const [postsRes, programsRes, cardsRes] = await Promise.all([
    query,
    supabase.from('programs').select('slug, name, type'),
    supabase.from('credit_cards').select('slug, name'),
  ]);

  const allPosts = (postsRes.data ?? []) as BlogRow[];
  const programs = (programsRes.data ?? []) as { slug: string; name: string; type: string | null }[];
  const cards = (cardsRes.data ?? []) as { slug: string; name: string | null }[];

  const programType = new Map(programs.map((p) => [p.slug, p.type ?? null]));
  const programName = new Map(programs.map((p) => [p.slug, p.name]));
  const cardName = new Map(cards.map((c) => [c.slug, c.name ?? c.slug]));

  // For each post, compute the set of TYPE buckets it falls into. A post
  // with Marriott (hotel program) + American (airline program) tagged
  // matches BOTH 'hotels' and 'airlines'. card_slugs presence adds 'cards'.
  function computePostTypes(post: BlogRow): Set<TypeBucketSlug> {
    const set = new Set<TypeBucketSlug>();
    const taggedPrograms = [
      post.primary_program_slug,
      ...(post.secondary_program_slugs ?? []),
    ].filter((s): s is string => !!s);
    for (const slug of taggedPrograms) {
      const t = programType.get(slug);
      if (t === 'airline') set.add('airlines');
      if (t === 'hotel') set.add('hotels');
      // 'transferable' programs don't bucket as airlines or hotels —
      // they're transit currencies, not destinations.
    }
    if (post.card_slugs && post.card_slugs.length > 0) {
      set.add('cards');
    }
    return set;
  }

  // Apply type/program/card filters in-memory. (Postgres array filters
  // exist but compose awkwardly with the type-set logic, and admin lists
  // are bounded by limit=60.)
  const filteredPosts = allPosts.filter((post) => {
    if (typeFilter) {
      const types = computePostTypes(post);
      if (!types.has(typeFilter)) return false;
    }
    if (programFilterRaw) {
      const taggedPrograms = [
        post.primary_program_slug,
        ...(post.secondary_program_slugs ?? []),
      ].filter((s): s is string => !!s);
      if (!taggedPrograms.includes(programFilterRaw)) return false;
    }
    if (cardFilterRaw) {
      if (!post.card_slugs?.includes(cardFilterRaw)) return false;
    }
    return true;
  });

  // Compute the set of program/card slugs that actually appear on at
  // least one post within the current category filter. A flat list of
  // every program in the DB (40+ airlines, etc.) is unbrowsable; we
  // only want chips for programs/cards readers can actually click into
  // and find content for. The list grows organically as you publish.
  const taggedProgramSlugsInCategory = new Set<string>();
  const taggedCardSlugsInCategory = new Set<string>();
  for (const post of allPosts) {
    if (post.primary_program_slug) taggedProgramSlugsInCategory.add(post.primary_program_slug);
    for (const s of post.secondary_program_slugs ?? []) {
      if (s) taggedProgramSlugsInCategory.add(s);
    }
    for (const s of post.card_slugs ?? []) {
      if (s) taggedCardSlugsInCategory.add(s);
    }
  }

  // Build second-row chip list when a type is active. Filtered to slugs
  // that appear in at least one post in the current category.
  let secondRowChips: { slug: string; name: string; paramKey: 'program' | 'card' }[] = [];
  if (typeFilter === 'airlines') {
    secondRowChips = programs
      .filter((p) => p.type === 'airline' && taggedProgramSlugsInCategory.has(p.slug))
      .map((p) => ({ slug: p.slug, name: p.name, paramKey: 'program' as const }));
  } else if (typeFilter === 'hotels') {
    secondRowChips = programs
      .filter((p) => p.type === 'hotel' && taggedProgramSlugsInCategory.has(p.slug))
      .map((p) => ({ slug: p.slug, name: p.name, paramKey: 'program' as const }));
  } else if (typeFilter === 'cards') {
    secondRowChips = cards
      .filter((c) => taggedCardSlugsInCategory.has(c.slug))
      .map((c) => ({
        slug: c.slug,
        name: c.name ?? c.slug,
        paramKey: 'card' as const,
      }));
  }
  secondRowChips.sort((a, b) => a.name.localeCompare(b.name));

  // Active filter slug for the second-row "active" highlighting:
  // when type=cards the active slug is from cardFilterRaw; otherwise from
  // programFilterRaw.
  const secondRowActiveSlug = typeFilter === 'cards' ? cardFilterRaw : programFilterRaw;

  // Hero card only appears on a truly clean /blog (no filters). Inside
  // any filter view we render straight grid so the hero doesn't fight
  // chip navigation.
  const hasAnyFilter = !!(
    categoryFilter ||
    typeFilter ||
    programFilterRaw ||
    cardFilterRaw ||
    qFilter
  );

  // Pre-compute type-sets for cards so we don't re-derive in the render.
  const postTypesByslug = new Map(
    filteredPosts.map((p) => [p.slug, computePostTypes(p)] as const),
  );

  // Phase 3 — primary-type sort. When filtering by type=airlines, posts
  // where the AIRLINE is the primary tag rank above posts where the
  // airline is only a secondary tag. Surfaces the most-relevant content
  // first inside a multi-tag bucket. Same for hotels. For type=cards
  // there's no primary/secondary distinction (cards are flat), so this
  // is a no-op in that case.
  //
  // Same idea for program filter: if narrowing by program=world-of-hyatt,
  // posts where world-of-hyatt is PRIMARY rank above posts where it's
  // secondary.
  function primaryRank(post: BlogRow): number {
    if (typeFilter === 'airlines' || typeFilter === 'hotels') {
      const primarySlug = post.primary_program_slug;
      if (primarySlug) {
        const t = programType.get(primarySlug);
        const wantedType = typeFilter === 'airlines' ? 'airline' : 'hotel';
        if (t === wantedType) return 0; // primary match
      }
      return 1;
    }
    if (programFilterRaw) {
      return post.primary_program_slug === programFilterRaw ? 0 : 1;
    }
    return 0; // no preference axis active — preserve DB order
  }
  filteredPosts.sort((a, b) => {
    const r = primaryRank(a) - primaryRank(b);
    if (r !== 0) return r;
    // Fallback to chronological (newest first) within rank ties.
    const aDate = a.published_at ? new Date(a.published_at).getTime() : 0;
    const bDate = b.published_at ? new Date(b.published_at).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="rg-container px-6 md:px-8 py-12 md:py-16">
      <header className="mb-10 md:mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--color-primary)]">
          Blog
        </h1>
        <p className="mt-3 max-w-2xl font-body text-base md:text-lg text-[var(--color-text-secondary)]">
          Award travel tactics, transfer plays, and the occasional sweet spot — written in
          plain English, fact-checked, and on-brand.
        </p>
      </header>

      {/* Search input — submit-on-enter (no client JS, no debounce).
          Hidden inputs preserve all current filters so a search inside a
          filter view stays inside that view. URL stays shareable. */}
      <form
        action="/blog"
        method="get"
        role="search"
        className="mb-6 flex flex-wrap items-center gap-2"
      >
        <label htmlFor="blog-search" className="sr-only">
          Search blog
        </label>
        <input
          id="blog-search"
          type="search"
          name="q"
          defaultValue={qFilter ?? ''}
          placeholder="Search posts by title or excerpt…"
          maxLength={80}
          className="w-full max-w-md rounded-full border border-[var(--color-border-soft)] bg-white px-4 py-2 font-ui text-base md:text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
        {programFilterRaw && <input type="hidden" name="program" value={programFilterRaw} />}
        {cardFilterRaw && <input type="hidden" name="card" value={cardFilterRaw} />}
        <button
          type="submit"
          className="rounded-full bg-[var(--color-primary)] px-4 py-2 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-[var(--color-primary-hover)]"
        >
          Search
        </button>
      </form>

      {/* Active filter pills with [×] — visible when any filter is set.
          Each pill removes its own filter; "Clear all" resets to /blog.
          Same composability rules as the chip rows: removing TYPE drops
          program/card; removing PROGRAM/CARD keeps type. */}
      {hasAnyFilter && (
        <div
          aria-label="Active filters"
          className="mb-4 flex flex-wrap items-center gap-2"
        >
          <span className="font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Active:
          </span>
          {categoryFilter && (
            <ActiveFilterPill
              label={`Category: ${getBlogCategoryLabel(categoryFilter) ?? categoryFilter}`}
              removeHref={buildBlogHref({
                category: null,
                type: typeFilter,
                program: programFilterRaw,
                card: cardFilterRaw,
                q: qFilter,
              })}
            />
          )}
          {typeFilter && (
            <ActiveFilterPill
              label={`Type: ${TYPE_BUCKETS.find((t) => t.slug === typeFilter)?.label ?? typeFilter}`}
              // Removing TYPE drops program/card (type-scoped).
              removeHref={buildBlogHref({
                category: categoryFilter,
                type: null,
                q: qFilter,
              })}
            />
          )}
          {programFilterRaw && (
            <ActiveFilterPill
              label={`Program: ${programName.get(programFilterRaw) ?? programFilterRaw}`}
              removeHref={buildBlogHref({
                category: categoryFilter,
                type: typeFilter,
                q: qFilter,
              })}
            />
          )}
          {cardFilterRaw && (
            <ActiveFilterPill
              label={`Card: ${cardName.get(cardFilterRaw) ?? cardFilterRaw}`}
              removeHref={buildBlogHref({
                category: categoryFilter,
                type: typeFilter,
                q: qFilter,
              })}
            />
          )}
          {qFilter && (
            <ActiveFilterPill
              label={`Search: "${qFilter}"`}
              removeHref={buildBlogHref({
                category: categoryFilter,
                type: typeFilter,
                program: programFilterRaw,
                card: cardFilterRaw,
              })}
            />
          )}
          <Link
            href="/blog"
            className="font-ui text-[11px] font-medium text-[var(--color-text-secondary)] underline hover:text-[var(--color-primary)]"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Category filter chips — preserve type/program/card/q on click. */}
      <nav
        aria-label="Filter by category"
        className="mb-4 flex flex-wrap items-center gap-2 md:gap-2.5"
      >
        <CategoryChip
          href={buildBlogHref({
            category: null,
            type: typeFilter,
            program: programFilterRaw,
            card: cardFilterRaw,
            q: qFilter,
          })}
          label="All"
          active={!categoryFilter}
        />
        {BLOG_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.slug}
            href={buildBlogHref({
              category: c.slug,
              type: typeFilter,
              program: programFilterRaw,
              card: cardFilterRaw,
              q: qFilter,
            })}
            label={c.label}
            active={categoryFilter === c.slug}
          />
        ))}
      </nav>

      {/* Type filter chips — Airlines / Hotels / Credit Cards. Changing
          type drops program/card because they're type-scoped. */}
      <nav
        aria-label="Filter by type"
        className="mb-4 flex flex-wrap items-center gap-2 md:gap-2.5"
      >
        <TypeChip
          href={buildBlogHref({
            category: categoryFilter,
            type: null,
            q: qFilter,
          })}
          label="All Types"
          active={!typeFilter}
        />
        {TYPE_BUCKETS.map((t) => (
          <TypeChip
            key={t.slug}
            href={buildBlogHref({
              category: categoryFilter,
              type: t.slug,
              q: qFilter,
            })}
            label={t.label}
            active={typeFilter === t.slug}
          />
        ))}
      </nav>

      {/* Second-row chips — populated only when a type is active. Lists
          every airline / hotel / card we have in the DB. Selecting one
          narrows the post list further. */}
      {typeFilter && secondRowChips.length > 0 && (
        <nav
          aria-label={`Filter by ${typeFilter === 'cards' ? 'card' : 'program'}`}
          className="mb-10 flex flex-wrap items-center gap-2 md:gap-2.5"
        >
          <SubChip
            href={buildBlogHref({
              category: categoryFilter,
              type: typeFilter,
              q: qFilter,
            })}
            label="All"
            active={!secondRowActiveSlug}
          />
          {secondRowChips.map((item) => (
            <SubChip
              key={`${item.paramKey}-${item.slug}`}
              href={buildBlogHref({
                category: categoryFilter,
                type: typeFilter,
                q: qFilter,
                ...(item.paramKey === 'card'
                  ? { card: item.slug }
                  : { program: item.slug }),
              })}
              label={item.name}
              active={secondRowActiveSlug === item.slug}
            />
          ))}
        </nav>
      )}
      {!typeFilter && <div className="mb-10" />}

      {filteredPosts.length === 0 ? (
        <p className="font-body text-[var(--color-text-secondary)]">
          No posts match these filters.{' '}
          <Link href="/blog" className="text-[var(--color-primary)] underline">
            Clear filters
          </Link>{' '}
          and try again.
        </p>
      ) : !hasAnyFilter && filteredPosts.length > 0 ? (
        // /blog root with no filters — latest post becomes a hero card.
        <>
          <HeroPostCard post={filteredPosts[0]} />
          {filteredPosts.length > 1 && (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
              {filteredPosts.slice(1).map((post) => (
                <ArticleCard
                  key={post.slug}
                  post={post}
                  postTypes={postTypesByslug.get(post.slug)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <ArticleCard
              key={post.slug}
              post={post}
              postTypes={postTypesByslug.get(post.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Unified filter chip style. Used by category / type / sub-chip rows.
 * Earlier rounds had three different visual weights (solid purple,
 * solid gold, light tint) for "active" — all reading as separate
 * brand commitments. One pattern is enough: light tinted bg + primary
 * border + primary text for active, plain white for inactive.
 *
 * Size variants — `compact` for the second-row sub-chips (smaller and
 * looser tracking so a long list of program names stays scannable),
 * default for the upper rows.
 */
function FilterChip({
  href,
  label,
  active,
  size = 'default',
}: {
  href: string;
  label: string;
  active: boolean;
  size?: 'default' | 'compact';
}) {
  const sizeCls =
    size === 'compact'
      ? 'px-3 py-1 text-[11px] font-medium'
      : 'px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em]';
  const base = `inline-flex items-center rounded-full font-ui transition-colors ${sizeCls}`;
  const activeCls =
    'border border-[var(--color-primary)] bg-[var(--color-background-soft)] text-[var(--color-primary)] font-semibold';
  const inactiveCls =
    'border border-[var(--color-border-soft)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]';
  return (
    <Link href={href} className={`${base} ${active ? activeCls : inactiveCls}`}>
      {label}
    </Link>
  );
}

// Back-compat aliases — kept so the call sites in the BlogIndex render
// don't need to change. All three end up using FilterChip with the same
// active style; size switches for sub-chips.
function CategoryChip(props: { href: string; label: string; active: boolean }) {
  return <FilterChip {...props} />;
}

function TypeChip(props: { href: string; label: string; active: boolean }) {
  return <FilterChip {...props} />;
}

/**
 * Active filter pill — surfaces a currently-applied filter with a [×]
 * to remove just that one. The href encodes "what would the URL be
 * WITHOUT this filter" — composability rules (e.g. removing TYPE drops
 * program/card) live in the call site, not here.
 */
function ActiveFilterPill({
  label,
  removeHref,
}: {
  label: string;
  removeHref: string;
}) {
  // Light tint instead of solid primary — these are informational
  // indicators ("this filter is on"), not call-to-action buttons. Solid
  // purple read too heavy against the rest of the page chrome.
  return (
    <Link
      href={removeHref}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-3 py-1 font-ui text-[11px] font-medium text-[var(--color-primary)] transition-colors hover:border-[var(--color-primary)] hover:bg-white"
      title={`Remove filter: ${label}`}
    >
      <span>{label}</span>
      <span aria-hidden className="text-[14px] leading-none opacity-70">
        ×
      </span>
    </Link>
  );
}

function SubChip(props: { href: string; label: string; active: boolean }) {
  return <FilterChip {...props} size="compact" />;
}

/**
 * Larger card for the most-recent / top-featured post on /blog root.
 * Full-width, bigger typography, image-left text-right on md+.
 *
 * Falls back to text-only layout when there's no hero image — same
 * rationale as ArticleCard (#250). The 2px purple top edge keeps the
 * brand presence without occupying real estate.
 */
function HeroPostCard({ post }: { post: BlogRow }) {
  const dek = (post.excerpt && post.excerpt.trim()) || post.pitch;
  const categoryLabel = getBlogCategoryLabel(post.category);
  const dateStr = formatDate(post.published_at);
  const hasHeroImage = !!post.hero_image_url;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {!hasHeroImage && (
        <div className="h-0.5 w-full bg-[var(--color-primary)]" aria-hidden />
      )}

      <div
        className={`flex flex-col gap-6 p-6 md:gap-8 md:p-8 ${
          hasHeroImage ? 'md:flex-row md:items-center' : ''
        }`}
      >
        {hasHeroImage && (
          <div className="md:w-[42%] md:shrink-0">
            <HeroImageOrFallback
              imageUrl={post.hero_image_url}
              title={post.title}
              category={post.category}
              variant="thumbnail"
            />
          </div>
        )}

        <div className="flex flex-col gap-4">
          {categoryLabel && (
            <span className="self-start rounded-full bg-[var(--color-background-soft)] px-2.5 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
              {categoryLabel}
            </span>
          )}

          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight text-[var(--color-primary)] group-hover:underline">
            {post.title}
          </h2>

          <p className="font-body text-base md:text-lg text-[var(--color-text-secondary)] line-clamp-3">
            {dek}
          </p>

          <div className="flex items-center gap-2 font-ui text-xs text-[var(--color-text-secondary)]">
            {dateStr && <span>{dateStr}</span>}
            {dateStr && post.reading_time_minutes && <span aria-hidden>·</span>}
            {post.reading_time_minutes && (
              <span>{post.reading_time_minutes} min read</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Format a Set<TypeBucketSlug> into a "Hotel · Airline" cross-type badge. */
function formatTypeBadge(types: Set<TypeBucketSlug> | undefined): string | null {
  if (!types || types.size < 2) return null; // Only render when cross-type
  const order: TypeBucketSlug[] = ['hotels', 'airlines', 'cards'];
  const labels: Record<TypeBucketSlug, string> = {
    hotels: 'Hotel',
    airlines: 'Airline',
    cards: 'Card',
  };
  return order.filter((t) => types.has(t)).map((t) => labels[t]).join(' · ');
}

function ArticleCard({
  post,
  postTypes,
}: {
  post: BlogRow;
  /** Pre-computed type-set from the parent. Used for the cross-type badge. */
  postTypes?: Set<TypeBucketSlug>;
}) {
  const dek = (post.excerpt && post.excerpt.trim()) || post.pitch;
  const categoryLabel = getBlogCategoryLabel(post.category);
  const dateStr = formatDate(post.published_at);
  const typeBadge = formatTypeBadge(postTypes);

  // When the post has a real hero image, show it. When it doesn't, skip
  // the branded fallback block entirely — it ate too much vertical space
  // and added no information. A 4px purple top edge keeps the card
  // visually anchored to the brand without occupying vertical real
  // estate. Category pill carries the only "what is this" signal.
  const hasHeroImage = !!post.hero_image_url;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        hasHeroImage ? 'p-5' : 'pt-0'
      }`}
    >
      {hasHeroImage ? (
        <HeroImageOrFallback
          imageUrl={post.hero_image_url}
          title={post.title}
          category={post.category}
          variant="thumbnail"
        />
      ) : (
        // 2px branded top edge in place of the fallback hero block.
        // Was 4px (#249) — felt more like a header bar than trim. 2px
        // reads as an accent stripe.
        <div className="h-0.5 w-full bg-[var(--color-primary)]" aria-hidden />
      )}

      <div className={`flex flex-col gap-3 ${hasHeroImage ? '' : 'p-5 pt-3'}`}>
        {(categoryLabel || typeBadge) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {categoryLabel && (
              <span className="rounded-full bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                {categoryLabel}
              </span>
            )}
            {typeBadge && (
              // Cross-type badge — only renders when this post falls into
              // 2+ type buckets. Tells the reader why a Marriott→American
              // post is appearing under Airlines (or Hotels).
              <span
                className="rounded-full border border-[var(--color-accent)] px-2 py-0.5 font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-secondary)]"
                title="This post covers multiple types"
              >
                {typeBadge}
              </span>
            )}
          </div>
        )}

        <h2 className="font-display text-xl font-semibold leading-snug text-[var(--color-primary)] line-clamp-2 group-hover:underline">
          {post.title}
        </h2>

        <p className="font-body text-sm text-[var(--color-text-secondary)] line-clamp-3">
          {dek}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-2 font-ui text-xs text-[var(--color-text-secondary)]">
          {dateStr && <span>{dateStr}</span>}
          {dateStr && post.reading_time_minutes && <span aria-hidden>·</span>}
          {post.reading_time_minutes && (
            <span>{post.reading_time_minutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}
