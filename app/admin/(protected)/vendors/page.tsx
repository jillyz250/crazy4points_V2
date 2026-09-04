import { createAdminClient } from '@/utils/supabase/server'
import { Icon } from '@/components/admin/preview/kit'
import AllClearArt from '@/components/admin/AllClearArt'
import { saveVendor, deleteVendor } from './actions'

export const dynamic = 'force-dynamic'

const DISPLAY = 'var(--font-display)'

type VendorRow = {
  id: string
  slug: string
  name: string
  category: string | null
  website: string | null
  account_url: string | null
  contact_name: string | null
  contact_email: string | null
  plan: string | null
  flat_monthly: number
  usage_monthly: number | null
  billing_cycle: string
  renewal_date: string | null
  status: string
  rec: string | null
  notes: string | null
}

const CATEGORIES = ['infra', 'ai', 'email', 'data', 'hosting', 'workspace', 'other']
const CYCLES = ['monthly', 'annual', 'usage']
const STATUSES = ['active', 'trial', 'cancelled']
const RECS = ['hold', 'watch', 'action']

const REC_LABEL: Record<string, string> = { hold: 'Hold', watch: 'Watch', action: 'Action' }
const STATUS_LABEL: Record<string, string> = { active: 'Active', trial: 'Trial', cancelled: 'Cancelled' }

