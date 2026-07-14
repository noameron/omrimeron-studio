'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useRef } from 'react'
import type { ImageSlot } from '@/lib/content'
import PlaceholderImage from './PlaceholderImage'

// Fullscreen looping slider (FR-002): one slide per ImageSlot, wrap-around
// via Embla's loop. Auto-advance is opt-in per page via autoAdvanceMs
// (owner decision 2026-07-14: home page advances every 4s, galleries stay
// manual). A manual arrow click restarts the countdown from zero.
export default function FullscreenSlider({
  slots,
  galleryName,
  autoAdvanceMs,
}: {
  slots: ImageSlot[]
  galleryName: string
  autoAdvanceMs?: number
}) {
  // duration is Embla's animation attack (frames-based, not ms); 40 gives a
  // noticeably softer glide than the default 25.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const restartTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!autoAdvanceMs || !emblaApi || slots.length <= 1) return
    timerRef.current = setInterval(() => emblaApi.scrollNext(), autoAdvanceMs)
  }, [autoAdvanceMs, emblaApi, slots.length])

  useEffect(() => {
    restartTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [restartTimer])

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev()
    restartTimer()
  }, [emblaApi, restartTimer])
  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext()
    restartTimer()
  }, [emblaApi, restartTimer])

  if (slots.length === 0) {
    // Spec edge case: empty gallery renders an empty state, never a broken slider.
    return (
      <div className="slider-empty" role="status">
        No images in this gallery yet.
      </div>
    )
  }

  return (
    <section className="fullscreen-slider" aria-label={`${galleryName} gallery`}>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {slots.map((slot) => (
            <div className="embla__slide" key={slot.position}>
              <PlaceholderImage slot={slot} />
            </div>
          ))}
        </div>
      </div>
      {slots.length > 1 && (
        <>
          <button type="button" className="slider-btn slider-btn--prev" aria-label="Previous slide" onClick={scrollPrev}>
            ‹
          </button>
          <button type="button" className="slider-btn slider-btn--next" aria-label="Next slide" onClick={scrollNext}>
            ›
          </button>
        </>
      )}
    </section>
  )
}
