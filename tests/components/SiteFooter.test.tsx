import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SiteFooter from '@/components/SiteFooter'
import { getSiteSettings } from '@/lib/content'

async function renderFooter() {
  const settings = await getSiteSettings()
  render(
    <SiteFooter
      title={settings.title}
      tagline={settings.tagline}
      contact={settings.contact}
      social={settings.social}
    />,
  )
}

describe('SiteFooter', () => {
  it('renders the social links with their profile URLs', async () => {
    await renderFooter()
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      'https://www.facebook.com/Studio.Omri.Meron',
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/omri-meron-7007b7a/',
    )
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/omri.meron/',
    )
  })

  it('renders the contact details with clickable phone and email', async () => {
    await renderFooter()
    const settings = await getSiteSettings()
    expect(screen.getByRole('link', { name: settings.contact.phone })).toHaveAttribute(
      'href',
      `tel:+${settings.contact.phone.replace(/\D/g, '')}`,
    )
    expect(screen.getByRole('link', { name: settings.contact.email })).toHaveAttribute(
      'href',
      `mailto:${settings.contact.email}`,
    )
  })
})
