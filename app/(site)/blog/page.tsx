import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog — crazy4points',
  description: 'Award travel tactics, transfer plays, and the occasional sweet spot — written in plain English.',
}

interface BlogRow {
  slug: string
  title: string
  pitch: string
  published_at: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function BlogIndex() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_ideas')
    .select('slug, title, pitch, published_at')
    .eq('type', 'blog')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const posts = (data ?? []) as BlogRow[]

  return (
    <div className="rg-container rg-major-section">
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Blog</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontSize: '1.0625rem', lineHeight: 1.6 }}>
          Award travel tactics, transfer plays, and the occasional sweet spot — written in plain English, fact-checked, and on-brand.
        </p>
      </header>

      {posts.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          Nothing published yet. Come back soon.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((post) => (
            <li
              key={post.slug}
              style={{
                padding: '1.5rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                background: 'white',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
              >
                <h2 style={{ fontSize: '1.5rem', margin: 0, marginBottom: '0.5rem' }}>{post.title}</h2>
              </Link>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem', lineHeight: 1.55 }}>
                {post.pitch}
              </p>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                {formatDate(post.published_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
