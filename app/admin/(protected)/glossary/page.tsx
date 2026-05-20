/**
 * /admin/glossary — chip reference page.
 *
 * Per v9 plan: "A /admin/glossary reference page documents every chip name,
 * what it means, and which color it uses, so any new admin user can decode
 * the UI at a glance."
 *
 * Static. No data fetching. Renders every chip variant alongside its
 * purpose so the visual vocabulary is documented in one place.
 */
import {
  Chip,
  StatusChip,
  SourceChip,
  SourceTypeChip,
  ConfidenceChip,
  FactOriginChip,
  QAChip,
  EndDateChip,
  ConfirmationCountChip,
  RelativeTimeChip,
  ChipRow,
  ProvenancePanel,
} from '@/components/admin/chips'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Glossary — crazy4points admin',
}

export default function GlossaryPage() {
  // Pre-computed example timestamps so the renderings are stable across reloads.
  const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const THREE_DAYS_AGO = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const ENDS_IN_2_DAYS = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  const ENDS_IN_10_DAYS = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: '64rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: 'var(--admin-text)',
          marginBottom: '0.25rem',
        }}
      >
        Chip Glossary
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
          color: 'var(--admin-text-muted)',
          marginBottom: '2rem',
          lineHeight: 1.5,
        }}
      >
        The visual vocabulary used across every admin list and detail page. Names + colors only —
        no icons. Every chip below documents what it means, when it appears, and which color it
        renders in. Use this page to decode any unfamiliar chip you spot in Triage or Drafts.
      </p>

      <Section title="Color palette" subtitle="Six locked tokens. Defined in styles/globals.css.">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Chip color="green" label="green" />
          <Chip color="amber" label="amber" />
          <Chip color="red" label="red" />
          <Chip color="purple" label="purple" />
          <Chip color="grey" label="grey" />
          <Chip color="blue" label="blue" />
        </div>
      </Section>

      <Section
        title="Lifecycle status"
        subtitle="Every pipeline item — intel, draft, variant, newsletter — uses one of these."
      >
        <Table>
          <Row chip={<StatusChip status="new" />}>
            Just arrived from any intake source. Unscored, never touched. Top of Triage.
          </Row>
          <Row chip={<StatusChip status="pending" />}>
            Awaiting your decision. Top of Triage / Drafts.
          </Row>
          <Row chip={<StatusChip status="auto-approved" />}>
            High-confidence pattern match — skipped Triage and landed in Drafts directly. Trust dial.
          </Row>
          <Row chip={<StatusChip status="snoozed" />}>
            Deferred to a future date via the snooze picker. Hidden from default view; lives in
            Snoozed tab with wake date.
          </Row>
          <Row chip={<StatusChip status="approved" />}>
            Greenlit by you. Ready to draft or publish.
          </Row>
          <Row chip={<StatusChip status="gated" />}>
            Failed a QA gate (fact-check / voice / originality). Top of Drafts — needs fix.
          </Row>
          <Row chip={<StatusChip status="published" />}>Live on the public site.</Row>
          <Row chip={<StatusChip status="expired" />}>
            Past end_date. Auto-transitioned by the hourly cron. Off public foreground; in Archive.
          </Row>
          <Row chip={<StatusChip status="rejected" />}>
            Not pursuing. Collapsed to a one-liner in Rejected tab.
          </Row>
          <Row chip={<StatusChip status="archived" />}>
            Manually shelved, or 30 days post-expire. Hidden from defaults.
          </Row>
        </Table>
      </Section>

      <Section title="Source provenance" subtitle="Where the intel came from + how confident we are.">
        <Table>
          <Row chip={<SourceChip name="OMAAT" />}>
            The named source. Real value is whatever Scout / email / Grok recorded.
          </Row>
          <Row chip={<SourceTypeChip type="scrape" />}>
            Intake mechanism. Other values: <code>email</code>, <code>social</code>,{' '}
            <code>ai-discovery</code>, <code>manual</code>, <code>official</code>, <code>blog</code>,{' '}
            <code>reddit</code>.
          </Row>
          <Row chip={<ConfidenceChip level="high" />}>
            Scout&apos;s assessment. Official source or 3+ credible blogs confirming → high.
          </Row>
          <Row chip={<ConfidenceChip level="medium" />}>1–2 credible sources.</Row>
          <Row chip={<ConfidenceChip level="low" />}>Reddit rumor / speculation.</Row>
        </Table>
      </Section>

      <Section
        title="Fact origin (anti-hallucination)"
        subtitle="DISTINCT from source confidence. Tracks how the underlying CLAIM originated. AI-discovered-only renders red so you never confuse an AI-summarized rumor with an issuer announcement."
      >
        <Table>
          <Row chip={<FactOriginChip origin="official" />}>
            Direct from issuer (press release, official policy page).
          </Row>
          <Row chip={<FactOriginChip origin="secondary" />}>
            Credible blog / third-party reporting (TPG, OMAAT, Frequent Miler).
          </Row>
          <Row chip={<FactOriginChip origin="social-rumor" />}>
            Reddit / X social claim, not yet corroborated.
          </Row>
          <Row chip={<FactOriginChip origin="inferred" />}>
            Analyst inference from indirect signals — Grok summarizing trends.
          </Row>
          <Row chip={<FactOriginChip origin="ai-discovered-only" />}>
            AI surfaced this without a verifiable upstream source. Treat with caution.
          </Row>
        </Table>
      </Section>

      <Section title="QA gates" subtitle="Per-gate result. Surfaces on drafts + alerts editor.">
        <Table>
          <Row chip={<QAChip kind="tcs" result="passed" />}>
            T&amp;Cs verified — full text captured from issuer.
          </Row>
          <Row chip={<QAChip kind="tcs" result="waived" />}>
            T&amp;Cs not required for this alert type (e.g. industry news).
          </Row>
          <Row chip={<QAChip kind="tcs" result="missing" />}>
            T&amp;Cs required but not captured. Blocks publish.
          </Row>
          <Row chip={<QAChip kind="fact-check" result="passed" />}>
            All extracted claims have supporting evidence.
          </Row>
          <Row chip={<QAChip kind="fact-check" result="partial" detail="2 issues" />}>
            Some claims flagged; editor must acknowledge before publish.
          </Row>
          <Row chip={<QAChip kind="fact-check" result="failed" />}>Hard fail. Don&apos;t ship.</Row>
          <Row chip={<QAChip kind="voice" result="passed" detail="5/5" />}>
            Brand voice check passed. Underlying score 4+ (out of 5) — hover for the raw score.
          </Row>
          <Row chip={<QAChip kind="voice" result="partial" detail="3/5" />}>
            Voice partially on-brand. Edit recommended. Hover for the raw score.
          </Row>
          <Row chip={<QAChip kind="voice" result="failed" detail="1/5" />}>Voice off-brand. Regenerate.</Row>
          <Row chip={<QAChip kind="originality" result="passed" />}>
            No suspicious overlap with source markdown.
          </Row>
          <Row chip={<QAChip kind="originality" result="partial" />}>
            Some sentences are too close to source. Rewrite a paragraph.
          </Row>
        </Table>
      </Section>

      <Section title="Time + lifecycle" subtitle="Countdowns and arrival times.">
        <Table>
          <Row chip={<RelativeTimeChip timestamp={TWO_HOURS_AGO} />}>
            When intel arrived. Relative under 7 days, absolute (May 12) beyond.
          </Row>
          <Row chip={<RelativeTimeChip timestamp={THREE_DAYS_AGO} />}>
            Three-day-old arrival.
          </Row>
          <Row chip={<EndDateChip endsAt={ENDS_IN_10_DAYS} />}>
            End date &gt; 7 days out. Informational grey.
          </Row>
          <Row chip={<EndDateChip endsAt={ENDS_IN_2_DAYS} />}>
            End date ≤ 3 days. Red urgency.
          </Row>
        </Table>
      </Section>

      <Section title="Dedup signals" subtitle="From the ingestItem orchestrator.">
        <Table>
          <Row chip={<ConfirmationCountChip count={2} sources={['TPG email', 'Reddit r/awardtravel']} />}>
            Other sources later confirmed this. Increments silently as dups attach.
          </Row>
          <Row chip={<ConfirmationCountChip count={1} />}>
            Single confirmation, source name not recorded.
          </Row>
        </Table>
      </Section>

      <Section title="Chip row + 4-cap rule" subtitle="Hard cap: 4 chips visible per row.">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          Below: 7 chips in a ChipRow. First 4 render inline. Click <code>+3 more ▾</code> to reveal
          the rest. Mobile uses the same accordion pattern (no modal).
        </p>
        <ChipRow maxVisible={4}>
          <StatusChip status="pending" />
          <EndDateChip endsAt={ENDS_IN_2_DAYS} />
          <SourceChip name="OMAAT" />
          <ConfidenceChip level="high" />
          <FactOriginChip origin="secondary" />
          <ConfirmationCountChip count={2} />
          <RelativeTimeChip timestamp={TWO_HOURS_AGO} />
        </ChipRow>
      </Section>

      <Section
        title="Provenance Panel"
        subtitle="Inline accordion below each item. Renders source chain, confirmations, surface locations, and the full status timeline. Same pattern on mobile (no modal)."
      >
        <ProvenancePanel
          defaultOpen
          data={{
            source_name: 'OMAAT',
            source_url: 'https://onemileatatime.com/example',
            confidence: 'high',
            fact_origin: 'secondary',
            arrived_at: TWO_HOURS_AGO,
            confirmation_count: 2,
            confirming_sources: ['TPG email', 'Reddit r/awardtravel'],
            surface_locations: ['home_banner', 'live_bar:marriott-bonvoy'],
            haiku_diff_summary: 'Bonus rate bumped from 25% to 30% on 2026-05-15',
            timeline: [
              {
                occurred_at: THREE_DAYS_AGO,
                actor: 'scout',
                description: 'Scout caught this from OMAAT',
              },
              {
                occurred_at: TWO_HOURS_AGO,
                actor: 'jill',
                description: 'Approved for writing in Triage',
              },
            ],
          }}
        />
      </Section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          color: 'var(--admin-text)',
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(13rem, max-content) 1fr',
        gap: '0.75rem 1.25rem',
        alignItems: 'baseline',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius)',
        padding: '1rem 1.25rem',
      }}
    >
      {children}
    </div>
  )
}

function Row({ chip, children }: { chip: ReactNode; children: ReactNode }) {
  return (
    <>
      <div>{chip}</div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--admin-text)',
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </>
  )
}
