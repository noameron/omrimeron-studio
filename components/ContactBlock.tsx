import type { SiteSettings } from '@/lib/content'

// Contact page content (FR-005): clickable phone and mailto (same address as
// text and target, owner decision 2026-07-11). Street address and map removed
// per owner request 2026-07-12. Details render as labelled rows inside a
// framed card (owner request 2026-07-12).
export default function ContactBlock({ contact }: { contact: SiteSettings['contact'] }) {
  return (
    <section className="contact-block">
      <dl className="contact-card">
        <div className="contact-card__row">
          <dt>Phone</dt>
          <dd>
            <a href={`tel:+${contact.phone.replace(/\D/g, '')}`}>{contact.phone}</a>
          </dd>
        </div>
        <div className="contact-card__row">
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </dd>
        </div>
      </dl>
    </section>
  )
}
