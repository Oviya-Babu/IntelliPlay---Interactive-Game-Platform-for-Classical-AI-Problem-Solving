import { HTMLAttributes, ReactNode, forwardRef, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/utils/cn'

/* ── Types ── */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  glowing?:   boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '0',
  sm:   'var(--space-4)',
  md:   'var(--space-6)',
  lg:   'var(--space-8)',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = false,
      glowing = false,
      padding = 'md',
      className,
      style,
      onMouseEnter,
      onMouseLeave,
      ...rest
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <div
        ref={ref}
        className={cn(className)}
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${isHovered && hoverable ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: paddingMap[padding],
          boxShadow: isHovered && hoverable
            ? glowing
              ? 'var(--shadow-glow), var(--shadow-md)'
              : 'var(--shadow-md)'
            : 'var(--shadow-sm)',
          transform: isHovered && hoverable ? 'translateY(-2px)' : 'translateY(0)',
          transition: `all var(--dur-base) var(--ease-smooth)`,
          cursor: hoverable ? 'pointer' : 'default',
          ...style,
        }}
        onMouseEnter={e => { setIsHovered(true); onMouseEnter?.(e) }}
        onMouseLeave={e => { setIsHovered(false); onMouseLeave?.(e) }}
        {...rest}
      >
        {children}
      </div>
    )
  },
)
Card.displayName = 'Card'

/* ── Animated variant (wraps with Framer Motion for list stagger) ── */
export interface AnimatedCardProps extends CardProps {
  variants?: Variants
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ variants, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate="visible"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <Card {...props} />
    </motion.div>
  ),
)
AnimatedCard.displayName = 'AnimatedCard'

export default Card
