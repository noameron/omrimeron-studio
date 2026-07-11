import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ClientGrid from '@/components/ClientGrid'
import ContactBlock from '@/components/ContactBlock'
import FullscreenSlider from '@/components/FullscreenSlider'
import ProseBlock from '@/components/ProseBlock'
import { getAllPageSlugs, getClients, getGalleryForPage, getPage, getSiteSettings } from '@/lib/content'

type Props = { params: Promise<{ slug: string }> }

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
    case 'text':
      return <ProseBlock body={page.body ?? ''} />
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
