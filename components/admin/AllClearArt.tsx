import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * AllClearArt — a small "all caught up" illustration for admin empty states
 * (Devon, 2026-09-03). Renders public/team/all-clear.png (empty tray + green
 * check + plant) centered above whatever empty-state text the caller already
 * shows, so a cleared queue feels intentional rather than blank.
 *
 * Server component — it does the existsSync check itself (same graceful-fallback
 * pattern as the Breakroom hero / Ideas box art), so callers don't repeat it. If
 * the file is absent it renders nothing and the caller's existing text stands on
 * its own. Client empty states (MyTasks, IdeasBox) can't call node:fs, so their
 * server parent passes <AllClearArt /> in as a prop.
 */
export default function AllClearArt({ size = 72 }: { size?: number }) {
  const hasArt = existsSync(join(process.cwd(), 'public', 'team', 'all-clear.png'))
  if (!hasArt) return null
  return (
    <span
      className="ac-art"
      style={{ display: 'block', width: size, height: size, margin: '0 auto', position: 'relative' }}
    >
      <Image
        src="/team/all-clear.png"
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        style={{ objectFit: 'contain', display: 'block', width: '100%', height: '100%' }}
      />
    </span>
  )
}
