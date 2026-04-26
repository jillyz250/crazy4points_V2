/**
 * Single source of truth for blog post categories.
 *
 * The DB-level CHECK constraint on `content_ideas.category` is mirrored in
 * `BLOG_CATEGORY_SLUGS` below. If you add or rename a category here, also
 * update the migration that defines the check constraint.
 */
export const BLOG_CATEGORIES = [
  { slug: 'transfer-plays', label: 'Transfer Plays' },
  { slug: 'sweet-spots',    label: 'Sweet Spots' },
  { slug: 'programs',       label: 'Program Guides' },
  { slug: 'card-strategy',  label: 'Card Strategy' },
  { slug: 'how-to',         label: 'How-Tos' },
  { slug: 'news',           label: 'News & Analysis' },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]['slug'];

export const BLOG_CATEGORY_SLUGS = BLOG_CATEGORIES.map((c) => c.slug) as readonly BlogCategorySlug[];

export function isBlogCategorySlug(value: string | null | undefined): value is BlogCategorySlug {
  return !!value && (BLOG_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getBlogCategoryLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return BLOG_CATEGORIES.find((c) => c.slug === slug)?.label ?? null;
}
