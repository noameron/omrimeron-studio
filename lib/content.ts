// The content-access API (specs/001-wordpress-nextjs-migration/contracts/content-api.md).
// The ONLY module through which app code reads content: swapping the local
// content/ modules for a Sanity client changes this file alone.
// Functions are async so signatures survive that swap unchanged.
import { siteSettings } from '../content/site'
import { pages } from '../content/pages'
import { galleries } from '../content/galleries'
import { clients } from '../content/clients'
import type { Client, Gallery, ImageSlot, Page, PageLayout, SiteSettings } from '../content/types'

export type * from '../content/types'

export interface ResolvedNavItem {
  label: string
  href: string
  // the target page's layout, so navigation UI can group the gallery
  // (slider) pages under one "Portfolio" item
  layout: PageLayout
}

// Source page 228 ("Home") is served at "/" (menu-is-authoritative assumption, spec.md).
const HOME_PAGE_ID = 'page-228'

const pageById = new Map(pages.map((p) => [p._id, p]))
const pageBySlug = new Map(pages.map((p) => [p.slug, p]))
const galleryById = new Map(galleries.map((g) => [g._id, g]))

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings
}

export async function getNavigation(): Promise<ResolvedNavItem[]> {
  return siteSettings.navigation.map((item) => {
    const page = pageById.get(item.pageId)
    if (!page) throw new Error(`Navigation item "${item.label}" references unknown page ${item.pageId}`)
    return {
      label: item.label,
      href: item.pageId === HOME_PAGE_ID ? '/' : `/${page.slug}`,
      layout: page.layout,
    }
  })
}

export async function getPage(slug: string): Promise<Page | null> {
  return pageBySlug.get(slug) ?? null
}

export async function getHomePage(): Promise<Page> {
  const home = pageById.get(HOME_PAGE_ID)
  if (!home) throw new Error(`Home page ${HOME_PAGE_ID} missing from content`)
  return home
}

export async function getAllPageSlugs(): Promise<string[]> {
  return pages.filter((p) => p._id !== HOME_PAGE_ID).map((p) => p.slug)
}

// Shape returned by the gallery images GROQ projection below.
interface SanityGalleryImage {
  ref: string
  alt: string | null
  url: string | null
  width: number | null
  height: number | null
}

// Images managed in the Sanity backoffice for one gallery document (same
// _id scheme as the local layer). Returns null when the document is absent,
// has no images, or the fetch fails, so callers fall back to the local
// slots. Skipped under vitest to keep the test suite hermetic; the client
// is imported lazily for the same reason (its env assertions would throw
// at import time where NEXT_PUBLIC_SANITY_* is not loaded).
async function fetchSanitySlots(galleryId: string): Promise<ImageSlot[] | null> {
  if (process.env.VITEST) return null
  try {
    const { client } = await import('../sanity/lib/client')
    const images = await client.fetch<SanityGalleryImage[] | null>(
      `*[_type == "gallery" && _id == $id][0].images[]{
        "ref": asset._ref,
        "alt": alt,
        "url": asset->url,
        "width": asset->metadata.dimensions.width,
        "height": asset->metadata.dimensions.height
      }`,
      { id: galleryId },
    )
    const slots = (images ?? [])
      .filter((image) => image.url)
      .map((image, i) => ({
        position: i,
        sourceRef: image.ref,
        alt: image.alt ?? '',
        width: image.width ?? undefined,
        height: image.height ?? undefined,
        url: image.url!,
      }))
    return slots.length > 0 ? slots : null
  } catch {
    return null
  }
}

// The About page photo, managed in the backoffice (singleton "about-page"
// document, sanity/schemaTypes/aboutPage.ts). Null when unset, absent, or the
// fetch fails, so the page falls back to text only. Skipped under vitest for
// the same hermeticity reasons as fetchSanitySlots.
export async function getAboutImage(): Promise<ImageSlot | null> {
  if (process.env.VITEST) return null
  try {
    const { client } = await import('../sanity/lib/client')
    const image = await client.fetch<SanityGalleryImage | null>(
      `*[_type == "aboutPage" && _id == "about-page"][0].image{
        "ref": asset._ref,
        "alt": alt,
        "url": asset->url,
        "width": asset->metadata.dimensions.width,
        "height": asset->metadata.dimensions.height
      }`,
    )
    if (!image?.url) return null
    return {
      position: 0,
      sourceRef: image.ref,
      alt: image.alt ?? '',
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      url: image.url,
    }
  } catch {
    return null
  }
}

export async function getGallery(galleryId: string): Promise<Gallery | null> {
  const local = galleryById.get(galleryId) ?? null
  // the backoffice is authoritative for a gallery's images once it has any;
  // the local slots remain the placeholder fallback
  const remoteSlots = await fetchSanitySlots(galleryId)
  if (!remoteSlots) return local
  return {
    ...(local ?? {
      _type: 'gallery',
      _id: galleryId,
      name: '',
      displayMode: 'slider',
      standalone: false,
    }),
    slots: remoteSlots,
  }
}

export async function getGalleryForPage(page: Page): Promise<Gallery | null> {
  return page.galleryId ? ((await getGallery(page.galleryId)) ?? null) : null
}

export async function getClients(): Promise<Client[]> {
  return clients
}
