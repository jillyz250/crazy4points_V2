'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'admin-sidebar-collapsed'

export default function SidebarShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  // Default: expanded. Hydrate from localStorage on mount.
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      // noop
    }
    setHydrated(true)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // noop
      }
      return next
    })
  }, [])

  // Prevent flash-on-hydrate by hiding until we've read storage
  return (
    <div
      className={`admin admin-shell${collapsed ? ' is-collapsed' : ''}`}
      style={hydrated ? undefined : { visibility: 'hidden' }}
    >
      <aside className="admin-sidebar">
        {sidebar}
        <button
          type="button"
          onClick={toggle}
          className="admin-sidebar-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>
        </button>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  )
}
