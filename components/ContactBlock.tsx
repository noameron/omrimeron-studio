import type { SiteSettings } from '@/lib/content'
import ContactForm from './ContactForm'

// Contact page content (FR-005), reworked to the meron4art construct (owner
// request 2026-07-18): a details column (name, clickable mailto and tel links)
// beside a mailto contact form.
export default function ContactBlock({ title, contact }: { title: string; contact: SiteSettings['contact'] }) {
  return (
    <section className="contact-block">
      <div className="contact-details">
        <h2>Contact details</h2>
        <span className="contact-details__name">{title}</span>
        <a href={`mailto:${contact.email}`} aria-label="Email">
          {contact.email}
        </a>
        <a href={`tel:+${contact.phone.replace(/\D/g, '')}`} aria-label="Phone">
          {contact.phone}
        </a>
      </div>
      <ContactForm to={contact.email} />
    </section>
  )
}
