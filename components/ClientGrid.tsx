import type { Client } from '@/lib/content'
import PlaceholderImage from './PlaceholderImage'

// Our Clients grid (FR-006): all clients in source order, name + placeholder
// logo slot (no logo binaries migrated).
export default function ClientGrid({ clients }: { clients: Client[] }) {
  return (
    <ul className="client-grid">
      {clients.map((client) => (
        <li key={client._id}>
          <figure>
            <PlaceholderImage slot={client.logoSlot} />
            <figcaption>{client.name}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
