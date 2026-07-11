# Tasks: WordPress to Next.js Migration (Omri Meron Studio)

**Input**: Design documents from `/specs/001-wordpress-nextjs-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-api.md, contracts/routes.md, quickstart.md

**Tests**: Included (plan.md mandates Vitest + RTL: content integrity tests and component tests; they are the executable form of SC-001/002/003).

**Already in the repo (do NOT recreate)**: `content/` (types.ts, site.ts, pages.ts, galleries.ts, clients.ts, media-manifest.json), `scripts/extract_content.py`, `scripts/check_routes.sh`, `tests/fixtures/source-inventory.json`. Implementation consumes these as-is (research.md D7).

**Organization**: Tasks are grouped by user story. US1 (P1) is the MVP; US2 and US4 (P2) follow; US3 (P3) last.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 (spec.md user stories)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js project around the pre-existing `content/`, `scripts/`, `tests/` directories.

- [X] T001 Initialize Next.js 15 + TypeScript project at repo root: `package.json` (deps: next@15, react@19, react-dom@19, embla-carousel-react, embla-carousel-autoplay; devDeps: typescript, @types/react, @types/react-dom, @types/node, vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom), `tsconfig.json` (strict, path alias `@/*`), `app/globals.css` (base reset), verify `.gitignore` covers `node_modules/`, `.next/`, `*.log`, `.env*`; run `npm install`
- [X] T002 [P] Configure Vitest in `vitest.config.ts` (jsdom environment, react plugin, `@/*` alias matching tsconfig, include `tests/**/*.test.{ts,tsx}`) and `tests/setup.ts` (jest-dom matchers); add `test`, `dev`, `build`, `start` scripts to `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The content-access seam every page reads through, plus the integrity tests that prove the content layer matches the source dump. Blocks all user stories.

- [X] T003 Implement the content-access API in `lib/content.ts` per `contracts/content-api.md`: `getSiteSettings`, `getNavigation` (pageId → href, `/` for home, decoded Hebrew slug), `getPage` (by decoded slug, null for unknown), `getHomePage` (page-228), `getAllPageSlugs` (12 slugs, excludes home), `getGallery`, `getGalleryForPage` (null-safe), `getClients`; all async signatures, re-export types from `content/types.ts`; components must never import `content/` directly
- [X] T004 Content integrity tests in `tests/content.test.ts` asserting `lib/content.ts` output against `tests/fixtures/source-inventory.json`: 12 nav labels in exact source order (incl. "Jewlery"), page slot counts (home 1, packshots 24, jewlery 16, people 24, architecture 19, wine-more 22, food 19, industry 20, life-style 14, holiday-cards 15 = 174), 15 standalone galleries totaling 182 slots, 28 client names verbatim (incl. "Müller"), unique slugs, every slider page's `galleryId` resolves, out-of-scope pages (612, 660, 721) absent, our-clients has `inNavigation: false`; run `npm test` and confirm green

**Checkpoint**: Content layer proven against the source inventory. User stories can begin.

---

## Phase 3: User Story 1 - Visitor browses the portfolio by category (Priority: P1) 🎯 MVP

**Goal**: Header with text logo + 12 tabs in source order; every portfolio tab renders a fullscreen looping slider with the correct placeholder slot count.

**Independent Test**: Open `/`, verify all 12 tabs in source order, click each portfolio tab, confirm a working slider with the source slot count (quickstart scenarios 1-2).

### Implementation for User Story 1

- [X] T005 [P] [US1] Create `components/PlaceholderImage.tsx`: neutral CSS-only placeholder block for an `ImageSlot` (no binary assets), labeled with slot position, `data-source-ref` attribute carrying `sourceRef`, aspect ratio from slot `width`/`height` when present
- [X] T006 [P] [US1] Create `components/SiteHeader.tsx`: text logo "Omri Meron" (from `getSiteSettings`) linking to `/`, all nav tabs from `getNavigation()` in order, mobile menu toggle (hamburger) usable on small viewports, "Our Clients" absent
- [X] T007 [US1] Create `components/FullscreenSlider.tsx`: client component using `embla-carousel-react` with `loop: true` and `embla-carousel-autoplay`, one slide per `ImageSlot` rendering `PlaceholderImage` (depends on T005), prev/next controls, empty-state placeholder when `slots` is empty (never a broken slider)
- [X] T008 [US1] Create `app/layout.tsx`: root layout importing `app/globals.css`, rendering `SiteHeader` on every page, `<html lang="en">`, metadata title/description from `getSiteSettings` (depends on T006)
- [X] T009 [US1] Create `app/page.tsx`: home route rendering `FullscreenSlider` for `getHomePage()` + `getGalleryForPage()` (depends on T007)
- [X] T010 [US1] Create `app/[slug]/page.tsx`: `generateStaticParams` from `getAllPageSlugs()`, `decodeURIComponent` the param before `getPage` lookup (Hebrew Industry slug must resolve encoded and decoded), render `layout: 'slider'` pages via `FullscreenSlider`, unknown slug → `notFound()`; other layouts fall through to `notFound()` until US2/US3 wire them (depends on T007)
- [X] T011 [US1] Create `next.config.ts`: permanent redirect `/home` → `/` per `contracts/routes.md` (trailing-slash variants handled by Next.js defaults)
- [X] T012 [P] [US1] Component test `tests/components/SiteHeader.test.tsx`: renders text logo, all 12 tab labels in source order, no "Our Clients" link, mobile menu toggle works
- [X] T013 [P] [US1] Component test `tests/components/FullscreenSlider.test.tsx`: renders one slide per slot with `data-source-ref`, renders empty-state when given zero slots

