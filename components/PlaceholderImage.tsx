import type { ImageSlot } from '@/lib/content'

// Neutral CSS-only stand-in for a source image (FR-003, SC-006): no binary
// assets; data-source-ref keeps the durable link to the WP attachment so
// real media can be attached later.
export default function PlaceholderImage({ slot }: { slot: ImageSlot }) {
  const aspectRatio = slot.width && slot.height ? `${slot.width} / ${slot.height}` : undefined
  return (
    <div
      className={aspectRatio ? 'placeholder-image' : 'placeholder-image placeholder-image--no-dims'}
      data-source-ref={slot.sourceRef}
      style={{ aspectRatio }}
      role="img"
      aria-label={slot.alt}
    >
      <span className="placeholder-image__label">{slot.alt}</span>
    </div>
  )
}
