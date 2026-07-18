'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageSlot } from '@/lib/content'
import PlaceholderImage from './PlaceholderImage'

// Category gallery (owner request 2026-07-18, construct ported from
// meron4art's GalleryGrid): a paged thumbnail grid; clicking a thumbnail
// opens a fullscreen lightbox with zoom (toolbar toggle or click-to-zoom at
// the clicked point, drag to pan while zoomed), prev/next arrows, keyboard
// and swipe navigation, and an "N / total" counter. The counter and the
// arrows span the WHOLE gallery, not just the visible grid page; the grid
// pagination only paces browsing.
export const PAGE_SIZE = 12
const SWIPE_THRESHOLD_PX = 40

// Lightbox toolbar icons: thin line icons drawn in currentColor.
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}
const ZoomIcon = () => (
  <svg {...iconProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
  </svg>
)
const FullscreenIcon = () => (
  <svg {...iconProps}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)
const CloseIcon = () => (
  <svg {...iconProps}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
const ArrowIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg {...iconProps} width={28} height={28}>
    {dir === 'left' ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
  </svg>
)
const FirstPageIcon = () => (
  <svg {...iconProps}>
    <path d="M18 5v14M13 5l-7 7 7 7" />
  </svg>
)
const LastPageIcon = () => (
  <svg {...iconProps}>
    <path d="M6 5v14M11 5l7 7-7 7" />
  </svg>
)

function fullUrl(slot: ImageSlot) {
  return `${slot.url}?w=2400&fit=max&auto=format`
}

export default function GalleryGrid({ slots, galleryName }: { slots: ImageSlot[]; galleryName: string }) {
  // index into the FULL slots list of the image open in the lightbox
  // (null = closed)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [zoomed, setZoomed] = useState(false)
  // current grid page (0-indexed)
  const [page, setPage] = useState(0)
  const lightboxRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // pan container/image + transient pan state, kept in refs and applied via
  // GPU transform imperatively so dragging never triggers a React re-render
  const panRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const pan = useRef({ x: 0, y: 0 })
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, px: 0, py: 0 })
  // fractional point (0..1) within the image that the next zoom-in should
  // center on; null means center on the image's own center
  const zoomOrigin = useRef<{ fx: number; fy: number } | null>(null)

  // move the image to (x,y), clamped so it can't be dragged past its edges
  const applyPan = useCallback((x: number, y: number) => {
    const el = panRef.current
    const img = imgRef.current
    if (!el || !img) return
    const maxX = Math.max(0, (img.offsetWidth - el.clientWidth) / 2)
    const maxY = Math.max(0, (img.offsetHeight - el.clientHeight) / 2)
    const cx = Math.min(maxX, Math.max(-maxX, x))
    const cy = Math.min(maxY, Math.max(-maxY, y))
    pan.current = { x: cx, y: cy }
    img.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
  }, [])

  // zoom out to the fitted view (toolbar button, or a click while zoomed);
  // resets the imperative pan transform too, so it doesn't carry over
  const zoomOut = useCallback(() => {
    zoomOrigin.current = null
    applyPan(0, 0)
    setZoomed(false)
  }, [applyPan])

  // toolbar zoom button toggles without a click point, so it always
  // zooms in centered
  const toggleZoom = useCallback(() => {
    zoomOrigin.current = null
    applyPan(0, 0)
    setZoomed((z) => !z)
  }, [applyPan])

  // zoom in centered on the point the user clicked, in image-local
  // fractional coordinates (0..1), so the clicked spot ends up centered
  const zoomInAt = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current
    if (img) {
      const rect = img.getBoundingClientRect()
      zoomOrigin.current = {
        fx: (clientX - rect.left) / rect.width,
        fy: (clientY - rect.top) / rect.height,
      }
    }
    setZoomed(true)
  }, [])

  // once the zoomed (native-size) image has laid out, pan so the clicked
  // point (or the image center, for a toolbar-triggered zoom) is centered
  useEffect(() => {
    if (!zoomed) return
    const img = imgRef.current
    const origin = zoomOrigin.current
    zoomOrigin.current = null
    if (!img || !origin) {
      applyPan(0, 0)
      return
    }
    const px = origin.fx * img.naturalWidth
    const py = origin.fy * img.naturalHeight
    applyPan(img.naturalWidth / 2 - px, img.naturalHeight / 2 - py)
  }, [zoomed, applyPan])

  const pageCount = Math.max(1, Math.ceil(slots.length / PAGE_SIZE))
  // clamp defensively in case `slots` shrinks between renders
  const safePage = Math.min(page, pageCount - 1)
  const pageSlots = slots.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const goToPage = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), pageCount - 1)
      if (clamped === safePage) return
      setPage(clamped)
      gridRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    },
    [pageCount, safePage],
  )

  // step through the lightbox, wrapping around the ends of the whole gallery
  const step = useCallback(
    (delta: number) => setLightbox((i) => (i === null ? i : (i + delta + slots.length) % slots.length)),
    [slots.length],
  )

  // reset zoom + pan whenever the shown image changes (open, close, or step)
  useEffect(() => {
    setZoomed(false)
    zoomOrigin.current = null
    applyPan(0, 0)
  }, [lightbox, applyPan])

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    // drop focus from the trigger so its focus ring (painted after a
    // keyboard Esc) doesn't linger over the thumbnail
    ;(document.activeElement as HTMLElement | null)?.blur()
    setLightbox(null)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else lightboxRef.current?.requestFullscreen?.().catch(() => {})
  }, [])

  const open = lightbox !== null

  // arrow keys navigate, Esc closes (a plain overlay, not native <dialog>);
  // background scroll stays locked while the lightbox is open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, step, close])

  if (slots.length === 0) {
    // Spec edge case: empty gallery renders an empty state, never a broken grid.
    return (
      <p className="gallery-empty" role="status">
        No images in this gallery yet.
      </p>
    )
  }

  const current = lightbox !== null ? slots[lightbox] : null

  return (
    <section className="gallery-page" aria-label={`${galleryName} gallery`}>
      <div className="gallery-grid" ref={gridRef}>
        {pageSlots.map((slot, i) => {
          const index = safePage * PAGE_SIZE + i
          return (
            <button
              key={slot.position}
              type="button"
              className="gallery-grid__item"
              aria-label={slot.alt || `View image ${index + 1}`}
              onClick={() => setLightbox(index)}
            >
              {slot.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="gallery-grid__thumb"
                  src={`${slot.url}?w=800&h=600&fit=crop&auto=format`}
                  alt={slot.alt}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  data-source-ref={slot.sourceRef}
                  draggable={false}
                />
              ) : (
                <PlaceholderImage slot={slot} />
              )}
            </button>
          )
        })}
      </div>

      {pageCount > 1 && (
        <div className="gallery-pagination">
          <button type="button" aria-label="First page" disabled={safePage === 0} onClick={() => goToPage(0)}>
            <FirstPageIcon />
          </button>
          <button type="button" aria-label="Previous page" disabled={safePage === 0} onClick={() => goToPage(safePage - 1)}>
            <ArrowIcon dir="left" />
          </button>
          <span className="gallery-pagination__status">
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={safePage === pageCount - 1}
            onClick={() => goToPage(safePage + 1)}
          >
            <ArrowIcon dir="right" />
          </button>
          <button
            type="button"
            aria-label="Last page"
            disabled={safePage === pageCount - 1}
            onClick={() => goToPage(pageCount - 1)}
          >
            <LastPageIcon />
          </button>
        </div>
      )}

      {current && lightbox !== null && (
        <div ref={lightboxRef} role="dialog" aria-modal="true" onClick={close} className="lightbox">
          {/* counter over the whole gallery, top-left */}
          <span className="lightbox__counter">
            {lightbox + 1} / {slots.length}
          </span>

          {/* toolbar, top-right: zoom, full screen, close */}
          <div className="lightbox__toolbar">
            {current.url && (
              <button
                type="button"
                aria-label="Toggle zoom"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleZoom()
                }}
              >
                <ZoomIcon />
              </button>
            )}
            <button
              type="button"
              aria-label="Toggle full screen"
              onClick={(e) => {
                e.stopPropagation()
                toggleFullscreen()
              }}
            >
              <FullscreenIcon />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* prev / next arrows on the sides */}
          <button
            type="button"
            aria-label="Previous image"
            className="lightbox__nav lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
          >
            <ArrowIcon dir="left" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="lightbox__nav lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
          >
            <ArrowIcon dir="right" />
          </button>

          {/* image stage; a plain tap zooms in (centered on the tapped point)
              or, if already zoomed, zooms back out. Prev/next is only ever
              triggered by the arrow buttons, arrow keys or a swipe, never a
              tap on the image. When zoomed, dragging pans. A real drag (past
              the 3px jitter guard) suppresses the tap action. */}
          <div
            ref={panRef}
            className={zoomed ? 'lightbox__stage lightbox__stage--zoomed' : 'lightbox__stage'}
            onClick={(e) => {
              // stop the backdrop's click-to-close from firing for clicks
              // that originate on this container (drag-end clicks included)
              e.stopPropagation()
              if (drag.current.moved) return
              if (zoomed) {
                zoomOut()
                return
              }
              // the stage spans the full area between the arrows, so a click
              // can land on the letterboxed background rather than the image
              // itself: treat that as a backdrop click (close). Checked via
              // coordinates, not e.target, because pointer capture retargets
              // clicks to this container.
              const imgRect = imgRef.current?.getBoundingClientRect()
              const onImage =
                imgRect &&
                e.clientX >= imgRect.left &&
                e.clientX <= imgRect.right &&
                e.clientY >= imgRect.top &&
                e.clientY <= imgRect.bottom
              if (!onImage) {
                close()
                return
              }
              zoomInAt(e.clientX, e.clientY)
            }}
            onPointerDown={(e) => {
              if (!panRef.current) return
              drag.current = {
                active: true,
                moved: false,
                x: e.clientX,
                y: e.clientY,
                px: pan.current.x,
                py: pan.current.y,
              }
              panRef.current.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (!drag.current.active) return
              const dx = e.clientX - drag.current.x
              const dy = e.clientY - drag.current.y
              if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true
              if (zoomed) applyPan(drag.current.px + dx, drag.current.py + dy)
            }}
            onPointerUp={(e) => {
              if (!zoomed && drag.current.active) {
                const dx = e.clientX - drag.current.x
                if (Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
                  if (dx < 0) step(1)
                  else step(-1)
                }
              }
              drag.current.active = false
            }}
          >
            {current.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={fullUrl(current)}
                alt={current.alt}
                draggable={false}
                data-source-ref={current.sourceRef}
                className={zoomed ? 'lightbox__img lightbox__img--zoomed' : 'lightbox__img'}
              />
            ) : (
              <PlaceholderImage slot={current} />
            )}
          </div>
        </div>
      )}
    </section>
  )
}
