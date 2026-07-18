import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IntroOverlay from '@/components/IntroOverlay'
import { INTRO_SEEN_KEY } from '@/components/introSeen'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('IntroOverlay', () => {
  beforeEach(() => {
    sessionStorage.clear()
    delete document.documentElement.dataset.introSeen
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the logo overlay on a fresh session', () => {
    const { container } = render(<IntroOverlay />)
    const overlay = container.querySelector('#intro-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay!.querySelector('img')).not.toBeNull()
  })

  it('does not render when the session already saw the intro', () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    const { container } = render(<IntroOverlay />)
    expect(container.querySelector('#intro-overlay')).toBeNull()
  })

  it('a click skips: marks the session seen and removes the overlay', () => {
    vi.useFakeTimers()
    const { container } = render(<IntroOverlay />)
    fireEvent.click(container.querySelector('#intro-overlay')!)
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBe('1')
    expect(document.documentElement.dataset.introSeen).toBe('1')
    act(() => vi.advanceTimersByTime(300))
    expect(container.querySelector('#intro-overlay')).toBeNull()
  })

  it('Escape skips too', () => {
    vi.useFakeTimers()
    const { container } = render(<IntroOverlay />)
    fireEvent.keyDown(window, { key: 'Escape' })
    act(() => vi.advanceTimersByTime(300))
    expect(container.querySelector('#intro-overlay')).toBeNull()
    expect(sessionStorage.getItem(INTRO_SEEN_KEY)).toBe('1')
  })
})
