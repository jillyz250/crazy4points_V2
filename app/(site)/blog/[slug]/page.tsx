import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

interface BlogPost {
  slug: string
  title: string
  pitch: string
  article_body: string | null
  published_at: string | null
  written_by: string | null
  written_at: string | null
  fact_checked_at: string | null
  voice_pass: boolean | null
  voice_checked_at: string | null
  originality_pass: boolean | null
  originality_checked_at: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_ideas')
    .select('slug, title, pitch, article_body, published_at, written_by, written_at, fact_checked_at, voice_pass, voice_checked_at, originality_pass, originality_checked_at')
    .eq('slug', slug)
    .eq('type', 'blog')
    .eq('status', 'published')
    .maybeSingle()
  return (data as BlogPost | null) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not found — crazy4points' }
  return {
    title: `${post.title} — crazy4points`,
    description: post.pitch,
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Pill({ label, on, hint }: { label: string; on: boolean; hint: string }) {
  return (
    <span
      title={hint}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.1875rem 0.5rem',
        borderRadius: '999px',
        background: on ? '#DCFCE7' : '#F3F4F6',
        color: on ? '#166534' : '#9CA3AF',
        fontSize: '0.6875rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        border: `1px solid ${on ? '#86EFAC' : 'var(--color-border-soft)'}`,
      }}
    >
      <span aria-hidden="true">{on ? '✓' : '○'}</span>
      {label}
    </span>
  )
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post || !post.article_body) notFound()

  const html = await marked.parse(post.article_body, { async: true })

  return (
    <article className="rg-container rg-major-section" style={{ maxWidth: '48rem' }}>
      <Link
        href="/blog"
        style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}
      >
        ← All posts
      </Link>

      <header style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{post.title}</h1>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Published {formatDate(post.published_at)}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <Pill
            label="Written by Claude"
            on={Boolean(post.written_at)}
            hint={post.written_by ? `Drafted by ${post.written_by}` : 'Drafted by Claude'}
          />
          <Pill
            label="Fact-checked"
            on={Boolean(post.fact_checked_at)}
            hint={post.fact_checked_at ? `Fact-checked ${formatDate(post.fact_checked_at)}` : 'Not fact-checked'}
          />
          <Pill
            label="On-brand voice"
            on={post.voice_pass === true}
            hint={post.voice_checked_at ? `Voice-checked ${formatDate(post.voice_checked_at)}` : 'Not voice-checked'}
          />
          <Pill
            label="Original"
            on={post.originality_pass === true}
            hint={post.originality_checked_at ? `Originality-checked ${formatDate(post.originality_checked_at)}` : 'Originality not checked'}
          />
        </div>
      </header>

      <div
        className="rg-prose"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          color: 'var(--color-text-primary)',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
