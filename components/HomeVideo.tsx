'use client'

import { useEffect, useRef } from 'react'

// Fullscreen silent background video for the home page. Muted is re-applied
// via the DOM property on mount: React does not reliably serialize the
// `muted` attribute into server-rendered HTML, and browsers refuse to
// autoplay a video they consider unmuted.
export default function HomeVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = true
    // play() can reject (e.g. data-saver or low-power mode); the video then
    // simply sits on its first frame.
    video.play().catch(() => {})
  }, [])

  return (
    <section className="home-video" aria-label="Behind the scenes video">
      <video ref={ref} src={src} autoPlay muted loop playsInline preload="auto" />
    </section>
  )
}
