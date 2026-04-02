import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'

interface ConceptCardProps {
  gameId: string
  open: boolean
  onClose: () => void
}

const CARDS: Record<string, { title: string; fact: string }> = {
  tictactoe: {
    title: "Minimax powers real chess engines",
    fact: "Stockfish, the world's strongest chess engine, uses Minimax with alpha-beta at depth 30+ and evaluates over 70 million positions per second to find the best move."
  },
  eightpuzzle: {
    title: "A* guides Mars rovers",
    fact: "NASA uses A* variants to plan Mars rover paths across the terrain, balancing the cost of difficult terrain against the estimated distance remaining to the science target."
  },
  missionaries: {
    title: "BFS finds your LinkedIn connections",
    fact: "BFS powers the degrees-of-separation feature on LinkedIn — finding the shortest connection path between any two people in a network of 900 million users."
  },
  nqueens: {
    title: "CSP schedules airline crews",
    fact: "Airlines use constraint satisfaction to assign pilots to flights, satisfying hundreds of legal rest, qualification, and route constraints simultaneously across thousands of flights."
  },
  cryptarith: {
    title: "Constraint propagation plans factories",
    fact: "The same technique used here powers industrial planning systems that schedule production across thousands of machines, respecting capacity, tooling, and deadline constraints."
  }
}

export default function ConceptCard({ gameId, open, onClose }: ConceptCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const content = CARDS[gameId] || CARDS['tictactoe']

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="flex flex-col items-center gap-6"
          style={{ perspective: 1000 }}
        >
          {/* Card with 3D Flip */}
          <motion.div
            className="relative w-[320px] h-[400px] cursor-pointer"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 p-8 rounded-2xl flex flex-col items-center justify-center gap-6 text-center shadow-lg"
              style={{
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, var(--bg-surface-2) 0%, var(--bg-surface) 100%)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <div className="w-20 h-20 rounded-full border-[4px] border-accent flex items-center justify-center shadow-glow">
                <span className="text-4xl text-primary font-bold">💡</span>
              </div>
              <h2 className="text-2xl font-bold text-primary leading-tight">{content.title}</h2>
              <span className="text-sm font-bold text-accent uppercase tracking-widest animate-pulse">Click to flip</span>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center shadow-glow"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                border: '1px solid var(--accent-light)',
              }}
            >
              <h3 className="text-xl font-bold text-white mb-2">Did you know?</h3>
              <p className="text-white/90 text-[15px] leading-relaxed font-medium">
                {content.fact}
              </p>
            </div>
          </motion.div>

          {/* Dismiss Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button onClick={onClose} className="px-8 py-3 bg-white text-black hover:bg-gray-200" style={{ background: '#fff', color: '#000', borderRadius: '9999px', fontSize: '15px', fontWeight: 700 }}>
              Got it! See my results →
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
