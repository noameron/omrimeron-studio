import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FullscreenSlider from '@/components/FullscreenSlider'
import type { ImageSlot } from '@/lib/content'

const slots: ImageSlot[] = [
  { position: 0, sourceRef: 'wp-attachment-1', alt: 'Test placeholder 1 of 3', width: 1600, height: 1000 },
  { position: 1, sourceRef: 'wp-attachment-2', alt: 'Test placeholder 2 of 3', width: 1000, height: 1600 },
  { position: 2, sourceRef: 'wp-attachment-3', alt: 'Test placeholder 3 of 3' },
]

describe('FullscreenSlider', () => {
  it('renders one placeholder slide per slot, keeping the source attachment reference (FR-002, FR-003)', () => {
    const { container } = render(<FullscreenSlider slots={slots} galleryName="Test" />)
    const placeholders = container.querySelectorAll('[data-source-ref]')
    expect(placeholders).toHaveLength(3)
    expect([...placeholders].map((el) => el.getAttribute('data-source-ref'))).toEqual([
      'wp-attachment-1',
      'wp-attachment-2',
      'wp-attachment-3',
    ])
  })

  it('renders prev/next controls for multi-slot galleries', () => {
    render(<FullscreenSlider slots={slots} galleryName="Test" />)
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument()
  })

  it('renders an empty state instead of a broken slider for zero slots (spec edge case)', () => {
    render(<FullscreenSlider slots={[]} galleryName="Empty" />)
    expect(screen.getByRole('status')).toHaveTextContent('No images in this gallery yet.')
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull()
  })
})
