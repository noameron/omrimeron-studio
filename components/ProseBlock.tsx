import type { ImageSlot } from '@/lib/content'

// Renders a Page.body plain-text string: first paragraph as the body heading
// (an h2: since 2026-07-18 the route renders the tab name as the page h1),
// the rest as paragraphs (FR-004).
// An optional backoffice-managed image renders centered above the heading.
// dir="ltr" pins the English copy left-to-right regardless of any inherited
// direction. Bodies become portable text when the CMS lands.
export default function ProseBlock({ body, image }: { body: string; image?: ImageSlot | null }) {
  const [heading, ...paragraphs] = body.split('\n\n')
  return (
    <article className="prose" dir="ltr">
      {image?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="prose__image"
          src={`${image.url}?w=1600&fit=max&auto=format`}
          alt={image.alt}
          width={image.width}
          height={image.height}
        />
      )}
      <h2>{heading}</h2>
      <p className="prose__link-line">
        Also in{' '}
        <a href="https://www.meron4art.co.il" target="_blank" rel="noopener noreferrer">
          meron4art
        </a>
      </p>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </article>
  )
}
