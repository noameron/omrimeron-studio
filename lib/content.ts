// The content-access API (specs/001-wordpress-nextjs-migration/contracts/content-api.md).
// The ONLY module through which app code reads content: swapping the local
// content/ modules for a Sanity client changes this file alone.
// Functions are async so signatures survive that swap unchanged.
import { siteSettings } from '../content/site'
import { pages } from '../content/pages'
import { galleries } from '../content/galleries'
import { clients } from '../content/clients'
import type { Client, Gallery, Page, SiteSettings } from '../content/types'

export type * from '../content/types'

export interface ResolvedNavItem {
  label: string
  href: string
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

export async function getGallery(galleryId: string): Promise<Gallery | null> {
  return galleryById.get(galleryId) ?? null
}

export async function getGalleryForPage(page: Page): Promise<Gallery | null> {
  return page.galleryId ? ((await getGallery(page.galleryId)) ?? null) : null
}

export async function getClients(): Promise<Client[]> {
  return clients
}
