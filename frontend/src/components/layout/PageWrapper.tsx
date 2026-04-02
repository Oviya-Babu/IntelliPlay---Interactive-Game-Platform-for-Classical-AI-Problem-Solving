import { motion } from 'framer-motion'
import { ReactNode } from 'react'

const variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.22 } },
}

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: 'calc(100vh - 60px)' }}
    >
      {children}
    </motion.div>
  )
}
