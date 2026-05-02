'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * Single document-level click listener. Two jobs:
 *
 * 1. Outbound clicks — any <a> whose hostname differs from the current
 *    site fires an `outbound_click` event with the destination URL +
 *    visible link text. Future affiliate links work automatically — no
 *    per-link wiring needed.
 *
 * 2. Tagged internal clicks — any <a> with `data-track-event="..."`
 *    fires that custom event. Optional `data-track-params` is parsed as
 *    JSON and passed through. Lets server-rendered components opt into
 *    analytics without becoming client components.
 *
 * Mount once at the (site) layout level. Capture-phase listener so it
 * runs before Next.js intercepts internal navigation.
 */
export default function AnalyticsListener() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return
      const link = target.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href) return

      // Tagged internal event takes precedence.
      const explicitEvent = link.getAttribute('data-track-event')
      if (explicitEvent) {
        let params: Record<string, unknown> | undefined
        const raw = link.getAttribute('data-track-params')
        if (raw) {
          try {
            params = JSON.parse(raw) as Record<string, unknown>
          } catch {
            // Bad JSON shouldn't break navigation — just drop the params.
          }
        }
        track(explicitEvent, params)
        return
      }

      // Outbound detection.
      try {
        const url = new URL(href, window.location.origin)
        if (url.hostname && url.hostname !== window.location.hostname) {
          track('outbound_click', {
            url: url.href,
            host: url.hostname,
            link_text: link.textContent?.trim().slice(0, 80) ?? '',
          })
        }
      } catch {
        // Malformed href — ignore.
      }
    }
    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return null
}
