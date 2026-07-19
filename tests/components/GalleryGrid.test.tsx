import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GalleryGrid, { PAGE_SIZE } from '@/components/GalleryGrid'
import type { ImageSlot } from '@/lib/content'

function makeSlots(count: number): ImageSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i,
    sourceRef: `ref-${i}`,
    alt: `Image ${i + 1}`,
    width: 1200,
    height: 900,
    url: `https://cdn.example/image-${i}.jpg`,
  }))
}

describe('GalleryGrid', () => {
  it('renders an empty state when the gallery has no slots', () => {
    render(<GalleryGrid slots={[]} galleryName="Food" />)
    expect(screen.getByRole('status')).toHaveTextContent('No images in this gallery yet.')
  })

  it('shows at most PAGE_SIZE thumbnails per page with pagination controls', () => {
    render(<GalleryGrid slots={makeSlots(30)} galleryName="Food" />)
    expect(screen.getAllByRole('img')).toHaveLength(PAGE_SIZE)
    expect(screen.getByText(`Page 1 of ${Math.ceil(30 / PAGE_SIZE)}`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Image ${PAGE_SIZE + 1}` })).toBeInTheDocument()
  })

  it('hides pagination when everything fits on one page', () => {
    render(<GalleryGrid slots={makeSlots(PAGE_SIZE)} galleryName="Food" />)
    expect(screen.queryByRole('button', { name: 'Next page' })).toBeNull()
  })

  it('opens the lightbox with a counter over the whole gallery', () => {
    render(<GalleryGrid slots={makeSlots(30)} galleryName="Food" />)
    fireEvent.click(screen.getByRole('button', { name: 'Image 1' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('1 / 30')
  })

  it('counts from the global index when opening on a later page', () => {
    render(<GalleryGrid slots={makeSlots(30)} galleryName="Food" />)
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    fireEvent.click(screen.getByRole('button', { name: `Image ${PAGE_SIZE + 1}` }))
    expect(screen.getByRole('dialog')).toHaveTextContent(`${PAGE_SIZE + 1} / 30`)
  })

  it('arrows step through the whole gallery and wrap around the ends', () => {
    render(<GalleryGrid slots={makeSlots(30)} galleryName="Food" />)
    fireEvent.click(screen.getByRole('button', { name: 'Image 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('2 / 30')
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('30 / 30')
  })

  it('arrow keys navigate and Escape closes', () => {
    render(<GalleryGrid slots={makeSlots(5)} galleryName="Food" />)
    fireEvent.click(screen.getByRole('button', { name: 'Image 1' }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('dialog')).toHaveTextContent('2 / 5')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('dialog')).toHaveTextContent('1 / 5')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('close button closes the lightbox', () => {
    render(<GalleryGrid slots={makeSlots(5)} galleryName="Food" />)
    fireEvent.click(screen.getByRole('button', { name: 'Image 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
