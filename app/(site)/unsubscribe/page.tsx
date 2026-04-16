import Link from 'next/link'

export const metadata = {
  title: 'Unsubscribe | crazy4points',
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const success = status === 'success'
  const error = status === 'error'

  return (
    <main className="rg-major-section">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto max-w-lg text-center">
          {success ? (
            <>
              <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
                You've been unsubscribed
              </h1>
              <p className="mt-4 font-body text-[var(--color-text-secondary)]">
                You won't receive any more emails from us. Changed your mind?
              </p>
              <Link href="/newsletter" className="rg-btn-primary mt-8 inline-block">
                Resubscribe
              </Link>
            </>
          ) : error ? (
            <>
              <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
                Something went wrong
              </h1>
              <p className="mt-4 font-body text-[var(--color-text-secondary)]">
                We couldn't process your unsubscribe request. Please try again or contact us.
              </p>
              <Link href="/" className="rg-btn-secondary mt-8 inline-block">
                Go Home
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">
                Unsubscribe
              </h1>
              <p className="mt-4 font-body text-[var(--color-text-secondary)]">
                Use the unsubscribe link in any email we've sent you to be removed from our list.
              </p>
              <Link href="/" className="rg-btn-secondary mt-8 inline-block">
                Go Home
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
