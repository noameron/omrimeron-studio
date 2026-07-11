# Phase 0 Research: WordPress to Next.js Migration (Omri Meron Studio)

**Date**: 2026-07-11 | **Plan**: [plan.md](./plan.md)

No NEEDS CLARIFICATION markers remained in the Technical Context; this document records the source-site analysis that grounds the design and the technology decisions with their rationale.

## Source Site Analysis (from `omrimero_omrimeron.sql`)

Facts below were extracted programmatically from the WordPress database dump (theme: `skylab`, permalink structure `/%postname%/`, site URL `http://www.omrimeron.com`).

### How the source stores content

- **Pages**: `wp_posts` rows with `post_type='page'`. 16 published pages exist; 13 are in scope (12 navigation targets + Our Clients). Out of scope: `home-page-with-video` (612), `new-home-page` (660), `photography-of-art-works` (721).
- **Page galleries**: the skylab theme stores each slider page's image list in the `_page_image_gallery` postmeta key as a comma-separated, ordered list of attachment IDs. This ordered ID list is the authoritative slide order and count.
- **Standalone galleries**: `post_type='gallery'` rows (15 published) with the image list in `_gallery_post_type_image_gallery` postmeta and the display mode in `mega_gallery_type` (`Slider`, `FancyBox Gallery`, or `Image Gallery`).
- **Navigation**: 12 `nav_menu_item` posts, `menu_order` 1-12, each pointing at a page via `_menu_item_object_id` postmeta.
- **Clients**: hard-coded HTML `<table>` in the Our Clients page (355) body; 28 client names in `client-title` divs, each paired with a logo `<img>`.
- **Identity**: `blogname='Omri Meron'`, `blogdescription='Photograper'` (source typo, corrected to "Photographer" per spec assumption). `page_on_front=330` (About the studio), but the menu's first tab is Home; per spec assumption the menu is authoritative and `/` serves the Home slider page.

### Verified inventory (validation targets)

Slider pages and slot counts (sum = 174):

| Page | Slug | Slots |
|---|---|---|
| Home | `home` (served at `/`) | 1 |
| Products & Pack-shots | `packshots` | 24 |
| Jewlery | `jewlery` | 16 |
| People | `people` | 24 |
| Architecture + Interior | `architecture` | 19 |
| Wine & More | `wine-more` | 22 |
| Food | `food` | 19 |
| Industry | `צילום-תעשיה-עמרי-מירון` (URL-encoded in source) | 20 |
| Life style | `life-style` | 14 |
| Holiday Cards | `holiday-cards` | 15 |

Standalone galleries and slot counts (sum = 182): discreet 14, expose 9, mona 15, my lady 17, pierre carden 7, us polo 11, CHEROKEE 9, DITI 6, EMANUEL 11, SAGAEI 9, my lady 2 10, mona 2 7, B&H 34 (FancyBox Gallery), RONA 15, Holydays Cards 8 (Image Gallery); all others are Slider mode.

### Source discrepancy to flag to the owner

The Contact page's visible email text differed from its `mailto:` href target (`meronok@gmail.com`). **Resolved by the owner (2026-07-11)**: use `meronok@gmail.com` everywhere; the migrated site shows it as both the link text and the `mailto:` target, and the old visible address is not carried over.

## Decisions

### D1: Next.js 15 App Router with full static generation

- **Decision**: Next.js 15, App Router, `generateStaticParams` for the `[slug]` route; every route prerendered at build time. Keep the default Node server output (not `output: 'export'`) so `next.config.ts` redirects work on Vercel later.
- **Rationale**: The site is pure content with zero server logic; static generation gives trivial hosting, best performance (SC: Lighthouse ≥ 90), and is Vercel's happy path. App Router is the current default and what Sanity's official Next.js tooling targets.
- **Alternatives considered**: Pages Router (legacy, no reason for a greenfield); `output: 'export'` (loses framework-level redirects needed for FR-008; can be revisited if a non-Vercel static host is chosen); Astro/Gatsby (different stack than the stated Next.js + React requirement).

### D2: Embla Carousel for the fullscreen slider

- **Decision**: `embla-carousel-react` with its loop option for the wrap-around behavior (spec US1 scenario 3), autoplay via `embla-carousel-autoplay` (source pages set `mega_slider_autoplay='yes'`).
- **Rationale**: Small (~7 kB), headless (we own the fullscreen styling), actively maintained, first-class React 19 support. The slider is the one piece of nontrivial interaction; everything else is static markup.
- **Alternatives considered**: Swiper (larger, ships its own styling system); keen-slider (fine, smaller community); hand-rolled scroll-snap (free, but looped autoplay slider with correct touch behavior is exactly the wheel not worth reinventing).

