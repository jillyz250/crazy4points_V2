'use client'

/**
 * Manual markdown input — supports BOTH:
 *   1. Pasting markdown directly into the textarea
 *   2. Uploading .md / .txt / .json files (e.g. Firecrawl playground downloads)
 *
 * File uploads are concatenated into the textarea with section separators
 * so the editor can see/edit before submitting. The textarea owns the form
 * value via name="manual_markdown"; the file input is UI sugar.
 *
 * JSON uploads from the Firecrawl playground are unwrapped: if the file
 * parses as JSON and contains data.markdown (Firecrawl's response shape),
 * we use that. Otherwise the raw file text is used.
 */

import { useState, useRef } from 'react'

export default function ManualMarkdownInput() {
  const [value, setValue] = useState('')
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function readFile(file: File): Promise<string> {
    const text = await file.text()
    // Try JSON shape (Firecrawl playground "Download JSON" produces this)
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text)
        const md =
          parsed?.data?.markdown ??
          parsed?.markdown ??
          parsed?.data?.content ??
          null
        if (typeof md === 'string' && md.length > 0) return md
      } catch {
        // Fall through to raw text
      }
    }
    return text
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadStatus(`Reading ${files.length} file${files.length === 1 ? '' : 's'}…`)
    const parts: string[] = []
    for (const file of Array.from(files)) {
      const content = await readFile(file)
      parts.push(`=== ${file.name} ===\n\n${content.trim()}`)
    }
    // Append to existing value (don't blow away anything the editor already typed)
    const newValue = value.trim()
      ? `${value.trim()}\n\n${parts.join('\n\n---\n\n')}`
      : parts.join('\n\n---\n\n')
    setValue(newValue)
    setUploadStatus(`✓ Loaded ${files.length} file${files.length === 1 ? '' : 's'} (${parts.reduce((s, p) => s + p.length, 0).toLocaleString()} chars)`)
    setTimeout(() => setUploadStatus(null), 4000)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="cursor-pointer rounded-[var(--radius-ui)] border border-red-300 bg-white px-3 py-1.5 font-ui text-xs font-semibold uppercase tracking-wide text-red-900 hover:bg-red-50"
        >
          📁 Upload markdown files
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.json,text/markdown,text/plain,application/json"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        <span className="font-body text-[11px] text-red-800">
          .md / .txt / .json (Firecrawl JSON downloads are unwrapped automatically). Append-mode: uploads merge with what&apos;s already in the box.
        </span>
        {uploadStatus ? (
          <span className="font-ui text-[11px] font-semibold text-emerald-700">{uploadStatus}</span>
        ) : null}
      </div>
      <textarea
        name="manual_markdown"
        rows={8}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste combined markdown here, or use the Upload button above. Pipeline will skip Firecrawl when this field is filled."
        className="rounded-[var(--radius-ui)] border border-red-300 bg-white px-3 py-1.5 font-mono"
        style={{ fontSize: '0.75rem', resize: 'vertical' }}
      />
      {value.length > 0 ? (
        <div className="flex items-center justify-between">
          <span className="font-ui text-[11px] text-red-700">
            {value.length.toLocaleString()} chars loaded
          </span>
          <button
            type="button"
            onClick={() => {
              setValue('')
              setUploadStatus(null)
            }}
            className="font-ui text-[11px] uppercase tracking-wide text-red-700 hover:text-red-900"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  )
}