function money(n: number | null | undefined): string {
  const v = Number(n) || 0
  return v === 0 ? '—' : `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}
function fmtRenewal(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// One vendor's editable form fields — shared by the Add form and each row's edit.
function VendorFields({ v }: { v?: VendorRow }) {
  return (
    <div className="vn-form-grid">
      <label className="vn-f">Name<input name="name" defaultValue={v?.name ?? ''} required /></label>
      <label className="vn-f">Category
        <select name="category" defaultValue={v?.category ?? 'other'}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="vn-f">Plan<input name="plan" defaultValue={v?.plan ?? ''} placeholder="e.g. Pro + usage" /></label>
      <label className="vn-f">Website<input name="website" defaultValue={v?.website ?? ''} placeholder="https://" /></label>
      <label className="vn-f">Login / billing URL<input name="account_url" defaultValue={v?.account_url ?? ''} placeholder="https://" /></label>
      <label className="vn-f">Contact name<input name="contact_name" defaultValue={v?.contact_name ?? ''} /></label>
      <label className="vn-f">Contact email<input name="contact_email" type="email" defaultValue={v?.contact_email ?? ''} /></label>
      <label className="vn-f">Flat $/mo<input name="flat_monthly" inputMode="decimal" defaultValue={v?.flat_monthly ?? ''} placeholder="0" /></label>
      <label className="vn-f">Usage $/mo<input name="usage_monthly" inputMode="decimal" defaultValue={v?.usage_monthly ?? ''} placeholder="(if metered)" /></label>
      <label className="vn-f">Billing cycle
        <select name="billing_cycle" defaultValue={v?.billing_cycle ?? 'monthly'}>
          {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="vn-f">Renewal date<input name="renewal_date" type="date" defaultValue={v?.renewal_date ?? ''} /></label>
      <label className="vn-f">Status
        <select name="status" defaultValue={v?.status ?? 'active'}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </label>
      <label className="vn-f">Recommendation
        <select name="rec" defaultValue={v?.rec ?? ''}>
          <option value="">—</option>
          {RECS.map((r) => <option key={r} value={r}>{REC_LABEL[r]}</option>)}
        </select>
      </label>
      <label className="vn-f vn-f-wide">Notes<textarea name="notes" rows={2} defaultValue={v?.notes ?? ''} /></label>
    </div>
  )
}

export default async function VendorsPage() {
  const db = createAdminClient()
  const { data } = await db
    .from('vendors')
    .select('id, slug, name, category, website, account_url, contact_name, contact_email, plan, flat_monthly, usage_monthly, billing_cycle, renewal_date, status, rec, notes')
    .order('flat_monthly', { ascending: false })
    .order('name', { ascending: true })
  const vendors = (data ?? []) as VendorRow[]
  const active = vendors.filter((v) => v.status !== 'cancelled')
  const monthlyTotal = active.reduce((s, v) => s + (Number(v.flat_monthly) || 0) + (Number(v.usage_monthly) || 0), 0)

  return (
    <div className="vn-root">
      <style dangerouslySetInnerHTML={{ __html: VN_CSS }} />
      <div className="vn-wrap">
        <header className="vn-head">
          <div>
            <div className="vn-eyebrow">Erica &middot; Finance</div>
            <h1 className="vn-title" style={{ fontFamily: DISPLAY }}>Vendors</h1>
            <p className="vn-sub">Every tool we pay for — contact, login, plan, pricing, renewal. The money lives in <a href="/admin/expenses">Expenses</a>; product updates route here as vendor radar.</p>
          </div>
          <div className="vn-total">
            <span className="vn-total-num">{money(monthlyTotal)}</span>
            <span className="vn-total-label">/mo across {active.length} active</span>
          </div>
        </header>

        {/* Add a vendor */}
        <details className="vn-add">
          <summary><Icon name="plus" size={15} /> Add a vendor</summary>
          <form action={saveVendor} className="vn-form">
            <VendorFields />
            <div className="vn-form-actions"><button type="submit" className="vn-btn-primary">Save vendor</button></div>
          </form>
        </details>

        {/* List */}
        {vendors.length === 0 ? (
          <div className="vn-empty"><AllClearArt size={72} /><p>No vendors yet. Add your first above.</p></div>
        ) : (
          <div className="vn-list">
            {vendors.map((v) => (
              <div key={v.id} className={`vn-card${v.status === 'cancelled' ? ' vn-card-off' : ''}`}>
                <div className="vn-card-main">
                  <div className="vn-card-id">
                    <span className="vn-name">{v.name}</span>
                    {v.category && <span className="vn-chip">{v.category}</span>}
                    {v.rec && <span className={`vn-rec vn-rec-${v.rec}`}>{REC_LABEL[v.rec]}</span>}
                    {v.status !== 'active' && <span className="vn-status">{STATUS_LABEL[v.status] ?? v.status}</span>}
                  </div>
                  <div className="vn-card-meta">
                    <span className="vn-plan">{v.plan || '—'}</span>
                    <span className="vn-cost">{money((Number(v.flat_monthly) || 0) + (Number(v.usage_monthly) || 0))}/mo</span>
                    <span className="vn-renew">Renews {fmtRenewal(v.renewal_date)}</span>
                  </div>
                  <div className="vn-card-links">
                    {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer">Website</a>}
                    {v.account_url && <a href={v.account_url} target="_blank" rel="noopener noreferrer">Login</a>}
                    {v.contact_email
                      ? <a href={`mailto:${v.contact_email}`}>{v.contact_name || v.contact_email}</a>
                      : v.contact_name && <span className="vn-contact">{v.contact_name}</span>}
                  </div>
                  {v.notes && <p className="vn-notes">{v.notes}</p>}
                </div>
                <details className="vn-edit">
                  <summary aria-label={`Edit ${v.name}`}><Icon name="pencil" size={14} /> Edit</summary>
                  <form action={saveVendor} className="vn-form">
                    <input type="hidden" name="id" value={v.id} />
                    <VendorFields v={v} />
                    <div className="vn-form-actions">
                      <button type="submit" className="vn-btn-primary">Save changes</button>
                    </div>
                  </form>
                  <form action={deleteVendor} className="vn-del-form">
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="vn-btn-del"><Icon name="trash" size={13} /> Delete vendor</button>
                  </form>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const VN_CSS = `
.admin .vn-wrap { max-width:64rem; margin:0 auto; padding:1.5rem 1rem 4rem; }
.admin .vn-head { display:flex; align-items:flex-start; justify-content:space-between; gap:1.5rem; flex-wrap:wrap; margin-bottom:1.5rem; }
.admin .vn-eyebrow { font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-muted); }
.admin .vn-title { font-size:1.9rem; margin:.15rem 0 .3rem; color:var(--admin-text); }
.admin .vn-sub { margin:0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); max-width:42rem; line-height:1.5; }
.admin .vn-sub a { color:var(--color-primary); }
.admin .vn-total { text-align:right; }
.admin .vn-total-num { display:block; font-size:1.7rem; font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; }
.admin .vn-total-label { font-size:var(--admin-text-xs); color:var(--admin-text-muted); }

