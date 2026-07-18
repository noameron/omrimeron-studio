import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ContactForm, { buildMailto } from '@/components/ContactForm'
import ContactBlock from '@/components/ContactBlock'

function formData(entries: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

describe('buildMailto', () => {
  it('builds a mailto URL with subject and body from the form fields', () => {
    const href = buildMailto(
      'studio@example.com',
      formData({ name: 'Dana', email: 'dana@example.com', phone: '050-1234567', message: 'Hi there' }),
    )
    expect(href.startsWith('mailto:studio@example.com?')).toBe(true)
    expect(href).toContain(`subject=${encodeURIComponent('Message from Dana')}`)
    expect(href).toContain(encodeURIComponent('Dana (dana@example.com, 050-1234567)\n\nHi there'))
  })

  it('omits the phone when it was left empty', () => {
    const href = buildMailto(
      'studio@example.com',
      formData({ name: 'Dana', email: 'dana@example.com', phone: '', message: 'Hi' }),
    )
    expect(href).toContain(encodeURIComponent('Dana (dana@example.com)\n\nHi'))
  })
})

describe('ContactForm', () => {
  it('renders the four fields and a send button', () => {
    render(<ContactForm to="studio@example.com" />)
    expect(screen.getByLabelText('Name')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText('Phone')).not.toBeRequired()
    expect(screen.getByLabelText('Message')).toBeRequired()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })
})

describe('ContactBlock', () => {
  it('shows the name plus clickable mailto and tel links beside the form', () => {
    render(<ContactBlock title="Omri Meron" contact={{ phone: '972 54 2999-663', email: 'meronok@gmail.com' }} />)
    expect(screen.getByText('Omri Meron')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute('href', 'mailto:meronok@gmail.com')
    expect(screen.getByRole('link', { name: 'Phone' })).toHaveAttribute('href', 'tel:+972542999663')
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })
})
