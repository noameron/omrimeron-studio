'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'
import type { ImageSlot } from '@/lib/content'
import PlaceholderImage from './PlaceholderImage'

// Fullscreen looping slider (FR-002): one slide per ImageSlot, wrap-around
// via Embla's loop. No autoplay: slides advance only via the arrow controls
// (owner decision 2026-07-12, overriding the source's autoplay setting).
export default function FullscreenSlider({
  slots,
  galleryName,
}: {
  slots: ImageSlot[]
  galleryName: string
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

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