.admin .vn-add { margin-bottom:1.25rem; border:1px solid var(--admin-border); border-radius:var(--radius-card, 12px); background:var(--admin-surface); }
.admin .vn-add > summary { list-style:none; cursor:pointer; display:flex; align-items:center; gap:8px; padding:12px 16px; font-weight:700; font-size:var(--admin-text-sm); color:var(--color-primary); }
.admin .vn-add > summary::-webkit-details-marker { display:none; }
.admin .vn-form { padding:4px 16px 16px; }
.admin .vn-form-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
.admin .vn-f { display:flex; flex-direction:column; gap:4px; font-size:var(--admin-text-xs); font-weight:600; color:var(--admin-text-muted); }
.admin .vn-f-wide { grid-column:1 / -1; }
.admin .vn-f input, .admin .vn-f select, .admin .vn-f textarea {
  font:inherit; font-size:1rem; padding:8px 10px; border-radius:9px; color:var(--admin-text);
  background:#fff; border:1px solid var(--admin-border);
}
.admin .vn-f input:focus, .admin .vn-f select:focus, .admin .vn-f textarea:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .vn-form-actions { margin-top:12px; display:flex; gap:10px; }
.admin .vn-btn-primary { font:inherit; font-weight:700; font-size:var(--admin-text-sm); padding:9px 18px; border-radius:9px; border:none; cursor:pointer; color:#fff; background:var(--color-primary); }
.admin .vn-btn-primary:hover { background:var(--admin-accent-hover, var(--color-primary-hover)); }

.admin .vn-list { display:flex; flex-direction:column; gap:12px; }
.admin .vn-card { border:1px solid var(--admin-border); border-radius:var(--radius-card, 12px); background:var(--admin-surface); padding:14px 16px; }
.admin .vn-card-off { opacity:.6; }
.admin .vn-card-id { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.admin .vn-name { font-size:1.05rem; font-weight:800; color:var(--admin-text); }
.admin .vn-chip { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-muted); background:color-mix(in srgb, var(--color-primary) 6%, #fff); border:1px solid var(--admin-border); padding:1px 8px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; }
.admin .vn-rec { font-size:var(--admin-text-xs); font-weight:700; padding:1px 8px; border-radius:9999px; }
.admin .vn-rec-hold { color:var(--admin-success); background:var(--admin-success-soft, #e9f7ef); }
.admin .vn-rec-watch { color:#9a6a00; background:#fdf3dc; }
.admin .vn-rec-action { color:var(--admin-danger); background:var(--admin-danger-soft, #fdeaea); }
.admin .vn-status { font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-muted); border:1px solid var(--admin-border); padding:1px 8px; border-radius:9999px; }
.admin .vn-card-meta { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:6px; font-size:var(--admin-text-sm); color:var(--admin-text-secondary); }
.admin .vn-cost { font-weight:700; color:var(--admin-text); font-variant-numeric:tabular-nums; }
.admin .vn-renew { color:var(--admin-text-muted); }
.admin .vn-card-links { display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin-top:8px; font-size:var(--admin-text-sm); }
.admin .vn-card-links a { color:var(--color-primary); text-decoration:none; }
.admin .vn-card-links a:hover { text-decoration:underline; }
.admin .vn-contact { color:var(--admin-text-muted); }
.admin .vn-notes { margin:8px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-muted); line-height:1.5; }

.admin .vn-edit { margin-top:10px; border-top:1px solid var(--admin-border); padding-top:8px; }
.admin .vn-edit > summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-muted); padding:2px 0; }
.admin .vn-edit > summary::-webkit-details-marker { display:none; }
.admin .vn-edit > summary:hover { color:var(--color-primary); }
.admin .vn-del-form { margin-top:6px; }
.admin .vn-btn-del { font:inherit; font-size:var(--admin-text-xs); font-weight:700; display:inline-flex; align-items:center; gap:5px; padding:6px 10px; border-radius:8px; border:1px solid var(--admin-danger, #d33); background:transparent; color:var(--admin-danger, #d33); cursor:pointer; }
.admin .vn-btn-del:hover { background:var(--admin-danger-soft, #fdeaea); }

.admin .vn-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:36px; text-align:center; color:var(--admin-text-muted); }
`
