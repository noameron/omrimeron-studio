# Quickstart & Validation Guide

**Date**: 2026-07-11 | **Plan**: [plan.md](./plan.md) | **Contracts**: [contracts/](./contracts/)

## Prerequisites

- Node.js 20+ and npm
- No database, no CMS account, no image assets: everything the site needs is in the repo.

## Setup & run

```bash
npm install
npm run dev        # http://localhost:3000
```

The `content/` files are pre-generated from the WordPress dump and committed; nothing to run. To regenerate (e.g. from a newer dump): `python3 scripts/extract_content.py [path-to-dump.sql]` (self-verifying, see research.md D7).

Production build (also the deployability check, FR-011):

```bash
npm run build      # must prerender all 13 routes statically
npm run start
```

Automated tests:

```bash
npm test           # Vitest: content integrity + component tests
```

## Validation scenarios

### 1. Navigation fidelity (US1, SC-001)

Open `/`. The header shows "Omri Meron" as a text logo and exactly these 12 tabs in order: Home, About the studio, Products & Pack-shots, Jewlery, People, Architecture + Interior, Wine & More, Food, Industry, Life style, Holiday Cards, Contact. "Our Clients" must NOT appear in the menu. Automated by the content integrity test.

### 2. Slider pages and slot counts (US1, SC-002)

Click each portfolio tab; each page shows a fullscreen slider with placeholder slots. Expected slot counts (from the source database, see [research.md](./research.md)):

| Page | Slots |
|---|---|
| Home (`/`) | 1 |
| Products & Pack-shots | 24 |
| Jewlery | 16 |
| People | 24 |
| Architecture + Interior | 19 |
| Wine & More | 22 |
| Food | 19 |
| Industry | 20 |
| Life style | 14 |
| Holiday Cards | 15 |

Advancing past the last slide wraps to the first. Automated (counts) by the content integrity test; wrap-around covered by the FullscreenSlider component test.

### 3. About / Contact / Clients content (US2, US3, SC-003)

- `/about-the-studio`: full bio starting "Studio Omri Meron" and containing "Living six years in New York City".
- `/contact`: address "Rabenu Khanan'el St 29, Tel Aviv-Yafo", phone "972 54 2999-663", a clickable mailto link, an embedded map iframe.
- `/our-clients`: grid of 28 client names (source order, first: Osem; includes "Müller" rendered correctly), each with a placeholder logo slot.

### 4. Old-URL compatibility (FR-008, SC-004)

With `npm run start` running:

```bash
scripts/check_routes.sh          # optionally pass a base URL, default http://localhost:3000
```

Checks every old trailing-slash URL, `/home/` → `/`, the URL-encoded Hebrew Industry slug (all must reach 200 after redirects), and that the 3 out-of-scope draft pages 404. Exits non-zero on any failure.

### 5. CMS-readiness seam (US4, SC-007)

Rename one tab in `content/site.ts` (e.g. "Food" → "Food!"), reload: the header changes. `git diff --stat` shows only the content file changed, no `components/` or `app/` files. Revert.

### 6. No image binaries (SC-006)

```bash
find . -path ./node_modules -prune -o -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' -o -iname '*.webp' \) -print
```

Must print nothing except owner-provided brand assets under `public/brand/` (a favicon is likewise acceptable; zero files from the source site backup).

### 7. Mobile (FR-009, SC-005)

In devtools mobile viewport: menu opens via the mobile toggle, every category reachable in one click from `/`, slider swipes by touch.
