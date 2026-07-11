# Contract: Content-Access API (`lib/content.ts`)

**Date**: 2026-07-11 | **Plan**: [../plan.md](../plan.md) | **Data model**: [../data-model.md](../data-model.md)

`lib/content.ts` is the only module through which app code (pages, components) reads content. Components never import from `content/` directly; enforcing this seam is what makes the later Sanity swap a one-module change (FR-007, US4).

All functions are synchronous today (local data) but **declared async** (returning `Promise<...>`) so the signatures survive the swap to Sanity client fetches unchanged.

## Functions

```ts
getSiteSettings(): Promise<SiteSettings>
```
Returns the singleton: identity, contact details, and the 12-item navigation (already ordered).

```ts
getNavigation(): Promise<ResolvedNavItem[]>
// ResolvedNavItem = { label: string; href: string }
```
Navigation with each item's `pageId` resolved to a route href (`/` for the home page, `/<slug>` otherwise, Hebrew slug left decoded; Next.js `<Link>` handles encoding). Convenience over `getSiteSettings().navigation` so the header component needs no routing knowledge.

```ts
getPage(slug: string): Promise<Page | null>
```
Lookup by decoded slug. `home` is addressable both as `home` and via `getHomePage()`. Returns `null` for unknown slugs (caller triggers `notFound()`).

```ts
getHomePage(): Promise<Page>
```
The page served at `/` (source page 228, per the menu-is-authoritative assumption).

```ts
getAllPageSlugs(): Promise<string[]>
```
Decoded slugs of every routable page **except** home (home is served at `/`, not `/home`). Feeds `generateStaticParams` for `app/[slug]/page.tsx`; must yield exactly 12 slugs (11 non-home nav pages + our-clients).

```ts
getGallery(galleryId: string): Promise<Gallery | null>
```
Any gallery by `_id`, including the 15 standalone collections (captured but unrouted, FR-010).

```ts
getGalleryForPage(page: Page): Promise<Gallery | null>
```
Resolves `page.galleryId`. Returns `null` when the page has no gallery; a slider page whose gallery is missing or empty must render the empty-state placeholder, never throw (spec edge case).

```ts
getClients(): Promise<Client[]>
```
All 28 clients in source order.

## Guarantees

1. **Purity**: same output for same input, no I/O side effects visible to callers.
2. **Order preservation**: navigation, gallery slots, and clients come back in source order; callers never sort.
3. **No content literals outside `content/`**: renaming a nav tab or editing copy touches only `content/*` (SC-007). The content integrity test suite imports only this API.
4. **Swap contract**: replacing local imports with Sanity client calls changes only this file (plus adding the client dep); every signature, type, and guarantee above is preserved.

## Error behavior

Unknown slug/id → `null`, never throw. Malformed content (dangling `galleryId`, duplicate slugs) is a build-time failure surfaced by the content integrity tests, not a runtime condition.
