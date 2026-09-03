import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createAdminClient } from '@/utils/supabase/server'
import { Icon, type IconName } from '@/components/admin/preview/kit'
import { addExpense, deleteExpense } from './actions'
import { EXPENSE_CATEGORIES, type ExpenseRow } from './shared'
import { Calculator } from './Calculator'
import { VENDORS, type Vendor, type VendorRec } from '@/lib/vendors'

export const dynamic = 'force-dynamic'

const DISPLAY = 'var(--font-display)'

// ── Vendor rollup helpers ────────────────────────────────────────────────────
// Anthropic is metered pay-as-you-go, so its monthly figure is read LIVE from
// ai_usage_log. That table has >10k rows and a single select caps at 1000, so
// we PAGINATE with .range() until a page comes back short, summing cost_usd for
// rows inside the last 30 days.
async function sumAnthropic30d(
  db: ReturnType<typeof createAdminClient>,
): Promise<{ dollars: number; ok: boolean }> {
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  let total = 0
  let from = 0
  const PAGE = 1000
  try {
    for (;;) {
      const { data, error } = await db
        .from('ai_usage_log')
        .select('created_at, cost_usd')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)
      if (error) return { dollars: 0, ok: false }
      const rows = data ?? []
      for (const r of rows) total += Number((r as { cost_usd: number | string }).cost_usd) || 0
      if (rows.length < PAGE) break
      from += PAGE
    }
  } catch {
    return { dollars: 0, ok: false }
  }
  return { dollars: total, ok: true }
}

const REC_META: Record<VendorRec, { label: string; cls: string }> = {
  hold: { label: 'Hold', cls: 'vs-chip-hold' },
  watch: { label: 'Watch', cls: 'vs-chip-watch' },
  action: { label: 'Action', cls: 'vs-chip-action' },
}

// Total monthly cost for a vendor (Anthropic's comes from the live figure).
function vendorTotal(v: Vendor, liveAnthropic: number): number {
  return v.flatMonthly + (v.usageMonthly ?? 0) + (v.live ? liveAnthropic : 0)
}

// The scannable "$20 + ~$65 usage" / "~$47 (live)" / "$0" money string.
function vendorMoney(v: Vendor, liveAnthropic: number): string {
  if (v.live) return `~$${Math.round(liveAnthropic)} (live)`
  if (v.usageMonthly != null) return `$${v.flatMonthly} + ~$${v.usageMonthly} usage`
  return `$${v.flatMonthly}`
}

