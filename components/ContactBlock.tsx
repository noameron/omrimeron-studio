import type { SiteSettings } from '@/lib/content'

// Contact page content (FR-005): address, phone, clickable mailto (same
// address as text and target, owner decision 2026-07-11), embedded map.
export default function ContactBlock({ contact }: { contact: SiteSettings['contact'] }) {
  return (
    <section className="contact-block">
      <p>{contact.address}</p>
      <p>
        <a href={`tel:+${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</a>
      </p>
      <p>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>
      <iframe src={contact.mapEmbedUrl} title="Studio location map" loading="lazy" allowFullScreen />
    </section>
  )
}
