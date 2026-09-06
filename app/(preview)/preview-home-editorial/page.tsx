import type { Metadata } from 'next'
import PreviewHomeMock from '@/components/preview/PreviewHomeMock'
export const metadata: Metadata = { title: 'Homepage v2 — Editorial (preview)', robots: { index: false } }
export default function Page() { return <PreviewHomeMock variant="editorial" /> }
