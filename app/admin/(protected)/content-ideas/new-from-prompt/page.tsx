import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import IdeaFromPromptForm from '@/components/admin/IdeaFromPromptForm'

export const dynamic = 'force-dynamic'

export default function NewFromPromptPage() {
  return (
    <div>
      <PageHeader
        title="Draft a blog post from a prompt"
        description="Type 3-4 sentences describing the article you want. Claude will draft a title, pitch, excerpt, category, and (when relevant) primary program. After the idea is created, you can run the writer and quality checks from the content-ideas list."
      />

      <div style={{ marginBottom: '1rem' }}>
        <Link
          href="/admin/content-ideas"
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          ← Back to content ideas
        </Link>
      </div>

      <IdeaFromPromptForm />
    </div>
  )
}
