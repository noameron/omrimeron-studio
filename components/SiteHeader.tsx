'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { ResolvedNavItem } from '@/lib/content'

// Left sidebar matching the source composition: logo lockup on top (green
// placeholder mark + stacked lowercase title words; no logo binary migrated,
// FR-003), vertical nav with green active state, copyright at the bottom.
// Collapses to a top bar with a hamburger menu on small viewports.
export default function SiteHeader({ title, nav }: { title: string; nav: ResolvedNavItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = pathname ? decodeURIComponent(pathname) : ''
  return (
    <header className="site-sidebar">
      <Link href="/" className="site-logo" aria-label={title}>
        <span className="site-logo__mark" aria-hidden="true" />
        <span className="site-logo__text" aria-hidden="true">
          {title.split(' ').map((word) => (
            <span key={word} className="site-logo__word">
              {word}
            </span>
          ))}
        </span>
      </Link>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-label="Toggle navigation"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <nav className={open ? 'site-nav site-nav--open' : 'site-nav'} aria-label="Main">
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current === item.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="site-copyright">© {title}</p>
    </header>
  )
}
