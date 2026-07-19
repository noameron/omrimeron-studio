import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import IntroOverlay from '@/components/IntroOverlay'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { INTRO_SEEN_KEY } from '@/components/introSeen'
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
    <html
      lang="en"
      className={rubik.variable}
      // the intro script below may add data-intro-seen to this element
      // before React hydrates
      suppressHydrationWarning
    >
      <body>
        {/* Runs while the HTML streams, before paint and hydration: full page
            loads in a session that already played the intro must not flash
            it. Flags <html> so the matching rule in globals.css hides the
            overlay; IntroOverlay sets the same flag after playing. The script
            rides inside a hidden div as raw HTML because React warns about
            (and never executes) <script> elements it renders on the client;
            as raw markup the browser still runs it on full page loads, which
            is the only time it's needed. */}
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: `<script>try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}'))document.documentElement.dataset.introSeen='1'}catch(e){}</script>`,
          }}
        />
        <IntroOverlay />
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