**Checkpoint**: `npm run dev` → all 12 tabs navigate, 10 slider pages show correct slot counts, US1 fully functional.

---

## Phase 4: User Story 2 - Visitor reads about the studio and gets in touch (Priority: P2)

**Goal**: About page shows the full studio bio; Contact page shows address, phone, mailto link, and embedded map.

**Independent Test**: Open `/about-the-studio` and `/contact` directly and verify content against the source (quickstart scenario 3).

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `components/ProseBlock.tsx`: renders a `Page.body` plain-text string as paragraphs (About bio)
- [X] T015 [P] [US2] Create `components/ContactBlock.tsx`: renders address, phone, clickable `mailto:` link (meronok@gmail.com as both text and target, per research.md), and map embed iframe from `SiteSettings.contact`
- [X] T016 [US2] Wire `layout: 'text'` → `ProseBlock` and `layout: 'contact'` → `ContactBlock` in `app/[slug]/page.tsx` (depends on T010, T014, T015)

**Checkpoint**: About and Contact render full source content; US1 unaffected.

---

## Phase 5: User Story 4 - Content is structured for a future CMS (Priority: P2)

**Goal**: Prove the content seam: content edits propagate without touching presentation components.

**Independent Test**: Rename one nav tab in `content/site.ts`, confirm the header changes with zero `components/`/`app/` edits (quickstart scenario 5).

### Implementation for User Story 4

- [X] T017 [US4] Verify the CMS seam: grep that no file under `app/` or `components/` imports from `content/` (only `lib/content.ts` does); perform quickstart scenario 5 (rename "Food" → "Food!" in `content/site.ts`, confirm header updates and `git diff --stat` shows only the content file, revert); record result

**Checkpoint**: SC-007 demonstrated.

---

## Phase 6: User Story 3 - Visitor views the client list (Priority: P3)

**Goal**: `/our-clients` shows all 28 client names as a grid with placeholder logo slots, reachable by URL but not in navigation.

**Independent Test**: Open `/our-clients` directly, compare the 28 names against the source (quickstart scenario 3).

### Implementation for User Story 3

- [X] T018 [P] [US3] Create `components/ClientGrid.tsx`: grid of `Client` entries in source order, each showing the name and a `PlaceholderImage` logo slot
- [X] T019 [US3] Wire `layout: 'clientGrid'` → `ClientGrid` (fed by `getClients()`) in `app/[slug]/page.tsx` (depends on T010, T018)

**Checkpoint**: All four user stories functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 [P] Create `app/not-found.tsx`: 404 page that keeps the site header visible so navigation stays usable (contracts/routes.md non-routes)
- [X] T021 Production build validation: `npm run build` succeeds and prerenders all 13 routes statically (FR-011); `npm test` green
- [X] T022 Route validation: with `npm run start` running, run `scripts/check_routes.sh` and fix any failures (all 13 canonical routes 200, `/home` 308 → `/`, trailing-slash variants resolve, encoded Hebrew slug resolves, 3 out-of-scope drafts 404) (FR-008, SC-004; depends on T021)
- [X] T023 Quickstart validation sweep: scenario 6 (`find` for image binaries prints nothing, SC-006) and scenario 7 (mobile viewport: menu opens, every category one click from `/`, slider swipes) (FR-009, SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; BLOCKS all user stories
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after US1 T010 exists (extends `app/[slug]/page.tsx`); components T014/T015 only need Foundational
- **US4 (Phase 5)**: after any page renders (verification task); best after US1
- **US3 (Phase 6)**: after US1 T010 exists (extends `app/[slug]/page.tsx`)
- **Polish (Phase 7)**: after all desired stories

### Key file-conflict note

`app/[slug]/page.tsx` is touched by T010 (US1), T016 (US2), T019 (US3): these must run sequentially.

### Parallel Opportunities

- T002 alongside the tail of T001
- T005, T006 together; then T012, T013 together
- T014, T015 together
- T018 alongside US2 tasks (different files)
- T020 alongside T021

---

## Implementation Strategy

**MVP first**: Phases 1-3 (T001-T013) deliver the viable replacement site: navigation + all portfolio sliders. Stop, validate quickstart scenarios 1-2, then add US2 → US4 → US3 incrementally, finishing with the Polish validations.
