// Renders a Page.body plain-text string: first paragraph as the page heading
// (source shows "Studio Omri Meron" as an h1), the rest as paragraphs (FR-004).
// Bodies become portable text when the CMS lands; only this component changes.
export default function ProseBlock({ body }: { body: string }) {
  const [heading, ...paragraphs] = body.split('\n\n')
  return (
    <article className="prose">
      <h1>{heading}</h1>
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </article>
  )
}
