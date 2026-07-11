// Content-layer types. Shapes mirror the future Sanity schemas:
// documents carry _type and a stable _id; cross-references are by _id.
export interface ImageSlot {
  position: number
  sourceRef: string // wp-attachment-<id> or source logo URL; the durable link for attaching real media later
  alt: string
  width?: number // source image dimensions where known (aspect-ratio-correct placeholders)
  height?: number
}

export interface NavigationItem {
  label: string
  pageId: string
}

export interface SiteSettings {
  _type: 'siteSettings'
  title: string
  tagline: string
  contact: {
    address: string
    phone: string
    email: string
    mapEmbedUrl: string
  }
  navigation: NavigationItem[]
}

export type PageLayout = 'slider' | 'text' | 'contact' | 'clientGrid'

export interface Page {
  _type: 'page'
  _id: string
  title: string
  slug: string
  layout: PageLayout
  galleryId?: string
  body?: string
  inNavigation: boolean
}

export type GalleryDisplayMode = 'slider' | 'fancybox' | 'grid'

export interface Gallery {
  _type: 'gallery'
  _id: string
  name: string
  displayMode: GalleryDisplayMode
  standalone: boolean
  slots: ImageSlot[]
}

export interface Client {
  _type: 'client'
  _id: string
  name: string
  order: number
  logoSlot: ImageSlot
}
