import {
  ReactNode,
  useState,
  useRef,
  useId,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tooltipVariants } from '@/animations/variants'
import { cn } from '@/utils/cn'

/* ── Types ── */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content:    ReactNode
  children:   ReactNode
  placement?: TooltipPlacement
  delay?:     number
  maxWidth?:  number
  disabled?:  boolean
  className?: string
}

/* ── Placement → transform origin + offset ── */
const placementStyles: Record<
  TooltipPlacement,
  { position: React.CSSProperties; transformOrigin: string }
> = {
  top: {
    position: {
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    transformOrigin: 'bottom center',
  },
  bottom: {
    position: {
      top: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    transformOrigin: 'top center',
  },
  left: {
    position: {
      right: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    transformOrigin: 'right center',
  },
  right: {
    position: {
      left: 'calc(100% + 8px)',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    transformOrigin: 'left center',
  },
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 300,
  maxWidth = 220,
  disabled = false,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()

  const show = () => {
    if (disabled) return
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  const { position, transformOrigin } = placementStyles[placement]

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={visible ? id : undefined}
    >
      {children}

      <AnimatePresence>
        {visible && (
          <motion.div
            id={id}
            role="tooltip"
            key="tooltip"
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(className)}
            style={{
              position: 'absolute',
              zIndex: 9999,
              maxWidth,
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-3)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.5,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-md)',
              transformOrigin,
              ...position,
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

export default Tooltip
