import { motion, Variants } from 'framer-motion'

/* ─────────────────────────────────────────────
   Page-level transitions (used by PageWrapper)
───────────────────────────────────────────── */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
}

/* ─────────────────────────────────────────────
   Card enter (used in grids / lists)
───────────────────────────────────────────── */
export const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

/* ─────────────────────────────────────────────
   Stagger container (wrap a list in this)
───────────────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
}

/* ─────────────────────────────────────────────
   Modal backdrop + panel
───────────────────────────────────────────── */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.18 } },
}

export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.18 },
  },
}

/* ─────────────────────────────────────────────
   Slide-up item (fadeIn + slideUp combined)
───────────────────────────────────────────── */
export const slideUpItem: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 26 },
  },
}

/* ─────────────────────────────────────────────
   Tooltip fade
───────────────────────────────────────────── */
export const tooltipVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.9, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.1 } },
}

/* ─────────────────────────────────────────────
   Star pop (used on ResultPage)
───────────────────────────────────────────── */
export const starVariants: Variants = {
  empty:  { scale: 1, opacity: 0.3 },
  filled: {
    scale: [1, 1.4, 1],
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
}

/* ─────────────────────────────────────────────
   AI step slide-in (AIThinkingPanel rows)
───────────────────────────────────────────── */
export const stepRowVariants: Variants = {
  hidden:  { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
}

/* ─────────────────────────────────────────────
   Error shake (invalid move feedback)
───────────────────────────────────────────── */
export const errorShake: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
}

/* Re-export motion so consumers don't need to import framer-motion directly */
export { motion }
