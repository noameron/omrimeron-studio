import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClientGrid from '@/components/ClientGrid'
import ContactBlock from '@/components/ContactBlock'
import FullscreenSlider from '@/components/FullscreenSlider'
import ProseBlock from '@/components/ProseBlock'
import { getAboutImage, getAllPageSlugs, getClients, getGalleryForPage, getPage, getSiteSettings } from '@/lib/content'

type Props = { params: Promise<{ slug: string }> }

// ISR: images are managed in the Sanity backoffice; re-fetch at most once a
// minute so newly published media appears without a redeploy.
export const revalidate = 60

export async function generateStaticParams() {
  return (await getAllPageSlugs()).map((slug) => ({ slug }))
}

async function resolvePage(params: Props['params']) {
  // The Industry route arrives URL-encoded (Hebrew slug); content slugs are
  // stored decoded (contracts/routes.md).
  const { slug } = await params
  return getPage(decodeURIComponent(slug))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolvePage(params)
  return { title: page?.title }
}

export default async function ContentPage({ params }: Props) {
  const page = await resolvePage(params)
  if (!page) notFound()

  switch (page.layout) {
    case 'slider': {
      const gallery = await getGalleryForPage(page)
      return <FullscreenSlider slots={gallery?.slots ?? []} galleryName={gallery?.name ?? page.title} />
    }
    case 'text': {
      // About (page-330) is the only text page; its backoffice-managed photo
      // (when set) renders centered above the copy.
      const image = page._id === 'page-330' ? await getAboutImage() : null
      return <ProseBlock body={page.body ?? ''} image={image} />
    }
    case 'contact': {
      const settings = await getSiteSettings()
      return <ContactBlock contact={settings.contact} />
    }
    case 'clientGrid':
      return <ClientGrid clients={await getClients()} />
    default:
      notFound()
  }
}
