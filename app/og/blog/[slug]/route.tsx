import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/utils/supabase/server';
import { getBlogCategoryLabel } from '@/lib/blog/categories';

// We deliberately do NOT pin runtime='edge' here. ImageResponse works on the
// default Node runtime in Next.js 16, and using Node lets us keep using the
// same Supabase client patterns as the rest of the app without cookie/edge
// edge-cases.
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Generates a 1200×630 OG image per blog post for social-share previews.
 * Reuses the same visual logic as <ArticleHeroCard /> but inlined here
 * with explicit dimensions because @vercel/og uses Satori (a JSX → SVG
 * renderer) that can't render React components from the rest of the app.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  const { slug } = await params;

  let title = 'crazy4points';
  let categoryLabel = '';

  // Robustness: if the lookup fails for any reason, fall back to brand defaults
  // rather than 500ing. A broken OG image silently breaks every social share.
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('content_ideas')
      .select('title, category')
      .eq('slug', slug)
      .eq('type', 'blog')
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      console.warn(`[og/blog/${slug}] supabase error:`, error.message);
    } else if (data) {
      title = (data.title as string | null) ?? title;
      categoryLabel = getBlogCategoryLabel(data.category as string | null) ?? '';
    }
  } catch (err) {
    console.error(`[og/blog/${slug}] unexpected:`, err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundImage:
            'linear-gradient(135deg, #6B2D8F 0%, #6B2D8F 50%, #5A237A 100%)',
          color: '#ffffff',
        }}
      >
        {/* Top row: category */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#D4AF37',
          }}
        >
          {categoryLabel || 'Blog'}
        </div>

        {/* Title — no clamp; wraps freely so long titles don't get cut off */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 1.15,
            color: '#ffffff',
            // Reserve up to ~3 lines visually but don't strictly clamp
            maxHeight: 240,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>

        {/* Bottom row: brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          <span>
            crazy<span style={{ color: '#D4AF37' }}>4</span>points
          </span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 }}>
            crazy4points.com
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    }
  );
}
