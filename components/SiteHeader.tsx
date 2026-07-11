'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { ResolvedNavItem } from '@/lib/content'

// Left sidebar matching the source composition: studio logo on top
// (owner-provided asset in public/brand/), vertical nav with green active
// state, copyright at the bottom. Collapses to a top bar with a hamburger
// menu on small viewports.
export default function SiteHeader({ title, nav }: { title: string; nav: ResolvedNavItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const current = pathname ? decodeURIComponent(pathname) : ''
  return (
    <header className="site-sidebar">
      <Link href="/" className="site-logo">
        <Image src="/brand/logo.jpg" alt={title} width={181} height={82} priority />
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
