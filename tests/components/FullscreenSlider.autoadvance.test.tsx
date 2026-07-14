import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FullscreenSlider from '@/components/FullscreenSlider'
import type { ImageSlot } from '@/lib/content'

const scrollNext = vi.fn()
const scrollPrev = vi.fn()

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), { scrollNext, scrollPrev }],
}))

const slots: ImageSlot[] = [
  { position: 0, sourceRef: 'wp-attachment-1', alt: 'Test placeholder 1 of 2', width: 1600, height: 1000 },
  { position: 1, sourceRef: 'wp-attachment-2', alt: 'Test placeholder 2 of 2', width: 1000, height: 1600 },
]

describe('FullscreenSlider auto-advance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    scrollNext.mockClear()
    scrollPrev.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('advances every autoAdvanceMs', () => {
    render(<FullscreenSlider slots={slots} galleryName="Test" autoAdvanceMs={4000} />)
    vi.advanceTimersByTime(3999)
    expect(scrollNext).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(scrollNext).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(4000)
    expect(scrollNext).toHaveBeenCalledTimes(2)
  })

  it('restarts the countdown when the user clicks next', () => {
    render(<FullscreenSlider slots={slots} galleryName="Test" autoAdvanceMs={4000} />)
    vi.advanceTimersByTime(2000)
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(scrollNext).toHaveBeenCalledTimes(1) // the click itself
    // The original timer would have fired 2000ms from now; the reset one fires in 4000ms.
    vi.advanceTimersByTime(3999)
    expect(scrollNext).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(scrollNext).toHaveBeenCalledTimes(2)
  })

  it('restarts the countdown when the user clicks previous', () => {
    render(<FullscreenSlider slots={slots} galleryName="Test" autoAdvanceMs={4000} />)
    vi.advanceTimersByTime(2000)
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(scrollPrev).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(3999)
    expect(scrollNext).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(scrollNext).toHaveBeenCalledTimes(1)
  })

  it('does not auto-advance without autoAdvanceMs', () => {
    render(<FullscreenSlider slots={slots} galleryName="Test" />)
    vi.advanceTimersByTime(20000)
    expect(scrollNext).not.toHaveBeenCalled()
  })

  it('stops the timer on unmount', () => {
    const { unmount } = render(<FullscreenSlider slots={slots} galleryName="Test" autoAdvanceMs={4000} />)
    unmount()
    vi.advanceTimersByTime(20000)
    expect(scrollNext).not.toHaveBeenCalled()
  })
})
