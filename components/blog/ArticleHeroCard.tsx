import { getBlogCategoryLabel } from '@/lib/blog/categories';

interface Props {
  title: string;
  category: string | null;
  variant?: 'full' | 'thumbnail';
  /**
   * If true, allows the title to wrap freely (used by OG image route).
   * UI variants clamp to 3 lines for layout safety.
   */
  allowFullTitleWrap?: boolean;
}

/**
 * Branded hero block rendered when a blog post has no real photo.
 * Pure JSX — no canvas/dynamic-image generation here. Used both as the
 * detail-page hero and the index-card thumbnail.
 *
 * The OG image route also reuses the same visual via @vercel/og.
 */
export default function ArticleHeroCard({
  title,
  category,
  variant = 'full',
  allowFullTitleWrap = false,
}: Props) {
  const categoryLabel = getBlogCategoryLabel(category);
  const isFull = variant === 'full';

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary-hover)] ${
        isFull ? 'p-8 md:p-12' : 'p-5'
      }`}
      aria-hidden
    >
      {/* Subtle gold accent corner */}
      <div
        className={`absolute right-0 top-0 ${
          isFull ? 'h-32 w-32' : 'h-16 w-16'
        }`}
        style={{
          background:
            'radial-gradient(circle at top right, rgba(212,175,55,0.35), transparent 70%)',
        }}
      />

      <div className="relative">
        {categoryLabel && (
          <span
            className={`font-ui font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] ${
              isFull ? 'text-xs md:text-sm' : 'text-[10px]'
            }`}
          >
            {categoryLabel}
          </span>
        )}
      </div>

      <div className="relative">
        <h2
          className={`font-display font-semibold leading-tight text-white ${
            isFull
              ? 'text-3xl md:text-4xl lg:text-5xl'
              : 'text-lg leading-snug'
          } ${allowFullTitleWrap ? '' : isFull ? 'line-clamp-4' : 'line-clamp-3'}`}
        >
          {title}
        </h2>
      </div>

      <div className="relative flex items-end justify-between">
        <span
          className={`font-display font-medium text-white/70 ${
            isFull ? 'text-base' : 'text-[11px]'
          }`}
        >
          crazy<span className="text-[var(--color-accent)]">4</span>points
        </span>
      </div>
    </div>
  );
}
