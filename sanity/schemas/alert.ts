// Sanity schema for the Alerts content type
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'alert',
  title: 'Alert',
  type: 'document',

  groups: [
    { name: 'core', title: 'Core' },
    { name: 'dates', title: 'Dates' },
    { name: 'scoring', title: 'Scoring' },
    { name: 'workflow', title: 'Workflow' },
  ],

  fields: [
    // ── Core ──────────────────────────────────────────────────────────────────

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'core',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'core',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      group: 'core',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'core',
      of: [{ type: 'block' }],
    }),

    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      group: 'core',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          // Time-Sensitive
          { title: '[Time-Sensitive] Transfer Bonus', value: 'transfer_bonus' },
          { title: '[Time-Sensitive] Limited Time Offer', value: 'limited_time_offer' },
          { title: '[Time-Sensitive] Award Availability', value: 'award_availability' },
          { title: '[Time-Sensitive] Status Promo', value: 'status_promo' },
          { title: '[Time-Sensitive] Glitch', value: 'glitch' },
          // Structural
          { title: '[Structural] Devaluation', value: 'devaluation' },
          { title: '[Structural] Program Change', value: 'program_change' },
          { title: '[Structural] Partner Change', value: 'partner_change' },
          { title: '[Structural] Category Change', value: 'category_change' },
          { title: '[Structural] Earn Rate Change', value: 'earn_rate_change' },
          { title: '[Structural] Status Change', value: 'status_change' },
          { title: '[Structural] Policy Change', value: 'policy_change' },
          // Evergreen
          { title: '[Evergreen] Sweet Spot', value: 'sweet_spot' },
          { title: '[Evergreen] Industry News', value: 'industry_news' },
        ],
      },
    }),

    defineField({
      name: 'programs',
      title: 'Programs',
      type: 'array',
      group: 'core',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
      options: {
        list: [
          { title: 'Chase Ultimate Rewards', value: 'chase' },
          { title: 'Amex Membership Rewards', value: 'amex' },
          { title: 'Citi ThankYou', value: 'citi' },
          { title: 'Capital One Venture', value: 'capital_one' },
          { title: 'World of Hyatt', value: 'hyatt' },
          { title: 'Marriott Bonvoy', value: 'marriott' },
          { title: 'Hilton Honors', value: 'hilton' },
          { title: 'IHG One Rewards', value: 'ihg' },
          { title: 'United MileagePlus', value: 'united' },
          { title: 'Delta SkyMiles', value: 'delta' },
          { title: 'American AAdvantage', value: 'aa' },
          { title: 'Southwest Rapid Rewards', value: 'southwest' },
          { title: 'Air France/KLM Flying Blue', value: 'flying_blue' },
        ],
      },
    }),

    defineField({
      name: 'relatedAlerts',
      title: 'Related Alerts',
      type: 'array',
      group: 'core',
      of: [{ type: 'reference', to: [{ type: 'alert' }] }],
    }),

    defineField({
      name: 'actionType',
      title: 'Action Type',
      type: 'string',
      group: 'core',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Book', value: 'book' },
          { title: 'Transfer', value: 'transfer' },
          { title: 'Apply', value: 'apply' },
          { title: 'Monitor', value: 'monitor' },
          { title: 'Learn', value: 'learn' },
        ],
      },
    }),

    // ── Dates ─────────────────────────────────────────────────────────────────

    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      group: 'dates',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'date',
      group: 'dates',
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'dates',
      validation: (Rule) => Rule.required(),
    }),

    // ── Scoring ───────────────────────────────────────────────────────────────

    defineField({
      name: 'impactScore',
      title: 'Impact Score',
      type: 'number',
      group: 'scoring',
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),

    defineField({
      name: 'impactJustification',
      title: 'Impact Justification',
      type: 'string',
      group: 'scoring',
      description: '1 sentence explaining impact score',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'valueScore',
      title: 'Value Score',
      type: 'number',
      group: 'scoring',
      validation: (Rule) => Rule.required().min(1).max(5).integer(),
    }),

    defineField({
      name: 'rarityScore',
      title: 'Rarity Score',
      type: 'number',
      group: 'scoring',
      validation: (Rule) => Rule.min(1).max(5).integer(),
    }),

    defineField({
      name: 'confidenceLevel',
      title: 'Confidence Level',
      type: 'string',
      group: 'scoring',
      initialValue: 'high',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Low', value: 'low' },
          { title: 'Medium', value: 'medium' },
          { title: 'High', value: 'high' },
        ],
      },
    }),

    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'scoring',
    }),

    // ── Workflow ──────────────────────────────────────────────────────────────

    defineField({
      name: 'isApproved',
      title: 'Is Approved',
      type: 'boolean',
      group: 'workflow',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'approvedAt',
      title: 'Approved At',
      type: 'datetime',
      group: 'workflow',
      readOnly: true,
    }),

    defineField({
      name: 'rejectedReason',
      title: 'Rejected Reason',
      type: 'string',
      group: 'workflow',
      description: 'Required if rejected (1–2 sentences)',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
      isApproved: 'isApproved',
    },
    prepare({ title, subtitle, isApproved }: { title: string; subtitle: string; isApproved: boolean }) {
      return {
        title,
        subtitle,
        media: isApproved
          ? ({ renderDefault }: { renderDefault: (props: unknown) => unknown }) => renderDefault({ icon: '✅' })
          : undefined,
      }
    },
  },
})

// FUTURE PHASE — Card Benefits Tracker
// Card-specific benefits (Chase Sapphire Reserve, Amex Platinum, etc.)
// belong in a separate `card` schema, not in alerts.
// Do not add card-level fields to this schema.
// See: crazy4points-alerts-system-spec.md — Future Phase section
