/* eslint-disable react/no-unescaped-entities */
/**
 * Server-side PDF renderer for the daily brief. Produces a printable
 * archive of the same content delivered in the email, so Jill can upload
 * it to Claude later for review.
 */
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { EditorialPlan } from './generateEditorialPlan'
import type { ApproveMeta } from './briefEmail'

const COLORS = {
  primary: '#6B2D8F',
  accent: '#D4AF37',
  navy: '#0d1b3e',
  text: '#1A1A1A',
  muted: '#4A4A4A',
  border: '#E6DEEE',
  softBg: '#F8F5FB',
  amber: '#92400e',
  amberBg: '#fef3c7',
  green: '#166534',
  greenBg: '#DCFCE7',
  red: '#991b1b',
  redBg: '#fee2e2',
  gray: '#6B7280',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    padding: 40,
    lineHeight: 1.4,
  },
  headerBlock: {
    backgroundColor: COLORS.navy,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  h1: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerMeta: {
    color: '#ccc',
    fontSize: 10,
  },
  sectionHeader: {
    backgroundColor: COLORS.accent,
    padding: '6 10',
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 4,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  editorialNote: {
    backgroundColor: COLORS.softBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff',
    border: `1 solid ${COLORS.border}`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  cardHeadline: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 4,
  },
  cardBody: {
    color: COLORS.muted,
    fontSize: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  chip: {
    padding: '2 6',
    borderRadius: 999,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  chipProgram: {
    backgroundColor: COLORS.softBg,
    color: COLORS.primary,
    border: `1 solid ${COLORS.border}`,
  },
  chipDeadline: {
    backgroundColor: '#f3f4f6',
    color: COLORS.muted,
  },
  chipDeadlineUrgent: {
    backgroundColor: COLORS.amberBg,
    color: COLORS.amber,
  },
  chipExpired: {
    backgroundColor: COLORS.redBg,
    color: COLORS.red,
  },
  chipNewsletter: {
    backgroundColor: COLORS.navy,
    color: '#fff',
  },
  chipFactCheck: {
    backgroundColor: '#fff8e1',
    color: '#7a5a1f',
    border: '1 solid #fde68a',
  },
  chipFactCheckWrong: {
    backgroundColor: '#fdecea',
    color: '#7a1f1f',
    border: '1 solid #f5c6cb',
  },
  rejectCard: {
    backgroundColor: '#fafafa',
    border: `1 solid ${COLORS.border}`,
    borderLeftColor: COLORS.amber,
    borderLeftWidth: 3,
    padding: 8,
    marginBottom: 6,
    borderRadius: 4,
  },
  rejectReasonTag: {
    backgroundColor: '#f3e6d3',
    color: COLORS.amber,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    padding: '1 5',
    borderRadius: 2,
    marginRight: 4,
  },
  slotCard: {
    backgroundColor: '#fff',
    border: `1 solid ${COLORS.border}`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
  },
  slotLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  blogCard: {
    backgroundColor: '#fff',
    border: `1 solid ${COLORS.border}`,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
  },
  footer: {
    marginTop: 20,
    fontSize: 8,
    color: COLORS.gray,
    textAlign: 'center',
  },
})

type ChipStyle = typeof styles.chipDeadline

function formatEndDate(endDate: string | null | undefined): { label: string; style: ChipStyle } | null {
  if (!endDate) return null
  const end = new Date(endDate)
  if (isNaN(end.getTime())) return null
  const hoursLeft = (end.getTime() - Date.now()) / (60 * 60 * 1000)
  const dateStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (hoursLeft < 0) return { label: 'EXPIRED', style: styles.chipExpired }
  if (hoursLeft <= 48) return { label: `ENDS ${dateStr.toUpperCase()}`, style: styles.chipDeadlineUrgent }
  return { label: `Ends ${dateStr}`, style: styles.chipDeadline }
}

interface BriefPdfProps {
  date: string
  findingsCount: number
  plan: EditorialPlan | null
  approveMetaByIntelId: Record<string, ApproveMeta>
  recentAlertsById: Record<string, { id: string; title: string; type: string; end_date: string | null }>
}

function BriefDocument({
  date,
  findingsCount,
  plan,
  approveMetaByIntelId,
  recentAlertsById,
}: BriefPdfProps) {
  const newsletterPickIntelIds = new Set(
    (plan?.newsletter_candidates ?? []).map((n) => n.intel_id)
  )

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>DAILY INTELLIGENCE BRIEF</Text>
          <Text style={styles.h1}>crazy4points</Text>
          <Text style={styles.headerMeta}>
            {date} · {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {plan?.editorial_note ? (
          <View style={styles.editorialNote}>
            <Text>{plan.editorial_note}</Text>
          </View>
        ) : null}

        {plan && plan.approve.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>APPROVE THESE</Text>
            {plan.approve.map((a) => {
              const meta = approveMetaByIntelId[a.intel_id] ?? {}
              const deadline = formatEndDate(meta.endDate)
              const fc = meta.factCheck
              const isNewsletterPick = newsletterPickIntelIds.has(a.intel_id)
              return (
                <View key={a.intel_id} style={styles.card} wrap={false}>
                  <Text style={styles.cardHeadline}>{a.headline}</Text>
                  {(deadline ||
                    (meta.programNames ?? []).length > 0 ||
                    isNewsletterPick ||
                    (fc && fc.openClaimCount > 0)) && (
                    <View style={styles.chipsRow}>
                      {deadline && (
                        <Text style={[styles.chip, deadline.style]}>{deadline.label}</Text>
                      )}
                      {fc && fc.openClaimCount > 0 && (
                        <Text
                          style={[
                            styles.chip,
                            fc.likelyWrongCount > 0 ? styles.chipFactCheckWrong : styles.chipFactCheck,
                          ]}
                        >
                          {fc.likelyWrongCount > 0
                            ? `${fc.likelyWrongCount} likely wrong · ${fc.openClaimCount} unverified`
                            : `${fc.openClaimCount} unverified`}
                        </Text>
                      )}
                      {isNewsletterPick && (
                        <Text style={[styles.chip, styles.chipNewsletter]}>Newsletter pick</Text>
                      )}
                      {(meta.programNames ?? []).map((name) => (
                        <Text key={name} style={[styles.chip, styles.chipProgram]}>
                          {name}
                        </Text>
                      ))}
                    </View>
                  )}
                  <Text style={styles.cardBody}>{a.why_publish}</Text>
                </View>
              )
            })}
          </>
        ) : null}

        {plan && plan.newsletter_candidates && plan.newsletter_candidates.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>NEWSLETTER CANDIDATES</Text>
            {plan.newsletter_candidates.map((n) => (
              <View
                key={n.intel_id}
                style={[styles.card, { borderLeftColor: COLORS.navy }]}
                wrap={false}
              >
                <Text style={styles.cardHeadline}>{n.headline}</Text>
                <Text style={styles.cardBody}>{n.angle}</Text>
              </View>
            ))}
          </>
        ) : null}

        {plan && plan.featured_slots.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>FEATURED DEALS RECOMMENDATIONS</Text>
            {plan.featured_slots.map((slot) => {
              const currentTitle = slot.current_alert_id
                ? recentAlertsById[slot.current_alert_id]?.title ?? '(unknown)'
                : '(empty)'
              if (slot.action === 'keep') {
                return (
                  <View key={slot.slot} style={styles.slotCard} wrap={false}>
                    <Text style={styles.slotLabel}>Slot {slot.slot} · Keep</Text>
                    <Text style={styles.cardHeadline}>{currentTitle}</Text>
                    <Text style={styles.cardBody}>{slot.reason}</Text>
                  </View>
                )
              }
              const suggestedTitle =
                recentAlertsById[slot.suggested_alert_id]?.title ?? slot.suggested_alert_id
              return (
                <View key={slot.slot} style={styles.slotCard} wrap={false}>
                  <Text style={styles.slotLabel}>Slot {slot.slot} · Replace</Text>
                  <Text style={[styles.cardBody, { textDecoration: 'line-through', marginBottom: 2 }]}>
                    {currentTitle}
                  </Text>
                  <Text style={styles.cardHeadline}>→ {suggestedTitle}</Text>
                  <Text style={styles.cardBody}>{slot.reason}</Text>
                </View>
              )
            })}
          </>
        ) : null}

        {plan && plan.blog_ideas.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>BLOG POST IDEAS</Text>
            {plan.blog_ideas.map((b, i) => (
              <View key={i} style={styles.blogCard} wrap={false}>
                <Text style={styles.cardHeadline}>{b.title}</Text>
                <Text style={styles.cardBody}>{b.pitch}</Text>
              </View>
            ))}
          </>
        ) : null}

        {plan && plan.reject.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>REJECT QUEUE</Text>
            {plan.reject.map((r) => (
              <View key={r.intel_id} style={styles.rejectCard} wrap={false}>
                <Text style={styles.cardHeadline}>{r.headline}</Text>
                <View style={styles.chipsRow}>
                  <Text style={styles.rejectReasonTag}>
                    {r.reason_category.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.cardBody}>{r.why_reject}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.footer}>
          crazy4points · Daily Scout Brief · {date}
        </Text>
      </Page>
    </Document>
  )
}

export async function renderBriefPdf(props: BriefPdfProps): Promise<Buffer> {
  return await renderToBuffer(<BriefDocument {...props} />)
}
