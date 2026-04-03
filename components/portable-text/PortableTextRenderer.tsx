import React from 'react'

// Minimal Portable Text renderer — no external dependencies.
// Handles: normal paragraphs, h2–h4, blockquote, bullet and number lists,
// and inline marks: strong, em, code, underline, link.

type SpanNode = {
  _key: string
  _type: string
  text: string
  marks?: string[]
}

type MarkDef = {
  _key: string
  _type: string
  href?: string
}

type BlockNode = {
  _key: string
  _type: 'block'
  style?: string
  children?: SpanNode[]
  markDefs?: MarkDef[]
  listItem?: string
  level?: number
}

type PTBlock = Record<string, unknown>

// ── Inline span rendering ─────────────────────────────────────────────────────

function renderSpan(span: SpanNode, markDefs: MarkDef[]): React.ReactNode {
  const marks = span.marks ?? []
  let content: React.ReactNode = span.text

  for (const mark of [...marks].reverse()) {
    if (mark === 'strong') {
      content = <strong className="font-semibold">{content}</strong>
    } else if (mark === 'em') {
      content = <em>{content}</em>
    } else if (mark === 'underline') {
      content = <u>{content}</u>
    } else if (mark === 'code') {
      content = (
        <code className="rounded bg-[var(--color-background-soft)] px-1 py-0.5 font-mono text-sm text-[var(--color-primary)]">
          {content}
        </code>
      )
    } else {
      const def = markDefs.find((m) => m._key === mark)
      if (def?._type === 'link' && def.href) {
        const isExternal = def.href.startsWith('http')
        content = (
          <a
            href={def.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-[var(--color-primary)] underline hover:text-[var(--color-primary-hover)]"
          >
            {content}
          </a>
        )
      }
    }
  }

  return content
}

function renderChildren(
  children: SpanNode[] = [],
  markDefs: MarkDef[] = []
): React.ReactNode {
  return children.map((span, i) => (
    <React.Fragment key={span._key ?? i}>
      {renderSpan(span, markDefs)}
    </React.Fragment>
  ))
}

// ── Block rendering ───────────────────────────────────────────────────────────

function renderBlock(block: BlockNode): React.ReactNode {
  const children = renderChildren(block.children, block.markDefs)

  switch (block.style) {
    case 'h2':
      return (
        <h2 className="mt-8 font-display text-2xl font-semibold text-[var(--color-primary)]">
          {children}
        </h2>
      )
    case 'h3':
      return (
        <h3 className="mt-6 font-display text-xl font-semibold text-[var(--color-primary)]">
          {children}
        </h3>
      )
    case 'h4':
      return (
        <h4 className="mt-4 font-display text-lg font-semibold text-[var(--color-primary)]">
          {children}
        </h4>
      )
    case 'blockquote':
      return (
        <blockquote className="my-4 border-l-4 border-[var(--color-primary)] pl-4 font-body italic text-[var(--color-text-secondary)]">
          {children}
        </blockquote>
      )
    default:
      return (
        <p className="font-body leading-relaxed text-[var(--color-text-primary)]">
          {children}
        </p>
      )
  }
}

// ── List grouping ─────────────────────────────────────────────────────────────
// Groups consecutive list-item blocks into a single <ul> or <ol>.

type Segment =
  | { kind: 'block'; block: BlockNode }
  | { kind: 'list'; listType: string; items: BlockNode[] }

function groupIntoSegments(blocks: BlockNode[]): Segment[] {
  const segments: Segment[] = []

  for (const block of blocks) {
    if (block.listItem) {
      const last = segments[segments.length - 1]
      if (last?.kind === 'list' && last.listType === block.listItem) {
        last.items.push(block)
      } else {
        segments.push({ kind: 'list', listType: block.listItem, items: [block] })
      }
    } else {
      segments.push({ kind: 'block', block })
    }
  }

  return segments
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PortableTextRenderer({
  blocks,
}: {
  blocks: Array<Record<string, unknown>>
}) {
  const typed = blocks as PTBlock[]
  // Only process 'block' type — skip embedded assets, custom types, etc.
  const blockNodes = typed.filter((b) => b._type === 'block') as BlockNode[]
  const segments = groupIntoSegments(blockNodes)

  return (
    <div className="flex flex-col gap-4">
      {segments.map((seg, i) => {
        if (seg.kind === 'block') {
          return (
            <React.Fragment key={(seg.block._key as string) ?? i}>
              {renderBlock(seg.block)}
            </React.Fragment>
          )
        }

        const ListTag = seg.listType === 'number' ? 'ol' : 'ul'
        const listClass =
          seg.listType === 'number'
            ? 'list-decimal pl-6 flex flex-col gap-1.5'
            : 'list-disc pl-6 flex flex-col gap-1.5'

        return (
          <ListTag key={i} className={listClass}>
            {seg.items.map((item, j) => (
              <li
                key={item._key ?? j}
                className="font-body leading-relaxed text-[var(--color-text-primary)]"
              >
                {renderChildren(item.children, item.markDefs)}
              </li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}