// ── Money helpers — reconcile in integer CENTS, never float dollars ──────────
// numeric(12,2) comes back as a string like "12.34". Parse to exact cents so
// sums never drift (0.1 + 0.2 problems), then format once for display.
function toCents(amount: string | number | null): number {
  if (amount == null) return 0
  const n = typeof amount === 'number' ? amount : parseFloat(amount)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
function fmtMoney(cents: number): string {
  const dollars = cents / 100
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Category presentation ────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: IconName }> = {
  hosting: { label: 'Hosting', icon: 'globe' },
  supabase: { label: 'Supabase', icon: 'database' },
  'api-llm': { label: 'API / LLM', icon: 'bolt' },
  email: { label: 'Email', icon: 'mail' },
  ads: { label: 'Ads', icon: 'megaphone' },
  tools: { label: 'Tools', icon: 'briefcase' },
  other: { label: 'Other', icon: 'tag' },
}
const catMeta = (c: string | null) =>
  (c && CATEGORY_META[c]) || { label: c || 'Uncategorized', icon: 'tag' as IconName }

function fmtDate(iso: string): string {
  // iso is a bare date (YYYY-MM-DD) — parse as UTC to avoid TZ off-by-one.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ExpensesPage() {
  const db = createAdminClient()

  // Header illustration (royal piggy bank). Lights up when the file exists; falls
  // back to the credit-card glyph otherwise — same pattern as the org Ideas box.
  const hasExpArt = existsSync(join(process.cwd(), 'public', 'team', 'expenses.png'))

  const { data } = await db
    .from('expenses')
    .select('id, spent_on, amount, vendor, category, note, created_at')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
  const expenses = (data ?? []) as ExpenseRow[]

  // All-time + this-month totals (in cents).
  const allTimeCents = expenses.reduce((s, e) => s + toCents(e.amount), 0)
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthCents = expenses
    .filter((e) => e.spent_on.slice(0, 7) === thisMonthKey)
    .reduce((s, e) => s + toCents(e.amount), 0)

  // Group by month (YYYY-MM), newest first, with subtotals.
  const monthMap = new Map<string, ExpenseRow[]>()
  for (const e of expenses) {
    const key = e.spent_on.slice(0, 7)
    ;(monthMap.get(key) ?? monthMap.set(key, []).get(key)!).push(e)
  }
  const months = Array.from(monthMap.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, rows]) => {
      const [y, m] = key.split('-').map(Number)
      const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      const subtotal = rows.reduce((s, r) => s + toCents(r.amount), 0)
      return { key, label, rows, subtotal }
    })

  const recent = expenses.slice(0, 25)
  const today = new Date().toISOString().slice(0, 10)

  // ── Vendor rollup: read the LIVE Anthropic 30-day spend, then rank vendors ──
  const anthropic = await sumAnthropic30d(db)
  const liveAnthropic = anthropic.dollars
  const vendorsRanked = [...VENDORS].sort(
    (a, b) => vendorTotal(b, liveAnthropic) - vendorTotal(a, liveAnthropic),
  )
  const vendorGrandTotal = Math.round(
    VENDORS.reduce((s, v) => s + vendorTotal(v, liveAnthropic), 0),
  )

  return (
    <div className="ex-root">
      <style dangerouslySetInnerHTML={{ __html: EX_CSS }} />
      <div className="ex-wrap">
        {/* ── Header ── */}
        <header className="ex-header">
          <div className="ex-head-row">
            {hasExpArt ? (
              <span className="ex-hero-art">
                <Image src="/team/expenses.png" alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
              </span>
            ) : (
              <span className="ex-hero-ic"><Icon name="creditCard" size={26} /></span>
            )}
            <div className="ex-head-id">
              <h1 className="ex-title">Expenses</h1>
              <p className="ex-sub">
                The money going out — every dollar logged to the penny. Hosting, Supabase, API/LLM,
                email, ads, tools. Log it here and nothing gets lost at tax time.
              </p>
            </div>
          </div>
        </header>

        {/* ── Totals (the hero) ── */}
        <section className="ex-totals">
          <div className="ex-total-card ex-total-primary">
            <span className="ex-total-label">All-time out</span>
            <span className="ex-total-value">{fmtMoney(allTimeCents)}</span>
            <span className="ex-total-meta">{expenses.length} expense{expenses.length === 1 ? '' : 's'} logged</span>
          </div>
          <div className="ex-total-card">
            <span className="ex-total-label">This month</span>
            <span className="ex-total-value">{fmtMoney(thisMonthCents)}</span>
            <span className="ex-total-meta">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </section>

        {/* ── Vendor subscriptions & spend (the single source of truth) ── */}
        <section className="ex-section vs-section">
          <div className="ex-sec-head">
            <div>
              <h2 className="ex-sec-title">Vendor subscriptions &amp; spend</h2>
              <p className="vs-sub">What we pay every month, and whether to change it.</p>
            </div>
            <span className="ex-sec-meta">{VENDORS.length} vendors</span>
          </div>

          {/* Biggest-lever callout */}
          <div className="vs-callout">
            <span className="vs-callout-ic"><Icon name="bolt" size={18} /></span>
            <div className="vs-callout-body">
              <span className="vs-callout-label">Biggest lever</span>
              <span className="vs-callout-text">
                <strong>Vercel</strong> — 97% of its bill is build-CPU from frequent deploys.
                The Ignored Build Step guard was fixed 2026-09-03 (it had exempted the
                main branch); now watching this line drop. Check ~2026-09-10.
              </span>
            </div>
          </div>

          <div className="ex-card vs-card">
            {/* Total line */}
            <div className="vs-total">
              <span className="vs-total-value">~${vendorGrandTotal.toLocaleString('en-US')}</span>
              <span className="vs-total-unit">/mo across {VENDORS.length} vendors</span>
              {!anthropic.ok && (
                <span className="vs-total-warn">· Anthropic live figure unavailable</span>
              )}
            </div>

            {/* Rows, biggest total first */}
            <div className="vs-rows">
              {vendorsRanked.map((v) => {
                const rec = REC_META[v.rec]
                return (
                  <div key={v.key} className="vs-row">
                    <div className="vs-cell vs-cell-name">
                      <span className="vs-name">{v.name}</span>
                      <span className="vs-plan">{v.plan}</span>
                    </div>
                    <div className="vs-cell vs-cell-cost">
                      <span className="vs-cost">{vendorMoney(v, liveAnthropic)}</span>
                    </div>
                    <div className="vs-cell vs-cell-limit">
                      <span className="vs-meta-lbl">Limit</span>
                      <span className="vs-meta-val">{v.limit}</span>
                    </div>
                    <div className="vs-cell vs-cell-next">
                      <span className="vs-meta-lbl">Next tier</span>
                      <span className="vs-meta-val">{v.nextTier}</span>
                    </div>
                    <div className="vs-cell vs-cell-rec">
                      <span className={`vs-chip ${rec.cls}`}>{rec.label}</span>
                    </div>
                    <p className="vs-note">
                      {v.note}
                      {v.renewal && <span className="vs-renewal"> · Renews {v.renewal}</span>}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Two-column: add form + calculator ── */}
        <section className="ex-cols">
          {/* Add expense */}
          <div className="ex-card ex-add">
            <h2 className="ex-card-title"><Icon name="plus" size={17} /> Log an expense</h2>
            <form action={addExpense} className="ex-form">
              <div className="ex-field">
                <label className="ex-lbl" htmlFor="ex-date">Date</label>
                <input id="ex-date" className="ex-input" type="date" name="spent_on" defaultValue={today} required />
              </div>
              <div className="ex-field">
                <label className="ex-lbl" htmlFor="ex-amount">Amount</label>
                <div className="ex-amount-wrap">
                  <span className="ex-amount-dollar">$</span>
                  <input id="ex-amount" className="ex-input ex-input-amount" type="number" name="amount"
                    inputMode="decimal" step="0.01" min="0.01" placeholder="0.00" required />
                </div>
              </div>
              <div className="ex-field">
                <label className="ex-lbl" htmlFor="ex-category">Category</label>
                <select id="ex-category" className="ex-input" name="category" defaultValue="api-llm">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_META[c]?.label ?? c}</option>
                  ))}
                </select>
              </div>
              <div className="ex-field">
                <label className="ex-lbl" htmlFor="ex-vendor">Vendor</label>
                <input id="ex-vendor" className="ex-input" type="text" name="vendor" placeholder="Vercel, Anthropic, Resend…" />
              </div>
              <div className="ex-field ex-field-full">
                <label className="ex-lbl" htmlFor="ex-note">Note</label>
                <input id="ex-note" className="ex-input" type="text" name="note" placeholder="Invoice #, what it was for…" />
              </div>
              <div className="ex-field-full">
                <button type="submit" className="ex-btn ex-btn-primary"><Icon name="plus" size={15} /> Add expense</button>
              </div>
            </form>
          </div>

          {/* Calculator */}
          <div className="ex-card ex-calc-card">
            <h2 className="ex-card-title"><Icon name="gauge" size={17} /> Quick calculator</h2>
            <Calculator />
          </div>
        </section>

        {/* ── Monthly view ── */}
        <section className="ex-section">
          <div className="ex-sec-head">
            <h2 className="ex-sec-title">By month</h2>
            <span className="ex-sec-meta">{months.length} month{months.length === 1 ? '' : 's'}</span>
          </div>

          {months.length === 0 ? (
            <div className="ex-card ex-empty">
              <span className="ex-empty-ic"><Icon name="inbox" size={22} /></span>
              <div>
                <div className="ex-empty-title">No expenses logged yet</div>
                <div className="ex-empty-sub">Add your first expense above and it'll show up here, grouped by month.</div>
              </div>
            </div>
          ) : (
            <div className="ex-months">
              {months.map((mo) => (
                <div key={mo.key} className="ex-card ex-month">
                  <div className="ex-month-head">
                    <span className="ex-month-label">{mo.label}</span>
                    <span className="ex-month-total">{fmtMoney(mo.subtotal)}</span>
                  </div>
                  <div className="ex-month-rows">
                    {mo.rows.map((e) => {
                      const cm = catMeta(e.category)
                      return (
                        <div key={e.id} className="ex-mrow">
                          <span className="ex-mrow-ic"><Icon name={cm.icon} size={15} /></span>
                          <span className="ex-mrow-date">{fmtDate(e.spent_on)}</span>
                          <span className="ex-mrow-vendor">{e.vendor || <span className="ex-muted">—</span>}</span>
                          <span className="ex-mrow-cat">{cm.label}</span>
                          <span className="ex-mrow-amt">{fmtMoney(toCents(e.amount))}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Recent (with delete) ── */}
        <section className="ex-section ex-section-last">
          <div className="ex-sec-head">
            <h2 className="ex-sec-title">Recent</h2>
            <span className="ex-sec-meta">Last {recent.length}</span>
          </div>

          {recent.length === 0 ? (
            <div className="ex-card ex-empty">
              <span className="ex-empty-ic"><Icon name="inbox" size={22} /></span>
              <div>
                <div className="ex-empty-title">Nothing logged</div>
                <div className="ex-empty-sub">Your most recent expenses will appear here.</div>
              </div>
            </div>
          ) : (
            <div className="ex-card ex-recent">
              {recent.map((e) => {
                const cm = catMeta(e.category)
                return (
                  <div key={e.id} className="ex-rrow">
                    <span className="ex-rrow-ic"><Icon name={cm.icon} size={16} /></span>
                    <div className="ex-rrow-body">
                      <div className="ex-rrow-top">
                        <span className="ex-rrow-vendor">{e.vendor || cm.label}</span>
                        <span className="ex-rrow-cat">{cm.label}</span>
                      </div>
                      <div className="ex-rrow-meta">
                        <span>{fmtDate(e.spent_on)}</span>
                        {e.note && <span className="ex-rrow-note">· {e.note}</span>}
                      </div>
                    </div>
                    <span className="ex-rrow-amt">{fmtMoney(toCents(e.amount))}</span>
                    <form action={async () => { 'use server'; await deleteExpense(e.id) }}>
                      <button type="submit" className="ex-del" aria-label="Delete expense"><Icon name="trash" size={15} /></button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const EX_CSS = `
.admin .ex-wrap { max-width:960px; margin:0 auto; padding:0 4px; }

/* Header */
.admin .ex-header { margin-bottom:2rem; }
.admin .ex-head-row { display:flex; align-items:center; gap:1.1rem; }
.admin .ex-head-id { min-width:0; }
.admin .ex-hero-art { position:relative; width:64px; height:64px; border-radius:16px; flex-shrink:0; overflow:hidden; background:radial-gradient(circle at 30% 25%, var(--admin-surface), color-mix(in srgb, var(--color-accent) 20%, var(--admin-surface))); border:1px solid color-mix(in srgb, var(--color-accent) 38%, var(--admin-border)); box-shadow:0 10px 24px -14px rgba(212,175,55,.7); }
.admin .ex-hero-ic { display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:16px; flex-shrink:0; color:#8a6d12; background:radial-gradient(circle at 30% 25%, var(--admin-surface), color-mix(in srgb, var(--color-accent) 26%, var(--admin-surface))); border:1px solid color-mix(in srgb, var(--color-accent) 38%, var(--admin-border)); box-shadow:0 8px 20px -12px rgba(212,175,55,.7); }
.admin .ex-title { font-family:${DISPLAY}; font-size:2.4rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:0; line-height:1.03; }
.admin .ex-sub { margin:.6rem 0 0; font-size:1rem; line-height:1.55; color:var(--admin-text-secondary); max-width:62ch; }

/* Totals */
.admin .ex-totals { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-bottom:2.2rem; }
.admin .ex-total-card { display:flex; flex-direction:column; gap:4px; padding:1.3rem 1.5rem; border-radius:16px; background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }
.admin .ex-total-primary { background:color-mix(in srgb, var(--color-primary) 6%, #fff); border-color:color-mix(in srgb, var(--color-primary) 22%, var(--admin-border)); }
.admin .ex-total-label { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; font-weight:700; color:var(--admin-text-subtle); }
.admin .ex-total-value { font-family:${DISPLAY}; font-size:2.1rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); font-variant-numeric:tabular-nums; line-height:1.05; }
.admin .ex-total-meta { font-size:var(--admin-text-sm); color:var(--admin-text-muted); }

/* Two-col */
.admin .ex-cols { display:grid; grid-template-columns:minmax(0, 1.35fr) minmax(0, 1fr); gap:16px; margin-bottom:2.4rem; align-items:start; }

/* Card base */
.admin .ex-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:16px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); }
.admin .ex-card-title { display:flex; align-items:center; gap:8px; font-family:${DISPLAY}; font-size:1.15rem; font-weight:700; color:var(--admin-text); margin:0; padding:1.1rem 1.3rem .3rem; }
.admin .ex-card-title svg { color:var(--color-accent); }

/* Add form */
.admin .ex-form { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:.6rem 1.3rem 1.3rem; }
.admin .ex-field { display:flex; flex-direction:column; gap:5px; min-width:0; }
.admin .ex-field-full { grid-column:1 / -1; }
.admin .ex-lbl { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--admin-text-subtle); }
.admin .ex-input { font-family:var(--font-ui); font-size:1rem; padding:9px 12px; border-radius:10px; border:1px solid var(--admin-border); background:var(--admin-surface); color:var(--admin-text); width:100%; }
.admin .ex-input:focus-visible { outline:2px solid var(--color-primary); outline-offset:1px; }
.admin .ex-amount-wrap { position:relative; display:flex; align-items:center; }
.admin .ex-amount-dollar { position:absolute; left:12px; font-weight:700; color:var(--admin-text-muted); pointer-events:none; }
.admin .ex-input-amount { padding-left:24px; font-variant-numeric:tabular-nums; }

/* Buttons */
.admin .ex-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; font-family:var(--font-ui); font-size:var(--admin-text-sm); font-weight:700; padding:10px 18px; border-radius:9999px; cursor:pointer; border:1px solid transparent; transition:background .14s ease, border-color .14s ease; }
.admin .ex-btn-primary { color:#fff; background:var(--color-primary); border-color:var(--color-primary); width:100%; }
.admin .ex-btn-primary:hover { background:var(--color-primary-hover); }

/* Sections */
.admin .ex-section { margin-bottom:2.6rem; }
.admin .ex-section-last { margin-bottom:3.5rem; }
.admin .ex-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .ex-sec-title { font-family:${DISPLAY}; font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .ex-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; flex-shrink:0; }

/* Empty */
.admin .ex-empty { display:flex; align-items:center; gap:14px; padding:1.5rem 1.6rem; }
.admin .ex-empty-ic { display:flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; flex-shrink:0; color:var(--admin-text-muted); background:var(--admin-surface-alt); }
.admin .ex-empty-title { font-size:1rem; font-weight:700; color:var(--admin-text); }
.admin .ex-empty-sub { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; }

/* Months */
.admin .ex-months { display:flex; flex-direction:column; gap:14px; }
.admin .ex-month-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; padding:14px 16px; border-bottom:1px solid var(--admin-border); }
.admin .ex-month-label { font-family:${DISPLAY}; font-size:1.1rem; font-weight:700; color:var(--admin-text); }
.admin .ex-month-total { font-size:1.1rem; font-weight:800; color:var(--color-primary); font-variant-numeric:tabular-nums; }
.admin .ex-month-rows { padding:4px 6px 6px; }
.admin .ex-mrow { display:grid; grid-template-columns:26px 108px 1fr auto auto; align-items:center; gap:10px; padding:9px 10px; }
.admin .ex-mrow + .ex-mrow { border-top:1px solid var(--admin-border); }
.admin .ex-mrow-ic { display:flex; align-items:center; justify-content:center; color:var(--admin-text-muted); }
.admin .ex-mrow-date { font-size:var(--admin-text-sm); color:var(--admin-text-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }
.admin .ex-mrow-vendor { font-size:.92rem; font-weight:600; color:var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
.admin .ex-mrow-cat { font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--admin-text-subtle); background:var(--admin-surface-alt); padding:3px 9px; border-radius:9999px; white-space:nowrap; }
.admin .ex-mrow-amt { font-size:.95rem; font-weight:700; color:var(--admin-text); font-variant-numeric:tabular-nums; text-align:right; white-space:nowrap; }
.admin .ex-muted { color:var(--admin-text-subtle); }

/* Recent */
.admin .ex-recent { padding:6px; }
.admin .ex-rrow { display:flex; align-items:center; gap:12px; padding:12px 14px; }
.admin .ex-rrow + .ex-rrow { border-top:1px solid var(--admin-border); }
.admin .ex-rrow-ic { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .ex-rrow-body { min-width:0; flex:1; }
.admin .ex-rrow-top { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.admin .ex-rrow-vendor { font-size:.95rem; font-weight:700; color:var(--admin-text); }
.admin .ex-rrow-cat { font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--admin-text-subtle); background:var(--admin-surface-alt); padding:2px 8px; border-radius:9999px; }
.admin .ex-rrow-meta { font-size:var(--admin-text-sm); color:var(--admin-text-muted); margin-top:2px; }
.admin .ex-rrow-note { color:var(--admin-text-subtle); }
.admin .ex-rrow-amt { font-size:1rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; white-space:nowrap; flex-shrink:0; }
.admin .ex-del { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:9px; flex-shrink:0; cursor:pointer; color:var(--admin-text-subtle); background:transparent; border:1px solid var(--admin-border); transition:color .14s, background .14s, border-color .14s; }
.admin .ex-del:hover { color:var(--admin-danger); background:var(--admin-danger-soft); border-color:var(--admin-danger); }

/* Calculator */
.admin .ex-calc-card { padding-bottom:1.1rem; }
.admin .calc { padding:.4rem 1.1rem 0; outline:none; }
.admin .calc:focus-visible { outline:none; }
.admin .calc-display { display:flex; align-items:baseline; justify-content:flex-end; gap:8px; padding:14px 16px; border-radius:12px; background:var(--admin-surface-alt); border:1px solid var(--admin-border); margin-bottom:12px; min-height:56px; }
.admin .calc-op-hint { font-size:1.2rem; color:var(--admin-text-subtle); font-weight:700; min-width:12px; }
.admin .calc-value { font-family:${DISPLAY}; font-size:1.9rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; line-height:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .calc-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; }
.admin .calc-key { font-family:var(--font-ui); font-size:1.05rem; font-weight:700; height:48px; border-radius:11px; cursor:pointer; border:1px solid var(--admin-border); background:var(--admin-surface); color:var(--admin-text); transition:background .12s, border-color .12s, color .12s; }
.admin .calc-key:hover { background:var(--admin-surface-alt); }
.admin .calc-key:active { transform:translateY(1px); }
.admin .calc-key:focus-visible { outline:2px solid var(--color-primary); outline-offset:1px; }
.admin .calc-wide { grid-column:span 2; }
.admin .calc-op { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border-color:color-mix(in srgb, var(--color-primary) 20%, var(--admin-border)); }
.admin .calc-op:hover { background:color-mix(in srgb, var(--color-primary) 14%, #fff); }
.admin .calc-fn { color:var(--admin-text-muted); background:var(--admin-surface-alt); }
.admin .calc-eq { color:#fff; background:var(--color-primary); border-color:var(--color-primary); }
.admin .calc-eq:hover { background:var(--color-primary-hover); }
.admin .calc-hint { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); margin:12px 2px 0; line-height:1.4; }

/* ── Vendor subscriptions & spend ── */
.admin .vs-section { margin-bottom:2.8rem; }
.admin .vs-sub { margin:2px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); }

/* Biggest-lever callout */
.admin .vs-callout { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-radius:14px; margin-bottom:14px; background:color-mix(in srgb, var(--color-accent) 12%, var(--admin-surface)); border:1px solid color-mix(in srgb, var(--color-accent) 40%, var(--admin-border)); }
.admin .vs-callout-ic { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; flex-shrink:0; color:#8a6d12; background:color-mix(in srgb, var(--color-accent) 24%, #fff); border:1px solid color-mix(in srgb, var(--color-accent) 42%, var(--admin-border)); }
.admin .vs-callout-body { display:flex; flex-direction:column; gap:2px; min-width:0; }
.admin .vs-callout-label { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:#8a6d12; }
.admin .vs-callout-text { font-size:.95rem; line-height:1.5; color:var(--admin-text); }
.admin .vs-callout-text strong { font-weight:800; }
.admin .vs-callout-text em { font-style:normal; font-weight:700; color:var(--color-primary); }

/* Card + total */
.admin .vs-card { padding:6px 6px 10px; }
.admin .vs-total { display:flex; align-items:baseline; flex-wrap:wrap; gap:6px; padding:16px 16px 12px; border-bottom:1px solid var(--admin-border); }
.admin .vs-total-value { font-family:${DISPLAY}; font-size:1.9rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); font-variant-numeric:tabular-nums; line-height:1; }
.admin .vs-total-unit { font-size:1rem; font-weight:600; color:var(--admin-text-muted); }
.admin .vs-total-warn { font-size:var(--admin-text-sm); color:var(--admin-warning); font-weight:600; }

/* Rows */
.admin .vs-rows { display:flex; flex-direction:column; }
.admin .vs-row { display:grid; grid-template-columns:minmax(150px, 1.1fr) minmax(120px, 0.9fr) minmax(190px, 1.6fr) minmax(130px, 1fr) auto; grid-template-areas:"name cost limit next rec" "note note note note note"; align-items:center; gap:8px 14px; padding:14px 12px; }
.admin .vs-row + .vs-row { border-top:1px solid var(--admin-border); }
.admin .vs-cell { min-width:0; }
.admin .vs-cell-name { grid-area:name; display:flex; flex-direction:column; gap:2px; }
.admin .vs-name { font-size:1rem; font-weight:800; color:var(--admin-text); }
.admin .vs-plan { font-size:var(--admin-text-sm); color:var(--admin-text-muted); }
.admin .vs-cell-cost { grid-area:cost; }
.admin .vs-cost { font-size:.95rem; font-weight:700; color:var(--admin-text); font-variant-numeric:tabular-nums; }
.admin .vs-cell-limit { grid-area:limit; display:flex; flex-direction:column; gap:1px; }
.admin .vs-cell-next { grid-area:next; display:flex; flex-direction:column; gap:1px; }
.admin .vs-meta-lbl { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.06em; font-weight:700; color:var(--admin-text-subtle); }
.admin .vs-meta-val { font-size:var(--admin-text-sm); color:var(--admin-text-secondary); line-height:1.35; }
.admin .vs-cell-rec { grid-area:rec; justify-self:end; }
.admin .vs-chip { display:inline-flex; align-items:center; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.05em; padding:4px 12px; border-radius:9999px; white-space:nowrap; border:1px solid transparent; }
.admin .vs-chip-hold { color:var(--admin-success); background:var(--admin-success-soft); border-color:color-mix(in srgb, var(--admin-success) 30%, transparent); }
.admin .vs-chip-watch { color:var(--admin-warning); background:var(--admin-warning-soft); border-color:color-mix(in srgb, var(--admin-warning) 32%, transparent); }
.admin .vs-chip-action { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 10%, #fff); border-color:color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); }
.admin .vs-note { grid-area:note; margin:2px 0 0; font-size:var(--admin-text-sm); line-height:1.5; color:var(--admin-text-muted); }
.admin .vs-renewal { color:var(--admin-text-subtle); font-weight:600; }

@media (max-width:760px) {
  .admin .ex-cols { grid-template-columns:1fr; }
  .admin .vs-row { grid-template-columns:1fr auto; grid-template-areas:"name rec" "cost cost" "limit limit" "next next" "note note"; gap:6px 12px; }
  .admin .vs-cell-cost { margin-top:2px; }
  .admin .vs-cell-rec { align-self:start; }
}
@media (max-width:600px) {
  .admin .ex-form { grid-template-columns:1fr; }
  .admin .ex-mrow { grid-template-columns:22px 1fr auto; row-gap:2px; }
  .admin .ex-mrow-date { grid-column:2; }
  .admin .ex-mrow-vendor { grid-column:2; }
  .admin .ex-mrow-cat { display:none; }
  .admin .ex-mrow-amt { grid-row:1 / span 2; grid-column:3; }
  .admin .ex-title { font-size:2rem; }
}
`
