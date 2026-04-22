'use client'

import { useState, useTransition } from 'react'
import { runScoutAction, runBriefAction, type JobResult } from './actions'

interface JobState {
  result: JobResult | null
  running: boolean
}

export default function JobsPanel() {
  const [scout, setScout] = useState<JobState>({ result: null, running: false })
  const [brief, setBrief] = useState<JobState>({ result: null, running: false })
  const [, startTransition] = useTransition()

  function run(kind: 'scout' | 'brief') {
    const setter = kind === 'scout' ? setScout : setBrief
    const action = kind === 'scout' ? runScoutAction : runBriefAction
    setter({ result: null, running: true })
    startTransition(async () => {
      const result = await action()
      setter({ result, running: false })
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <JobCard
        title="Run Scout"
        description="Fetches active sources, runs Claude Scout, writes findings to intel_items, auto-stages high-confidence items as pending_review alerts."
        runLabel="Run Scout Now"
        state={scout}
        onRun={() => run('scout')}
      />
      <JobCard
        title="Run Brief"
        description="Reads the last 24h of intel_items, generates the editorial plan + Writer drafts, runs fact-check, and emails the daily brief."
        runLabel="Run Brief Now"
        state={brief}
        onRun={() => run('brief')}
      />
    </div>
  )
}

function JobCard({
  title,
  description,
  runLabel,
  state,
  onRun,
}: {
  title: string
  description: string
  runLabel: string
  state: JobState
  onRun: () => void
}) {
  return (
    <div
      style={{
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem 1.25rem',
        background: 'var(--color-background)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{title}</h2>
          <p style={{ margin: '0.375rem 0 0', fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={state.running}
          className="rg-btn-primary"
          style={{ whiteSpace: 'nowrap', opacity: state.running ? 0.6 : 1, cursor: state.running ? 'wait' : 'pointer' }}
        >
          {state.running ? 'Running…' : runLabel}
        </button>
      </div>

      {state.result && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 0.875rem',
            borderRadius: 'var(--radius-ui)',
            background: state.result.ok ? '#E8F5E9' : '#FDECEA',
            border: `1px solid ${state.result.ok ? '#A5D6A7' : '#E6B8B2'}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', fontWeight: 600 }}>
            <span style={{ color: state.result.ok ? '#2E7D32' : '#7a1f1f' }}>
              {state.result.ok ? '✓ Success' : '✗ Failed'} · HTTP {state.result.status}
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{(state.result.durationMs / 1000).toFixed(1)}s</span>
          </div>
          <pre
            style={{
              margin: '0.5rem 0 0',
              padding: '0.625rem',
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-ui)',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '16rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {typeof state.result.body === 'string' ? state.result.body : JSON.stringify(state.result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
