'use client';

import { useState } from 'react';
import ArticleHeroCard from './ArticleHeroCard';

interface Props {
  imageUrl: string | null;
  title: string;
  category: string | null;
  variant?: 'full' | 'thumbnail';
}

/**
 * Renders the post's `hero_image_url` if set, otherwise the branded
 * <ArticleHeroCard /> fallback. On image load failure (broken URL,
 * 404, CORS, etc.), seamlessly swaps to the card inside the SAME
 * aspect-ratio container so there's no layout shift.
 */
export default function HeroImageOrFallback({
  imageUrl,
  title,
  category,
  variant = 'full',
}: Props) {
  const [errored, setErrored] = useState(false);
  const isFull = variant === 'full';
  // Full-width hero (article page) — 21:9 banner with hard max-height cap.
  // Was 16:9 which rendered ~720px tall in a 1280px container, eating
  // half the viewport.
  //
  // Thumbnail (blog index card) — was aspect-[3/2] which on a 2-column
  // ~620px-wide card rendered ~415px tall. Each card was eating the
  // viewport and pushing content below the fold. 16:9 is the standard
  // blog-card ratio; capped at 280px so cards stay scannable at wide
  // breakpoints.
  // Aggressive caps — earlier rounds (#246, #247) were still too tall
  // on real viewports. Dropping further:
  //   full hero    → max 220 / 300 (was 360 / 420)
  //   thumbnail    → max 160 / 180 (was 240 / 280)
  // 16:9 still drives the natural ratio; max-h clamps when the card is
  // wide enough that the natural height would exceed the cap.
  // Round four — even tighter. Thumbnails on the index were still
  // dominating; hero on the article still felt heavy.
  //   full hero    → max 160 / 220 (was 220 / 300)
  //   thumbnail    → max 110 / 130 (was 160 / 180)
  // For the branded fallback (no hero_image_url) these caps make the
  // card feel like a labelled tile rather than a giant purple block.
  const aspectClass = isFull
    ? 'aspect-[21/9] max-h-[160px] md:max-h-[220px]'
    : 'aspect-[16/9] max-h-[110px] md:max-h-[130px]';

  return (
    <div
      className={`relative w-full overflow-hidden ${aspectClass} ${
        isFull ? 'rounded-[var(--radius-card)]' : 'rounded-[var(--radius-ui)]'
      }`}
    >
      {imageUrl && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setErrored(true)}
          loading={isFull ? 'eager' : 'lazy'}
        />
      ) : (
        <div className="absolute inset-0">
          <ArticleHeroCard title={title} category={category} variant={variant} />
        </div>
      )}
    </div>
  );
}
