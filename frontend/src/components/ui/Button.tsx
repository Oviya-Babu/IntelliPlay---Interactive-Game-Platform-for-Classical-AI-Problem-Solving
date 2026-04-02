import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

/* ── Types ── */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  isLoading?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

/* ── Base styles ── */
const base = [
  'inline-flex items-center justify-center gap-2',
  'font-medium rounded-md border transition-all',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'disabled:opacity-40 disabled:cursor-not-allowed',
  'select-none cursor-pointer',
].join(' ')

/* ── Variant styles (inline CSS vars — no Tailwind colour classes so tokens apply) ── */
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    borderColor: 'transparent',
    color: '#fff',
  },
  secondary: {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  },
  ghost: {
    background: 'transparent',
    borderColor: 'transparent',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'var(--danger)',
    borderColor: 'transparent',
    color: '#fff',
  },
  gold: {
    background: 'var(--gold)',
    borderColor: 'transparent',
    color: '#000',
  },
}

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: 'var(--accent-hover)' },
  secondary: { background: 'var(--bg-surface-3)', borderColor: 'var(--border-strong)' },
  ghost:     { background: 'var(--bg-surface-2)', color: 'var(--text-primary)' },
  danger:    { filter: 'brightness(1.12)' },
  gold:      { filter: 'brightness(1.08)' },
}

/* ── Size padding/font ── */
const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

/* ── Spinner ── */
function Spinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 12 : size === 'md' ? 14 : 16
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

/* ── Component ── */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      style,
      className,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(base, sizeClass[size], fullWidth && 'w-full', className)}
        style={{
          ...variantStyles[variant],
          transition: `all var(--dur-base) var(--ease-smooth)`,
          ...style,
        }}
        onMouseEnter={e => {
          const t = e.currentTarget
          Object.assign(t.style, hoverStyles[variant])
          onMouseEnter?.(e)
        }}
        onMouseLeave={e => {
          const t = e.currentTarget
          Object.assign(t.style, variantStyles[variant])
          onMouseLeave?.(e)
        }}
        {...rest}
      >
        {isLoading ? (
          <Spinner size={size} />
        ) : (
          leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span style={{ display: 'flex' }}>{rightIcon}</span>
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

export default Button
export { Button }
