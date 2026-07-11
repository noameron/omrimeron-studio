# Contract: URL Map & Redirects

**Date**: 2026-07-11 | **Plan**: [../plan.md](../plan.md)

Source permalink structure was `/%postname%/`. In-scope pages keep their exact source slugs (research.md D5), so old URLs resolve by identity; redirects are only needed where the new site diverges (FR-008, SC-004).

## Canonical routes (13)

| Route | Page (id) | Layout | Rendered by |
|---|---|---|---|
| `/` | Home (228) | slider | `app/page.tsx` |
| `/about-the-studio` | About the studio (330) | text | `app/[slug]/page.tsx` |
| `/packshots` | Products & Pack-shots (578) | slider | `app/[slug]/page.tsx` |
| `/jewlery` | Jewlery (291) | slider | `app/[slug]/page.tsx` |
| `/people` | People (316) | slider | `app/[slug]/page.tsx` |
| `/architecture` | Architecture + Interior (246) | slider | `app/[slug]/page.tsx` |
| `/wine-more` | Wine & More (452) | slider | `app/[slug]/page.tsx` |
| `/food` | Food (259) | slider | `app/[slug]/page.tsx` |
| `/צילום-תעשיה-עמרי-מירון` | Industry (277) | slider | `app/[slug]/page.tsx` |
| `/life-style` | Life style (303) | slider | `app/[slug]/page.tsx` |
| `/holiday-cards` | Holiday Cards (415) | slider | `app/[slug]/page.tsx` |
| `/contact` | Contact (332) | contact | `app/[slug]/page.tsx` |
| `/our-clients` | Our Clients (355) | clientGrid | `app/[slug]/page.tsx` |

The Industry route arrives URL-encoded (`/%D7%A6%D7%99%D7%9C%D7%95%D7%9D-%D7%AA%D7%A2%D7%A9%D7%99%D7%94-%D7%A2%D7%9E%D7%A8%D7%99-%D7%9E%D7%99%D7%A8%D7%95%D7%9F`); the `[slug]` route handler must `decodeURIComponent` the param before content lookup. Both the encoded and decoded forms must resolve.

`/our-clients` is routable but absent from navigation (FR-006).

## Redirects (`next.config.ts`)

| Source | Destination | Status | Why |
|---|---|---|---|
| `/home` (and `/home/`) | `/` | 308 | Home page served at root; old menu URL was `/home/` |

Trailing-slash variants of every route (source URLs all ended in `/`) are handled by Next.js's built-in trailing-slash normalization (default: `/food/` → 308 → `/food`); no per-page redirect entries needed.

## Non-routes

- The 3 out-of-scope pages (`/home-page-with-video`, `/new-home-page`, `/photography-of-art-works`) → 404. They were unused drafts; no redirect obligation (spec edge case).
- The 15 standalone gallery slugs (`/gallery/rona` etc. in source) → 404 for now; definitions are captured in content only (FR-010). If real inbound links surface, add redirects then.
- Any other path → Next.js `notFound()` page showing the site header so visitors can recover (nav stays usable).

## Validation (SC-004)

Every route in the canonical table returns 200 with content; `/home` returns 308 → `/`; each old trailing-slash URL resolves (308 → 200). Verified in quickstart.md scenario 4.
