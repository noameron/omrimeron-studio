import type { ImageSlot } from '@/lib/content'

// A gallery image slot: renders the real image when the slot carries a URL
// (Sanity-managed media), otherwise a neutral CSS-only placeholder (FR-003,
// SC-006). data-source-ref keeps the durable link to the source media.
export default function PlaceholderImage({ slot }: { slot: ImageSlot }) {
  if (slot.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="slot-image"
        src={`${slot.url}?w=2400&fit=max&auto=format`}
        alt={slot.alt}
        width={slot.width}
        height={slot.height}
        data-source-ref={slot.sourceRef}
        loading={slot.position === 0 ? 'eager' : 'lazy'}
      />
    )
  }
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
