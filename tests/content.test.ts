// Content integrity: the executable form of SC-001/002/003 (spec.md).
// Asserts the content API against the frozen source inventory extracted
// from the WordPress dump, catching drift from hand edits to content/.
import { describe, expect, it } from 'vitest'
import inventory from './fixtures/source-inventory.json'
import {
  getAllPageSlugs,
  getClients,
  getGalleryForPage,
  getHomePage,
  getNavigation,
  getPage,
  getSiteSettings,
} from '@/lib/content'
import { galleries } from '@/content/galleries'
import { pages } from '@/content/pages'

describe('navigation (SC-001)', () => {
  it('has exactly the 12 source tab labels in source order', async () => {
    const nav = await getNavigation()
    expect(nav.map((n) => n.label)).toEqual(inventory.navLabels)
  })

  it('resolves hrefs: home at /, others at /<slug>', async () => {
    const nav = await getNavigation()
    expect(nav[0]).toEqual({ label: 'Home', href: '/', layout: 'slider' })
    for (const item of nav.slice(1)) {
      expect(item.href).toMatch(/^\/.+/)
    }
    expect(nav.find((n) => n.label === 'Industry')?.href).toBe('/industry')
  })

  it('does not include Our Clients (FR-006)', async () => {
    const nav = await getNavigation()
    expect(nav.map((n) => n.label)).not.toContain('Our Clients')
    expect((await getPage('clients'))?.inNavigation).toBe(false)
  })
})

describe('pages', () => {
  it('exposes all source slugs and only them', async () => {
    const slugs = [...(await getAllPageSlugs()), 'home'].sort()
    expect(slugs).toEqual([...inventory.pageSlugs].sort())
  })

  it('getAllPageSlugs yields exactly 12 slugs, excluding home', async () => {
    const slugs = await getAllPageSlugs()
    expect(slugs).toHaveLength(12)
    expect(slugs).not.toContain('home')
  })

  it('slugs are unique', () => {
    const slugs = pages.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('home page is source page 228 with a slider layout', async () => {
    const home = await getHomePage()
    expect(home._id).toBe('page-228')
    expect(home.layout).toBe('slider')
  })

  it('out-of-scope source pages are absent (FR-010)', () => {
    const ids = pages.map((p) => p._id)
    for (const excluded of ['page-612', 'page-660', 'page-721']) {
      expect(ids).not.toContain(excluded)
    }
  })

  it('unknown slug returns null', async () => {
    expect(await getPage('no-such-page')).toBeNull()
  })
})

describe('galleries (SC-002)', () => {
  it('every slider page resolves to a gallery with the source slot count', async () => {
    for (const [slug, count] of Object.entries(inventory.pageSlotCounts)) {
      const page = slug === 'home' ? await getHomePage() : await getPage(slug)
      expect(page, slug).not.toBeNull()
      const gallery = await getGalleryForPage(page!)
      expect(gallery, slug).not.toBeNull()
      expect(gallery!.slots.length, slug).toBe(count)
    }
  })

  it('page gallery slots total 174', async () => {
    let total = 0
    for (const slug of Object.keys(inventory.pageSlotCounts)) {
      const page = slug === 'home' ? await getHomePage() : await getPage(slug)
      total += (await getGalleryForPage(page!))!.slots.length
    }
    expect(total).toBe(174)
  })

  it('captures the 15 standalone galleries with source slot counts, totaling 182 (FR-010)', () => {
    const standalone = galleries.filter((g) => g.standalone)
    expect(standalone).toHaveLength(15)
    const byName = Object.fromEntries(standalone.map((g) => [g.name, g.slots.length]))
    expect(byName).toEqual(inventory.standaloneSlotCounts)
    expect(standalone.reduce((sum, g) => sum + g.slots.length, 0)).toBe(182)
  })

  it('slots are ordered by position and carry a sourceRef (FR-003)', () => {
    for (const gallery of galleries) {
      gallery.slots.forEach((slot, i) => {
        expect(slot.position).toBe(i)
        expect(slot.sourceRef).toBeTruthy()
      })
    }
  })
})

describe('clients (SC-003)', () => {
  it('all 28 client names verbatim in source order, incl. special characters', async () => {
    const clients = await getClients()
    expect(clients.map((c) => c.name)).toEqual(inventory.clientNames)
    expect(clients.map((c) => c.name)).toContain('Müller')
  })
})

describe('site identity', () => {
  it('has the corrected identity and full contact details', async () => {
    const settings = await getSiteSettings()
    expect(settings.title).toBe('Omri Meron')
    expect(settings.tagline).toBe('Photographer')
    expect(settings.contact.phone).toBe('972 54 2999-663')
    expect(settings.contact.email).toBe('meronok@gmail.com')
  })
})
