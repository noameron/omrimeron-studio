/**
 * Sanity Studio embedded at /studio via Next.js catch-all routing.
 * Requires Next 16+ (Sanity v5's Studio needs React 19.2, which older
 * Next versions' bundled React lacks).
 */

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

export const dynamic = 'force-static'

export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <NextStudio config={config} />
}
