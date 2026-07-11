import FullscreenSlider from '@/components/FullscreenSlider'
import { getGalleryForPage, getHomePage } from '@/lib/content'

// "/" serves the source Home page (slug "home"), per the menu-is-authoritative
// assumption in spec.md.
export default async function HomePage() {
  const page = await getHomePage()
  const gallery = await getGalleryForPage(page)
  return <FullscreenSlider slots={gallery?.slots ?? []} galleryName={gallery?.name ?? page.title} />
}
