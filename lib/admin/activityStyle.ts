import type { IconName } from '@/components/admin/preview/icons'

// The activity chain ("what each teammate shipped") — shared presenter so the
// per-employee feed (/admin/org/[slug]) and the dashboard timeline (/admin) read
// as ONE system: a calm, consistent color + small icon per verb. Admin tokens
// only (theme-safe). Unknown verbs fall back to a neutral badge.
export type ActivityRow = {
  id: string
  employee_slug: string
  action: string
  summary: string
  ref_type: string | null
  ref_id: string | null
  link: string | null
  created_at: string
}

export type ActivityStyle = { label: string; icon: IconName; fg: string; bg: string; border: string }

const NEUTRAL: ActivityStyle = {
  label: 'did',
  icon: 'check',
  fg: 'var(--admin-text-muted)',
  bg: 'var(--admin-surface-alt)',
  border: 'var(--admin-border)',
}

// One calm hue per verb. published/shipped = the release moment (accent/gold);
// verified = the green check; reviewed = a shield pass; posted = outbound;
// drafted = authoring (primary); fixed = a repair (warning).
const STYLES: Record<string, ActivityStyle> = {
  published: { label: 'published', icon: 'send', fg: 'color-mix(in srgb, var(--color-accent) 52%, var(--admin-text))', bg: 'color-mix(in srgb, var(--color-accent) 16%, var(--admin-surface))', border: 'color-mix(in srgb, var(--color-accent) 42%, var(--admin-border))' },
  shipped: { label: 'shipped', icon: 'spark', fg: 'color-mix(in srgb, var(--color-accent) 52%, var(--admin-text))', bg: 'color-mix(in srgb, var(--color-accent) 16%, var(--admin-surface))', border: 'color-mix(in srgb, var(--color-accent) 42%, var(--admin-border))' },
  verified: { label: 'verified', icon: 'check', fg: 'var(--admin-success)', bg: 'var(--admin-success-soft)', border: 'color-mix(in srgb, var(--admin-success) 30%, var(--admin-border))' },
  reviewed: { label: 'reviewed', icon: 'shield', fg: 'var(--admin-success)', bg: 'var(--admin-success-soft)', border: 'color-mix(in srgb, var(--admin-success) 30%, var(--admin-border))' },
  posted: { label: 'posted', icon: 'megaphone', fg: 'var(--admin-info)', bg: 'var(--admin-info-soft)', border: 'color-mix(in srgb, var(--admin-info) 30%, var(--admin-border))' },
  drafted: { label: 'drafted', icon: 'pencil', fg: 'var(--color-primary)', bg: 'color-mix(in srgb, var(--color-primary) 8%, var(--admin-surface))', border: 'color-mix(in srgb, var(--color-primary) 20%, var(--admin-border))' },
  fixed: { label: 'fixed', icon: 'bolt', fg: 'var(--admin-warning)', bg: 'var(--admin-warning-soft)', border: 'color-mix(in srgb, var(--admin-warning) 30%, var(--admin-border))' },
}

export function activityStyle(action: string): ActivityStyle {
  return STYLES[action] ?? { ...NEUTRAL, label: action }
}
