import FullscreenSlider from '@/components/FullscreenSlider'
import { getGalleryForPage, getHomePage, getRandomHomeSlots } from '@/lib/content'

// ISR: images are managed in the Sanity backoffice; re-fetch at most once a
// minute so newly published media appears without a redeploy (and the home
// selection re-shuffles).
export const revalidate = 60

// "/" serves the source Home page (slug "home"), per the menu-is-authoritative
// assumption in spec.md. Its slider shows a random draw from all category
// galleries (owner decision 2026-07-13); the legacy Home gallery slots are
// only the fallback when the backoffice is unreachable.
export default async function HomePage() {
  const page = await getHomePage()
  const randomSlots = await getRandomHomeSlots()
  const fallback = randomSlots ? null : await getGalleryForPage(page)
  return (
    <FullscreenSlider
      slots={randomSlots ?? fallback?.slots ?? []}
      galleryName={page.title}
      autoAdvanceMs={4000}
    />
  )
}
