import {ImagesIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

// One gallery per portfolio category (same _id scheme as the local content
// layer: gallery-page-<wpPageId>), pinned in the Studio structure. The
// images array is the slider, in display order; drag multiple files onto it
// to bulk-upload.
export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'URL path of the category page (matches the site route)',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      description:
        'Slider images in display order. Drag multiple files here at once to bulk-upload; drag items to reorder.',
      of: [
        defineArrayMember({
          type: 'image',
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
      options: {layout: 'grid'},
    }),
  ],
  preview: {
    select: {title: 'title', media: 'images.0'},
  },
})
