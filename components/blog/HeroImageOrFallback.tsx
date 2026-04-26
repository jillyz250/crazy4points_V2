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
  const aspectClass = isFull ? 'aspect-[16/9]' : 'aspect-[3/2]';

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
