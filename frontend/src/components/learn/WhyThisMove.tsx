import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WhyThisMoveProps {
  currentStep: Record<string, any> | null
}

export default function WhyThisMove({ currentStep }: WhyThisMoveProps) {
  const [expanded, setExpanded] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Auto-expand on first AI step
  useEffect(() => {
    if (currentStep && !hasStarted) {
      setHasStarted(true)
      setExpanded(true)
    }
  }, [currentStep, hasStarted])

  if (!currentStep) return null

  const s = currentStep

  return (
    <div className="w-full mt-2 rounded-lg border border-subtle bg-surface-2 overflow-hidden shadow-sm">
      <div 
        className="w-full px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-surface-3 transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">🧠</span>
          <span className="font-bold text-sm text-primary">Why this move?</span>
        </div>
        <motion.svg 
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
          animate={{ rotate: expanded ? 180 : 0 }} 
          className="text-muted"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </motion.svg>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-subtle"
          >
            <div className="p-4 flex flex-col gap-4 bg-surface">
              {/* Explanation */}
              <p className="text-[16px] leading-[1.7] text-primary" style={{ fontWeight: 500 }}>
                {s.explanation || "No explanation provided for this step."}
              </p>

              {/* Key Metrics Row */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-subtle">
                {s.score !== undefined && s.score !== null && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Score</span>
                    <span className="font-mono text-sm text-accent font-bold">{s.score}</span>
                  </div>
                )}
                {s.depth !== undefined && s.depth !== null && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Depth</span>
                    <span className="font-mono text-sm text-primary font-bold">{s.depth}</span>
                  </div>
                )}
                
                {/* A* Specific */}
                {s.f_cost !== undefined && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">F = G + H</span>
                    <span className="font-mono text-sm text-success font-bold">{s.f_cost} = {s.g_cost} + {s.h_cost}</span>
                  </div>
                )}

                {/* BFS Specific */}
                {s.visited_count !== undefined && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Visited</span>
                    <span className="font-mono text-sm text-gold font-bold">{s.visited_count} nodes</span>
                  </div>
                )}
                {s.queue_size !== undefined && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Queue Size</span>
                    <span className="font-mono text-sm text-primary font-bold">{s.queue_size}</span>
                  </div>
                )}

                {/* CSP Specific */}
                {s.variable !== undefined && (
                  <div className="px-3 py-1.5 bg-surface-2 rounded-md border border-subtle flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Variable</span>
                    <span className="font-mono text-sm text-accent font-bold">{s.variable}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
