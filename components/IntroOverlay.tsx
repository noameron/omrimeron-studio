'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { INTRO_SEEN_KEY } from './introSeen'

// how long the centered logo sits on the blank page before flying
const HOLD_MS = 2000
// duration of the fly-to-header move (the logo twist runs the same length)
const FLY_MS = 900
// quick fade used when the visitor clicks to skip
const SKIP_FADE_MS = 250

type Phase = 'hold' | 'fly' | 'skip' | 'done'

// Full-screen white intro shown once per browser session on first entry
// (construct ported from meron4art's IntroOverlay, owner request 2026-07-18):
// the studio logo starts centered, then flies onto the header's real logo
// while twisting and the white backdrop fades out. The logo image carries the
// wordmark itself, so no headline text accompanies it. Any click, or Escape,
// skips. Never plays over the Sanity Studio routes.
export default function IntroOverlay() {
  const [phase, setPhase] = useState<Phase>('hold')
  const [flyTransform, setFlyTransform] = useState('')
  const groupRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio') ?? false

  const markSeen = () => {
    // the html flag lets the globals.css rule hide any future render of the
    // overlay instantly (full page loads read it pre-hydration in layout.tsx)
    document.documentElement.dataset.introSeen = '1'
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* private-mode storage errors just mean the intro replays */
    }
  }

  const skip = useCallback(() => {
    setPhase((p) => {
      if (p === 'skip' || p === 'done') return p
      markSeen()
      timers.current.push(window.setTimeout(() => setPhase('done'), SKIP_FADE_MS))
      return 'skip'
    })
  }, [])

  const fly = useCallback(() => {
    const group = groupRef.current
    // the header logo; the rect check skips it while hidden or off-screen
    const target = Array.from(document.querySelectorAll<HTMLElement>('[data-intro-brand] img')).find((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.right > 0 && r.left < window.innerWidth
    })
    if (!group || !target) {
      skip()
      return
    }
    // FLIP: scale the centered logo down to the header logo's height and
    // translate so their centers coincide. The group transforms about its own
    // center, which the scale leaves in place, so a plain center-to-center
    // delta is exact.
    const g = group.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    const s = tr.height / g.height
    const dx = tr.left + tr.width / 2 - (g.left + g.width / 2)
    const dy = tr.top + tr.height / 2 - (g.top + g.height / 2)
    setFlyTransform(`translate(${dx}px, ${dy}px) scale(${s})`)
    setPhase('fly')
    timers.current.push(
      window.setTimeout(() => {
        markSeen()
        setPhase('done')
      }, FLY_MS + 100),
    )
  }, [skip])

  useEffect(() => {
    if (isStudio) {
      // don't mark seen: entering the public site later should still play
      setPhase('done')
      return
    }
    const pending = timers.current
    try {
      if (sessionStorage.getItem(INTRO_SEEN_KEY)) {
        setPhase('done')
        return
      }
    } catch {
      /* storage unavailable: play the intro anyway */
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    pending.push(window.setTimeout(reduced ? skip : fly, reduced ? 900 : HOLD_MS))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      pending.forEach(clearTimeout)
      window.removeEventListener('keydown', onKey)
    }
  }, [isStudio, fly, skip])

  // lock scrolling underneath while the intro is covering the page
  useEffect(() => {
    if (phase === 'done') return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      // the id is targeted by the globals.css rule that hides repeat views
      id="intro-overlay"
      // aria-hidden: purely decorative duplicate of the header logo; the
      // real page stays available to assistive tech the whole time
      aria-hidden
      onClick={skip}
      className={phase === 'skip' ? 'intro-overlay intro-overlay--skip' : 'intro-overlay'}
      style={{ transitionDuration: `${SKIP_FADE_MS}ms` }}
    >
      {/* white backdrop fades separately so the site is revealed while the
          logo is still mid-flight toward the header */}
      <div className={phase === 'fly' ? 'intro-overlay__backdrop intro-overlay__backdrop--fade' : 'intro-overlay__backdrop'} />
      {/* the transition lives on this element from first render, and only
          the transform/opacity VALUES change when the fly starts — a CSS
          animation on the same element would stop the transition from
          running, which is why the twist lives on the inner wrapper.
          perspective gives the rotateY twist real depth */}
      <div
        ref={groupRef}
        className="intro-overlay__group"
        style={{
          perspective: '800px',
          transition: `transform ${FLY_MS}ms cubic-bezier(0.65, 0, 0.35, 1), opacity 350ms ease ${FLY_MS - 350}ms`,
          ...(phase === 'fly' ? { transform: flyTransform, opacity: 0 } : undefined),
        }}
      >
        <div className={phase === 'hold' ? 'intro-fade-in' : phase === 'fly' ? 'intro-twist' : undefined}>
          <Image src="/brand/logo.jpg" alt="" width={362} height={164} priority className="intro-overlay__logo" />
        </div>
      </div>
    </div>
  )
}
