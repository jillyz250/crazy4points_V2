import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'continent',
      title: 'Continent / Region',
      type: 'string',
      options: {
        list: [
          { title: 'Caribbean',       value: 'caribbean' },
          { title: 'North America',   value: 'north_america' },
          { title: 'Central America', value: 'central_america' },
          { title: 'South America',   value: 'south_america' },
          { title: 'Europe',          value: 'europe' },
          { title: 'Asia',            value: 'asia' },
          { title: 'Middle East',     value: 'middle_east' },
          { title: 'Africa',          value: 'africa' },
          { title: 'South Pacific',   value: 'south_pacific' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
    }),
    defineField({
      name: 'region',
      title: 'Region / Area',
      type: 'string',
    }),
    defineField({
      name: 'vibe',
      title: 'Vibe',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Beach',     value: 'beach' },
          { title: 'City',      value: 'city' },
          { title: 'History',   value: 'history' },
          { title: 'Nature',    value: 'nature' },
          { title: 'Adventure', value: 'adventure' },
          { title: 'Luxury',    value: 'luxury' },
          { title: 'Family',    value: 'family' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'weatherByMonth',
      title: 'Weather by Month',
      type: 'object',
      fields: [
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
      ].map((m) => ({
        name: m,
        title: m.charAt(0).toUpperCase() + m.slice(1),
        type: 'string',
        options: {
          list: [
            { title: 'Great', value: 'great' },
            { title: 'Good',  value: 'good'  },
            { title: 'Mixed', value: 'mixed' },
            { title: 'Poor',  value: 'poor'  },
          ],
          layout: 'radio',
        },
      })),
    }),
    defineField({
      name: 'tripLength',
      title: 'Ideal Trip Length',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Short (2–4 days)',  value: 'short' },
          { title: 'Medium (5–7 days)', value: 'medium' },
          { title: 'Long (8+ days)',    value: 'long' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'whoIsGoing',
      title: 'Who Is Going',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Solo',   value: 'solo' },
          { title: 'Couple', value: 'couple' },
          { title: 'Family', value: 'family' },
          { title: 'Group',  value: 'group' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'continent' },
  },
})
