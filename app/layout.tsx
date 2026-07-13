import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { getNavigation, getSiteSettings } from '@/lib/content'

// Rubik across the whole site, matching the meron4art family look; the
// hebrew subset is included so future Hebrew content renders in the same face.
const rubik = Rubik({
  variable: '--font-rubik',
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '700'],
})

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
    <html lang="en" className={rubik.variable}>
      <body>
        <SiteHeader title={settings.title} nav={nav} />
        <main>{children}</main>
        <SiteFooter
          title={settings.title}
          tagline={settings.tagline}
          contact={settings.contact}
          social={settings.social}
        />
      </body>
    </html>
  )
}
