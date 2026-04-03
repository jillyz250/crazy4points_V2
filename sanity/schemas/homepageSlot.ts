// Sanity schema for homepage alert slots (max 4)
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'homepageSlot',
  title: 'Homepage Slot',
  type: 'document',

  fields: [
    defineField({
      name: 'slotNumber',
      title: 'Slot Number',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(4).integer(),
    }),

    defineField({
      name: 'alert',
      title: 'Alert',
      type: 'reference',
      to: [{ type: 'alert' }],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'isPinned',
      title: 'Is Pinned',
      type: 'boolean',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'pinnedAt',
      title: 'Pinned At',
      type: 'datetime',
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      slotNumber: 'slotNumber',
      alertTitle: 'alert.title',
    },
    prepare({ slotNumber, alertTitle }: { slotNumber: number; alertTitle: string }) {
      return {
        title: `Slot ${slotNumber}`,
        subtitle: alertTitle,
      }
    },
  },
})
