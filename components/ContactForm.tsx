'use client'

// No backend: submit opens the visitor's mail app pre-filled via mailto:
// (construct ported from meron4art, owner request 2026-07-18). Swap for a
// form service (Formspree/Resend) if real in-site sending is ever needed.
export function buildMailto(to: string, data: FormData): string {
  const subject = `Message from ${data.get('name')}`
  const body = `${data.get('name')} (${data.get('email')}${
    data.get('phone') ? `, ${data.get('phone')}` : ''
  })\n\n${data.get('message')}`
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export default function ContactForm({ to }: { to: string }) {
  return (
    <form
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault()
        window.location.href = buildMailto(to, new FormData(e.currentTarget))
      }}
    >
      <label>
        Name
        <input name="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Phone
        <input name="phone" type="tel" />
      </label>
      <label>
        Message
        <textarea name="message" required rows={5} />
      </label>
      <button type="submit">Send</button>
    </form>
  )
}
