import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { createClient } from '@/utils/supabase/server';
import { getBlogCategoryLabel } from '@/lib/blog/categories';
import { sanitizeArticleHtml } from '@/lib/blog/sanitize';
import HeroImageOrFallback from '@/components/blog/HeroImageOrFallback';
import ArticleRelated from '@/components/blog/ArticleRelated';
import NewsletterSignup from '@/components/home/NewsletterSignup';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

interface BlogPost {
  slug: string;
  title: string;
  pitch: string;
  excerpt: string | null;
  article_body: string | null;
  hero_image_url: string | null;
  category: string | null;
  primary_program_slug: string | null;
  // Phase — related-pages chip row at the bottom of the article needs the
  // full set of tagged surfaces, not just primary. Both nullable; render
  // only when populated.
  secondary_program_slugs: string[] | null;
  card_slugs: string[] | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  updated_at: string | null;
  written_by: string | null;
  fact_checked_at: string | null;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('content_ideas')
    .select(
      'slug, title, pitch, excerpt, article_body, hero_image_url, category, primary_program_slug, secondary_program_slugs, card_slugs, reading_time_minutes, published_at, updated_at, written_by, fact_checked_at'
    )
    .eq('slug', slug)
    .eq('type', 'blog')
    .eq('status', 'published')
    .maybeSingle();
  return (data as BlogPost | null) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not found — crazy4points' };

  const description = (post.excerpt && post.excerpt.trim()) || post.pitch;
  const ogImageUrl =
    post.hero_image_url || `https://www.crazy4points.com/og/blog/${post.slug}`;

  return {
    title: `${post.title} — crazy4points`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `https://www.crazy4points.com/blog/${post.slug}`,
      type: 'article',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImageUrl],
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function shouldShowUpdated(published: string | null, updated: string | null): boolean {
  if (!published || !updated) return false;
  const p = new Date(published).getTime();
  const u = new Date(updated).getTime();
  if (!Number.isFinite(p) || !Number.isFinite(u)) return false;
  // Only flag "Updated" if the update is at least 7 days after the original
  // publish — typo fixes and minor edits shouldn't trigger an Updated badge.
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return u - p >= SEVEN_DAYS_MS;
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const dek = (post.excerpt && post.excerpt.trim()) || post.pitch;
  const categoryLabel = getBlogCategoryLabel(post.category);
  // post.written_by stores the AI model identifier (e.g. "claude-sonnet-4-6")
  // for cost / debug — it's NOT a public byline. Public byline is always Jill.
  // If we ever add real co-authors, plumb a separate `author_name` column.
  const author = 'Jill Zeller';
  const publishedStr = formatDate(post.published_at);
  const updatedStr = shouldShowUpdated(post.published_at, post.updated_at)
    ? formatDate(post.updated_at)
    : null;

  // Markdown → HTML → sanitize. We trust marked's output structurally but
  // run it through sanitize-html to strip <script>, foreign-host <img>, etc.
  const rawHtml = post.article_body
    ? await marked.parse(post.article_body, { async: true })
    : '';
  const safeHtml = rawHtml ? sanitizeArticleHtml(rawHtml) : '';

  const ogImageUrl =
    post.hero_image_url || `https://www.crazy4points.com/og/blog/${post.slug}`;

  // JSON-LD Article schema. Google reads this for rich-result eligibility.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: dek,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'crazy4points',
      logo: { '@type': 'ImageObject', url: 'https://www.crazy4points.com/logo.png' },
    },
    image: ogImageUrl,
    mainEntityOfPage: `https://www.crazy4points.com/blog/${post.slug}`,
  };

  // Same approach as the index card (#250) — when there's no real hero
  // image, drop the fallback block entirely. The branded purple block
  // dominated the article without adding info. A 2px purple accent
  // strip at the very top of the article keeps the brand presence.
  const hasHeroImage = !!post.hero_image_url;

  return (
    <article>
      {hasHeroImage ? (
        <div className="bg-[var(--color-background-soft)]">
          <div className="rg-container px-0 md:px-8 pt-6 md:pt-10">
            <HeroImageOrFallback
              imageUrl={post.hero_image_url}
              title={post.title}
              category={post.category}
              variant="full"
            />
          </div>
        </div>
      ) : (
        <div className="h-0.5 w-full bg-[var(--color-primary)]" aria-hidden />
      )}

      {/* Article content container */}
      <div className="rg-container px-6 md:px-8 py-10 md:py-14">
        <div className="mx-auto max-w-[68ch]">
          {categoryLabel && post.category && (
            <Link
              href={`/blog?category=${post.category}`}
              className="inline-flex items-center rounded-full bg-[var(--color-background-soft)] px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              {categoryLabel}
            </Link>
          )}

          <h1 className="mt-5 font-display text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-[var(--color-primary)]">
            {post.title}
          </h1>

          {dek && (
            <p className="mt-5 font-body text-lg md:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              {dek}
            </p>
          )}

          {/* Byline row */}
          <div className="mt-6 flex flex-wrap items-center gap-2 font-ui text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium">By {author}</span>
            {publishedStr && (
              <>
                <span aria-hidden>·</span>
                <span>Published {publishedStr}</span>
              </>
            )}
            {updatedStr && (
              <>
                <span aria-hidden>·</span>
                <span>Updated {updatedStr}</span>
              </>
            )}
            {post.reading_time_minutes && (
              <>
                <span aria-hidden>·</span>
                <span>{post.reading_time_minutes} min read</span>
              </>
            )}
          </div>

          {/* Article body */}
          {safeHtml ? (
            <div
              className="rg-prose mt-10 font-body text-base md:text-lg leading-relaxed text-[var(--color-text-primary)]"
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <p className="mt-10 font-body italic text-[var(--color-text-secondary)]">
              Article body not available.
            </p>
          )}

          {/* "More on these" — clickable program/card chips. Renders nothing
              when no surfaces are tagged so old metadata-less posts stay clean. */}
          <ArticleRelated
            primaryProgramSlug={post.primary_program_slug}
            secondaryProgramSlugs={post.secondary_program_slugs}
            cardSlugs={post.card_slugs}
          />

          {/* Newsletter CTA */}
          <div className="mt-16 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-6 py-10 md:px-10 md:py-12">
            <div className="text-center mb-6">
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-primary)]">
                Want one a week like this?
              </h3>
              <p className="mt-2 font-body text-[var(--color-text-secondary)]">
                The points game is messy. We make it make sense — once a week, in your inbox.
              </p>
            </div>
            <NewsletterSignup />
          </div>

          {/* Methodology footer */}
          <div className="mt-12 border-t border-[var(--color-border-soft)] pt-6 font-ui text-xs text-[var(--color-text-secondary)] opacity-80">
            {post.fact_checked_at ? (
              <>
                Fact-checked {formatDate(post.fact_checked_at)} · Voice and originality verified
              </>
            ) : (
              <>Voice and originality verified</>
            )}
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
