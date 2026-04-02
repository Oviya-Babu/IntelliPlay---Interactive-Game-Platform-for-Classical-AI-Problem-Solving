import {
  ReactNode,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, modalPanelVariants } from '@/animations/variants'
import { cn } from '@/utils/cn'

/* ── Types ── */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  isOpen:          boolean
  onClose:         () => void
  title?:          string
  description?:    string
  children:        ReactNode
  footer?:         ReactNode
  size?:           ModalSize
  closeOnBackdrop?: boolean
  showCloseBtn?:   boolean
  className?:      string
}

const sizeWidths: Record<ModalSize, string> = {
  sm:   '400px',
  md:   '520px',
  lg:   '680px',
  xl:   '860px',
  full: 'calc(100vw - 48px)',
}

/* ── Focus trap ── */
const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

function trapFocus(container: HTMLElement) {
  const els = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (!els.length) return
  const first = els[0]
  const last  = els[els.length - 1]
  function handler(e: globalThis.KeyboardEvent) {
    if (e.key !== 'Tab') return
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault() }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }
  container.addEventListener('keydown', handler)
  first.focus()
  return () => container.removeEventListener('keydown', handler)
}

/* ── Component ── */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseBtn = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  /* Focus trap */
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const cleanup = trapFocus(panelRef.current)
      return cleanup
    }
  }, [isOpen])

  /* Escape key */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onKeyDown={handleKeyDown}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            key="panel"
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(className)}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: sizeWidths[size],
              maxHeight: 'calc(100vh - 96px)',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            {(title || showCloseBtn) && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div>
                  {title && (
                    <h2 id="modal-title" style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-desc" style={{
                      marginTop: 'var(--space-1)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-muted)',
                    }}>
                      {description}
                    </p>
                  )}
                </div>
                {showCloseBtn && (
                  <button
                    aria-label="Close modal"
                    onClick={onClose}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 18,
                      transition: `all var(--dur-fast)`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-surface-2)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div style={{ padding: 'var(--space-6)' }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Modal
