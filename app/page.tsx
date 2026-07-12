import FullscreenSlider from '@/components/FullscreenSlider'
import { getGalleryForPage, getHomePage } from '@/lib/content'

// ISR: images are managed in the Sanity backoffice; re-fetch at most once a
// minute so newly published media appears without a redeploy.
export const revalidate = 60

// "/" serves the source Home page (slug "home"), per the menu-is-authoritative
// assumption in spec.md.
export default async function HomePage() {
  const page = await getHomePage()
  const gallery = await getGalleryForPage(page)
  return <FullscreenSlider slots={gallery?.slots ?? []} galleryName={gallery?.name ?? page.title} />
}
