# Data Model: WordPress to Next.js Migration (Omri Meron Studio)

**Date**: 2026-07-11 | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

All entities are TypeScript interfaces defined in `content/types.ts` (re-exported by `lib/content.ts`) and instantiated as plain objects under `content/`. Both the interfaces and the instances are **generated from the WordPress dump by `scripts/extract_content.py`** and already exist in the repo (research.md D7); implementation consumes them as-is. Shapes deliberately mirror future Sanity documents: each document has `_type` and a stable string `_id`; cross-references are by `_id`. Field names avoid WordPress-isms so no rename is needed at CMS time.

## Entities

### SiteSettings (`content/site.ts`, singleton)

| Field | Type | Notes / source |
|---|---|---|
| `_type` | `'siteSettings'` | |
| `title` | `string` | "Omri Meron" (`blogname`) |
| `tagline` | `string` | "Photographer" (source typo "Photograper" corrected per spec assumption) |
| `contact.address` | `string` | "Rabenu Khanan'el St 29, Tel Aviv-Yafo" |
| `contact.phone` | `string` | "972 54 2999-663" |
| `contact.email` | `string` | "meronok@gmail.com" (owner decision, 2026-07-11: used as both link text and `mailto:` target; the source page's visible text showed a different address, see research.md) |
| `contact.mapEmbedUrl` | `string` | Google Maps embed URL from source Contact page |
| `navigation` | `NavigationItem[]` | exactly 12, in `menu_order` |

**Validation**: `navigation.length === 12`; labels and order must match the source list verbatim (SC-001), including "Jewlery".

### NavigationItem (embedded in SiteSettings)

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | exact source wording |
| `pageId` | `string` | `_id` of the target Page |

Order is array order (source `menu_order` 1-12).

### Page (`content/pages.ts`, 13 documents)

| Field | Type | Notes |
|---|---|---|
| `_type` | `'page'` | |
| `_id` | `string` | `page-<wpId>`, e.g. `page-228` |
| `title` | `string` | source `post_title` |
| `slug` | `string` | source `post_name`, decoded (Industry slug stored as the Hebrew string `צילום-תעשיה-עמרי-מירון`) |
| `layout` | `'slider' \| 'text' \| 'contact' \| 'clientGrid'` | from source page template: `page-slider.php` → slider; About → text; Contact → contact; Our Clients → clientGrid |
| `galleryId` | `string \| undefined` | slider pages only; references a Gallery `_id` |
| `body` | `string \| undefined` | About page bio text (plain text paragraphs for now, portable text later) |
| `inNavigation` | `boolean` | false only for Our Clients (FR-006) |

**Validation**: slugs unique; every `layout: 'slider'` page has a resolvable `galleryId`; the 3 out-of-scope source pages (612, 660, 721) must not exist here (FR-010 / spec edge case).

**Instances** (id, slug, layout): page-228 `home` slider; page-330 `about-the-studio` text; page-578 `packshots` slider; page-291 `jewlery` slider; page-316 `people` slider; page-246 `architecture` slider; page-452 `wine-more` slider; page-259 `food` slider; page-277 (Hebrew slug) slider; page-303 `life-style` slider; page-415 `holiday-cards` slider; page-332 `contact` contact; page-355 `our-clients` clientGrid (not in nav).

### Gallery (`content/galleries.ts`, 25 documents: 10 page galleries + 15 standalone)

| Field | Type | Notes |
|---|---|---|
| `_type` | `'gallery'` | |
| `_id` | `string` | page galleries: `gallery-page-<wpPageId>`; standalone: `gallery-<wpGalleryId>` |
| `name` | `string` | page galleries: page title; standalone: source gallery title (e.g. "B&H", "RONA") |
| `displayMode` | `'slider' \| 'fancybox' \| 'grid'` | from `mega_gallery_type`; page galleries are all `slider` |
| `standalone` | `boolean` | true for the 15 gallery post-type collections (captured per FR-010, not routed) |
| `slots` | `ImageSlot[]` | ordered, from the source comma-separated attachment ID list |

**Validation**: slot counts must equal the source counts (SC-002). Page galleries: home 1, packshots 24, jewlery 16, people 24, architecture 19, wine-more 22, food 19, industry 20, life-style 14, holiday-cards 15 (total 174). Standalone (total 182): discreet 14, expose 9, mona 15, my-lady 17, pierre-carden 7, us-polo 11, cherokee 9, diti 6, emanuel 11, sagaei 9, my-lady-2 10, mona-2 7, bh 34 (fancybox), rona 15, holydays-cards 8 (grid).

### ImageSlot (embedded in Gallery)

| Field | Type | Notes |
|---|---|---|
| `position` | `number` | 0-based index in gallery order |
| `sourceRef` | `string` | `wp-attachment-<id>`, the source attachment ID; the durable link for attaching real media later (FR-003) |
| `alt` | `string` | placeholder alt text (gallery name + position) |
| `width`, `height` | `number?` | source image dimensions from WP attachment metadata, where the attachment still exists; lets placeholders keep the real aspect ratio |

No binary data anywhere (SC-006). Attachment IDs may repeat across galleries (source reuses images, e.g. 589 in both home and packshots); `sourceRef` is unique within a gallery, not globally.

### Client (`content/clients.ts`, 28 documents)

| Field | Type | Notes |
|---|---|---|
| `_type` | `'client'` | |
| `_id` | `string` | `client-<kebab-name>` |
| `name` | `string` | exact source spelling incl. "Müller" |
| `order` | `number` | source table order |
| `logoSlot` | `ImageSlot` | placeholder (FR-006) |

**Instances (source order)**: Osem, Strauss, Elite, Müller, Tara, Albar Car Rentals, Mitrani, Prima Hotels, Rimonim Hotels, Hamashbir Latsarhan, Finssoy, Darlain, Hamat, Max Brenner, NirLat, Plasson, Ramot, Shilav, Tzabar Salads, Tally Professional Makeup, Tzora Winery, Bravdo Winery, Design Factory, Dr. Gav, Stern Engineering, Sanitec, Yookidoo, Golan.

**Validation**: 28 entries, names verbatim from source including special characters (SC-003).

## Relationships

```text
SiteSettings 1──12 NavigationItem ──→ Page (by pageId)
Page (layout=slider) ──→ Gallery (by galleryId, 1:1)
Gallery 1──* ImageSlot (ordered)
Client * (independent list, rendered by the Our Clients page)
```

## State transitions

None. All content is static; the only lifecycle event is the future swap of the data source behind `lib/content.ts` (see [contracts/content-api.md](./contracts/content-api.md)).