### D3: Typed local content modules shaped as Sanity documents

- **Decision**: Content lives in plain TypeScript objects under `content/`, typed by interfaces that mirror the future Sanity schemas (`_type`, `_id`-style references between page and gallery, portable-text-ready body fields kept as plain strings for now). All page code reads content only through `lib/content.ts`.
- **Rationale**: FR-007/SC-007 require content edits without component edits and a CMS swap without page rework. Typed TS objects give compile-time integrity (a deleted gallery reference fails the build), zero runtime dependencies, and a mechanical mapping to Sanity documents later: only `lib/content.ts` changes from returning local objects to fetching via the Sanity client.
- **Alternatives considered**: JSON files (no types, no cross-reference checking); MDX/Markdown (adds a pipeline for content that is 90% structured data, not prose); installing the Sanity SDK now against a local dataset (violates YAGNI and the spec's explicit deferral of CMS setup).

### D4: Placeholder image strategy

- **Decision**: `PlaceholderImage` renders a neutral CSS-only block (no binary assets) labeled with the slot's position; each `ImageSlot` carries `sourceRef` (the WP attachment ID, e.g. `wp-attachment-589`) so real media can be attached later without re-deriving the mapping. Empty galleries render an explicit empty state (spec edge case).
- **Rationale**: SC-006 requires zero source image binaries; keeping the attachment ID preserves the only durable link back to the source media library.
- **Alternatives considered**: generated SVG data URIs per slot (more code, no benefit); external placeholder services (network dependency, violates "no image binaries" spirit at runtime).

### D5: Old-URL compatibility via `next.config.ts` redirects + slug preservation

- **Decision**: In-scope pages keep their exact source slugs (including the Hebrew Industry slug, decoded form `צילום-תעשיה-עמרי-מירון`, which Next.js route params handle after decoding). FR-008 is then satisfied mostly by identity; explicit redirects cover `/home/` → `/` and trailing-slash variants (Next.js normalizes trailing slashes by default).
- **Rationale**: Preserving slugs is less machinery than a redirect table for every page and keeps existing search results pointing at 200s, not 308s.
- **Alternatives considered**: ASCII slug `industry` plus a redirect from the Hebrew path (friendlier slug, but adds a redirect and diverges from the source URL space for no user-visible gain now; can be done later in the CMS).

### D6: Vitest + React Testing Library

- **Decision**: Vitest with jsdom + RTL. Content integrity tests assert the extracted inventory (12 nav items in source order, slot counts per the table above, 28 clients, slug uniqueness, gallery references resolve). Component tests cover SiteHeader (nav rendering, mobile menu) and FullscreenSlider (slot rendering, empty state).
- **Rationale**: Vitest is the current default for Vite-era React testing, fast, and TS-native. The content tests are the executable form of SC-001/002/003.
- **Alternatives considered**: Jest (slower, more config for ESM/TS); Playwright e2e now (deferred; quickstart.md documents manual end-to-end validation, e2e tooling can come with CI later).

### D7: Content layer is generated by script, not hand-written

- **Decision**: `scripts/extract_content.py` parses the SQL dump and generates all of `content/` (types + the 4 document files), `tests/fixtures/source-inventory.json` (frozen expected values the integrity tests assert against), and `content/media-manifest.json` (attachment id → original file path, dimensions, mime; the input for future Sanity media re-attachment). The script self-verifies with asserts (12 nav items, 174 page slots, 182 standalone slots, 28 clients) and has already been run; its outputs are committed. `scripts/check_routes.sh` packages the FR-008/SC-004 curl checks as one command.
- **Rationale**: 356 image slots and 28 names transcribed by hand (or by a model) invite silent transposition errors that count-based tests cannot catch; generation makes the content layer provably derived from the source. It also removes the largest block of mechanical work from implementation.
- **Alternatives considered**: hand-transcription from the planning docs (error-prone, slow); making the extractor a build step (unnecessary: the source dump is frozen, one run suffices; script kept only as audit trail and for regeneration if a newer dump appears).
- **Known data note**: 157 attachment IDs referenced by the 15 standalone galleries have no attachment row in the dump (stale references in the source site itself, all IDs ≤ 214). Slots are still captured with their `sourceRef`; the manifest marks which attachments are live. All 174 slots on routed pages resolve to live attachments with dimensions.
