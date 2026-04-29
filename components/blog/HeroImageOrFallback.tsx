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
  // Full-width hero used to be aspect-[16/9] which on a ~1280px container
  // renders ~720px tall — half the viewport on most laptops. The article
  // felt like it started way below the fold. Switched to a banner ratio
  // with a hard max-height cap so the hero is present but doesn't dominate.
  // Thumbnail variant unchanged (3:2 is right inside small grid cells).
  const aspectClass = isFull
    ? 'aspect-[21/9] max-h-[360px] md:max-h-[420px]'
    : 'aspect-[3/2]';

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
