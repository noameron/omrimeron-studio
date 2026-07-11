import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import { getNavigation, getSiteSettings } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: {
      default: `${settings.title} | ${settings.tagline}`,
      template: `%s | ${settings.title}`,
    },
    description: `${settings.title}, ${settings.tagline}. Commercial photography studio in Tel Aviv.`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const nav = await getNavigation()
  return (
    <html lang="en">
      <body>
        <SiteHeader title={settings.title} nav={nav} social={settings.social} />
        <main>{children}</main>
      </body>
    </html>
  )
}
