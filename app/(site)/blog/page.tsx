import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { BLOG_CATEGORIES, isBlogCategorySlug, getBlogCategoryLabel } from '@/lib/blog/categories';
import HeroImageOrFallback from '@/components/blog/HeroImageOrFallback';

export const revalidate = 60;

interface BlogRow {
  slug: string;
  title: string;
  pitch: string;
  excerpt: string | null;
  hero_image_url: string | null;
  category: string | null;
  primary_program_slug: string | null;
  reading_time_minutes: number | null;
  written_by: string | null;
  published_at: string | null;
  featured: boolean | null;
  featured_rank: number | null;
}

type Props = {
  searchParams: Promise<{ category?: string }>;
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

export default async function BlogIndex({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryFilter = isBlogCategorySlug(sp.category) ? sp.category : null;

  const supabase = await createClient();
  let query = supabase
    .from('content_ideas')
    .select(
      'slug, title, pitch, excerpt, hero_image_url, category, primary_program_slug, reading_time_minutes, written_by, published_at, featured, featured_rank'
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

  const { data } = await query;
  const posts = (data ?? []) as BlogRow[];

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

      {/* Category filter chips */}
      <nav
        aria-label="Filter by category"
        className="mb-10 flex flex-wrap items-center gap-2 md:gap-2.5"
      >
        <CategoryChip
          href="/blog"
          label="All"
          active={!categoryFilter}
        />
        {BLOG_CATEGORIES.map((c) => (
          <CategoryChip
            key={c.slug}
            href={`/blog?category=${c.slug}`}
            label={c.label}
            active={categoryFilter === c.slug}
          />
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="font-body text-[var(--color-text-secondary)]">
          {categoryFilter
            ? 'Nothing in this category yet. Try another.'
            : 'Nothing published yet. Come back soon.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const base =
    'inline-flex items-center rounded-full px-4 py-1.5 font-ui text-xs font-medium uppercase tracking-[0.1em] transition-colors';
  const activeCls =
    'bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]';
  const inactiveCls =
    'border border-[var(--color-border-soft)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]';
  return (
    <Link href={href} className={`${base} ${active ? activeCls : inactiveCls}`}>
      {label}
    </Link>
  );
}

function ArticleCard({ post }: { post: BlogRow }) {
  const dek = (post.excerpt && post.excerpt.trim()) || post.pitch;
  const categoryLabel = getBlogCategoryLabel(post.category);
  const dateStr = formatDate(post.published_at);

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
        // 4px branded top edge in place of the fallback hero block.
        // Category-keyed accent kept simple to start (primary purple);
        // can split per-category later if useful.
        <div className="h-1 w-full bg-[var(--color-primary)]" aria-hidden />
      )}

      <div className={`flex flex-col gap-3 ${hasHeroImage ? '' : 'p-5 pt-3'}`}>
        {categoryLabel && (
          <span className="self-start rounded-full bg-[var(--color-background-soft)] px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            {categoryLabel}
          </span>
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
