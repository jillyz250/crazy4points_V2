import Link from 'next/link'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

function classFor(variant: Variant, size: Size, extra?: string): string {
  const variantClass =
    variant === 'primary' ? 'admin-btn-primary'
    : variant === 'secondary' ? 'admin-btn-secondary'
    : variant === 'danger' ? 'admin-btn-danger'
    : 'admin-btn-ghost'
  const sizeClass = size === 'sm' ? 'admin-btn-sm' : ''
  return ['admin-btn', variantClass, sizeClass, extra].filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={classFor(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function LinkButton({ href, variant = 'secondary', size = 'md', className, children, ...rest }: LinkButtonProps) {
  return (
    <Link href={href} className={classFor(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}
