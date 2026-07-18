'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ResolvedNavItem } from '@/lib/content'

// A gallery (slider) page other than home; these are grouped under one
// "Portfolio" dropdown so the top-level menu stays small (a large flat menu
// overwhelms scanning; grouping keeps it to a handful of items).
function isGalleryItem(item: ResolvedNavItem) {
  return item.layout === 'slider' && item.href !== '/'
}

// Masthead: a single bar with the logo on the left; on desktop the menu tabs
// sit centered in the remaining row space, on mobile they move to the drawer.
// The nine gallery categories live in a Portfolio dropdown (hover, click and
// keyboard operable). On small viewports the tabs move into a drawer sliding
// in from the right, where the dropdown flattens into the full list.
export default function SiteHeader({ title, nav }: { title: string; nav: ResolvedNavItem[] }) {
  const [open, setOpen] = useState(false)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const groupRef = useRef<HTMLLIElement>(null)
  const pathname = usePathname()
  const current = pathname ? decodeURIComponent(pathname) : ''

  const galleryItems = nav.filter(isGalleryItem)
  const firstGalleryHref = galleryItems[0]?.href
  const portfolioActive = galleryItems.some((item) => item.href === current)

  // The menu tabs wrap at mid widths, so the header height isn't a constant.
  // Publish the measured height as --header-h so the fullscreen slider can
  // subtract it from the viewport exactly (globals.css ships a close static
  // fallback for first paint).
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
    })
    observer.observe(header)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--header-h')
    }
  }, [])

  // Lock background scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close the dropdown on Escape or on any press outside it
  useEffect(() => {
    if (!portfolioOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPortfolioOpen(false)
    }
    const onPress = (e: PointerEvent) => {
      if (!groupRef.current?.contains(e.target as Node)) setPortfolioOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPress)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPress)
    }
  }, [portfolioOpen])

  const closeAll = () => {
    setOpen(false)
    setPortfolioOpen(false)
  }

  const navLink = (item: ResolvedNavItem) => (
    <Link
      href={item.href}
      aria-current={current === item.href ? 'page' : undefined}
      onClick={closeAll}
    >
      {item.label}
    </Link>
  )

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-bar">
        {/* data-intro-brand: the landing target the intro overlay's logo
            flies onto (components/IntroOverlay.tsx) */}
        <Link href="/" className="site-logo" data-intro-brand onClick={closeAll}>
          <Image src="/brand/logo_1.jpg" alt={title} width={181} height={82} priority />
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
      <div
        aria-hidden={!open}
        className={open ? 'nav-backdrop nav-backdrop--open' : 'nav-backdrop'}
        onClick={() => setOpen(false)}
      />
      <nav className={open ? 'site-nav site-nav--open' : 'site-nav'} aria-label="Main">
        <button
          type="button"
          className="nav-close"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <ul>
          {nav.map((item) => {
            if (!isGalleryItem(item)) return <li key={item.href}>{navLink(item)}</li>
            // the whole gallery run renders once, as the dropdown, in the
            // slot of its first item — DOM link order stays the source order
            if (item.href !== firstGalleryHref) return null
            return (
              <li
                key="portfolio"
                ref={groupRef}
                className={portfolioOpen ? 'nav-group nav-group--open' : 'nav-group'}
                onMouseEnter={() => setPortfolioOpen(true)}
                onMouseLeave={() => setPortfolioOpen(false)}
              >
                <button
                  type="button"
                  className={portfolioActive ? 'nav-group__trigger nav-group__trigger--active' : 'nav-group__trigger'}
                  aria-expanded={portfolioOpen}
                  aria-haspopup="true"
                  // open only: hover already opened it for mouse users, so a
                  // toggle would immediately close what the hover opened.
                  // Closing is Escape, outside press, mouseleave, or a link.
                  onClick={() => setPortfolioOpen(true)}
                >
                  Portfolio
                  <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>
                <ul className="nav-sub">
                  {galleryItems.map((gallery) => (
                    <li key={gallery.href}>{navLink(gallery)}</li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
