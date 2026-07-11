import Link from 'next/link'

// Rendered inside the root layout, so the site header stays visible and
// navigation remains usable (contracts/routes.md, non-routes).
export default function NotFound() {
  return (
    <div className="not-found">
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist. <Link href="/">Back to the portfolio</Link>.
      </p>
    </div>
  )
}
