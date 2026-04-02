import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

/* ── Types ── */
export type BadgeVariant =
  | 'accent'
  | 'success'
  | 'warn'
  | 'danger'
  | 'gold'
  | 'muted'
  | 'outline'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?:    'sm' | 'md'
  dot?:     boolean
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  accent:  { background: 'var(--accent-glow)',  color: 'var(--accent-light)',  border: '1px solid var(--accent)' },
  success: { background: '#10b98120',            color: 'var(--success)',        border: '1px solid var(--success)' },
  warn:    { background: '#f59e0b20',            color: 'var(--gold)',           border: '1px solid var(--gold)' },
  danger:  { background: '#ef444420',            color: 'var(--danger)',         border: '1px solid var(--danger)' },
  gold:    { background: '#f59e0b20',            color: 'var(--gold-light)',     border: '1px solid var(--gold)' },
  muted:   { background: 'var(--bg-surface-2)',  color: 'var(--text-muted)',     border: '1px solid var(--border-subtle)' },
  outline: { background: 'transparent',          color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
}

const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
  sm: { fontSize: 'var(--text-xs)', padding: '2px 8px' },
  md: { fontSize: 'var(--text-xs)', padding: '4px 10px' },
}

export function Badge({
  variant = 'accent',
  size = 'md',
  dot = false,
  children,
  className,
  style,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-medium', className)}
      style={{
        borderRadius: 'var(--radius-full)',
        letterSpacing: '0.02em',
        lineHeight: 1.4,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
