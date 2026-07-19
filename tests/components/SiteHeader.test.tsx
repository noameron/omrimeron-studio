import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SiteHeader from '@/components/SiteHeader'
import { getNavigation, getSiteSettings } from '@/lib/content'
import inventory from '../fixtures/source-inventory.json'

async function renderHeader() {
  const settings = await getSiteSettings()
  const nav = await getNavigation()
  render(<SiteHeader title={settings.title} nav={nav} />)
}

describe('SiteHeader', () => {
  it('renders the text logo linking to /', async () => {
    await renderHeader()
    const logo = screen.getByRole('link', { name: 'Omri Meron' })
    expect(logo).toHaveAttribute('href', '/')
  })

  it('renders all 12 tab labels in menu order (SC-001)', async () => {
    await renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    const labels = within(nav)
      .getAllByRole('link')
      .map((a) => a.textContent)
    expect(labels).toEqual(inventory.navLabels)
  })

  it('does not link Our Clients (FR-006)', async () => {
    await renderHeader()
    expect(screen.queryByRole('link', { name: 'Our Clients' })).toBeNull()
  })

  it('mobile menu toggle opens and closes the nav', async () => {
    await renderHeader()
    const toggle = screen.getByRole('button', { name: 'Toggle navigation' })
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(nav.className).toContain('site-nav--open')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(nav.className).not.toContain('site-nav--open')
  })
})
