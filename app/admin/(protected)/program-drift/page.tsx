import { redirect } from 'next/navigation'

// Merged into the Accuracy hub (Stage 1). The tool now lives as a tab; this
// route stays alive so old links/bookmarks land on the right tab instead of 404.
export default function ProgramDriftPage() {
  redirect('/admin/accuracy?tab=program-drift')
}
