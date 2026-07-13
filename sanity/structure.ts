import {ImagesIcon, UserIcon} from '@sanity/icons'
import type {StructureResolver} from 'sanity/structure'

// Category galleries pinned by fixed _id (same scheme as the local content
// layer, gallery-page-<wpPageId>), in the site's navigation order. Each entry
// opens the category's gallery document directly for bulk image upload.
// No Home entry: the home slider draws randomly from these categories
// (owner decision 2026-07-13), so there is nothing to manage for it.
const CATEGORY_GALLERIES = [
  {id: 'gallery-page-578', title: 'Products & Pack-shots'},
  {id: 'gallery-page-291', title: 'Jewlery'},
  {id: 'gallery-page-316', title: 'People'},
  {id: 'gallery-page-246', title: 'Architecture & Interior'},
  {id: 'gallery-page-452', title: 'Wine & More'},
  {id: 'gallery-page-259', title: 'Food'},
  {id: 'gallery-page-277', title: 'Industry'},
  {id: 'gallery-page-303', title: 'Life style'},
  {id: 'gallery-page-415', title: 'Holiday Cards'},
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Portfolio Categories')
        .icon(ImagesIcon)
        .child(
          S.list()
            .title('Portfolio Categories')
            .items(
              CATEGORY_GALLERIES.map(({id, title}) =>
                S.listItem()
                  .title(title)
                  .icon(ImagesIcon)
                  .child(S.document().schemaType('gallery').documentId(id).title(title)),
              ),
            ),
        ),
      // About page singleton, pinned by fixed _id (lib/content.ts fetches it
      // by this id for the photo above the About text)
      S.listItem()
        .title('About Page')
        .icon(UserIcon)
        .child(S.document().schemaType('aboutPage').documentId('about-page').title('About Page')),
      S.divider(),
      // Any future document types show up here automatically; gallery and
      // aboutPage are excluded because the pinned items above cover them.
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== 'gallery' && item.getId() !== 'aboutPage',
      ),
    ])
