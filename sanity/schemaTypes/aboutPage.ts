import {UserIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

// Singleton for the About page (pinned by fixed _id "about-page" in
// structure.ts): holds the photo shown centered above the About text.
// The text itself still comes from the local content layer.
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      description: 'Shown centered above the About text. Leave empty to show text only.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {media: 'image'},
    prepare: ({media}) => ({title: 'About Page', media}),
  },
})
