import {ImagesIcon} from '@sanity/icons'
import type {StructureResolver} from 'sanity/structure'

// Category galleries pinned by fixed _id (same scheme as the local content
// layer, gallery-page-<wpPageId>), in the site's navigation order. Each entry
// opens the category's gallery document directly for bulk image upload.
const CATEGORY_GALLERIES = [
  {id: 'gallery-page-228', title: 'Home'},
  {id: 'gallery-page-578', title: 'Products & Pack-shots'},
  {id: 'gallery-page-291', title: 'Jewlery'},
  {id: 'gallery-page-316', title: 'People'},
  {id: 'gallery-page-246', title: 'Architecture + Interior'},
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
      S.divider(),
      // Any future document types show up here automatically; gallery is
      // excluded because the pinned category list above covers it.
      ...S.documentTypeListItems().filter((item) => item.getId() !== 'gallery'),
    ])
