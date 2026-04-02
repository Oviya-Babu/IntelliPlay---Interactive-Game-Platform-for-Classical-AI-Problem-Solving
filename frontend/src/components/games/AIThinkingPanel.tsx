import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui'
import type { StepDict } from '@/types/ai.types'

interface PanelProps {
  steps: StepDict[]
  isStreaming: boolean
  currentStep: StepDict | null
  onControl?: (msg: any) => void
}

export default function AIThinkingPanel({ steps, isStreaming, currentStep, onControl }: PanelProps) {
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Evaluating': return '#3b82f6'
      case 'Pruning': return '#ef4444'
      case 'Best': return '#10b981'
      default: return 'var(--text-secondary, #a1a1aa)'
    }
  }

  const handleSpeed = (mult: number) => {
    setSpeed(mult)
    const delay = Math.round(1200 / mult)
    onControl?.({ type: 'set_speed', delay_ms: delay })
  }

  const handlePauseToggle = () => {
    const next = !paused
    setPaused(next)
    onControl?.({ type: next ? 'pause' : 'resume' })
  }

  const algo = currentStep?.algorithm ?? 'alpha_beta'
  const isMinimaxFamily = algo === 'minimax' || algo === 'alpha_beta'

  let boardState: string[] = Array(9).fill('')
  if (currentStep && currentStep.state && typeof currentStep.state === 'object' && 'board' in currentStep.state) {
    boardState = (currentStep.state as { board: string[] }).board
  }

  const score = currentStep?.score ?? 0
  const clampedScore = Math.max(-10, Math.min(10, score))
  const scorePercent = ((clampedScore + 10) / 20) * 100
  const scoreColor = clampedScore < 0 ? '#ef4444' : clampedScore > 0 ? '#10b981' : '#a1a1aa'

  return (
    <div className="w-[320px] bg-surface border border-subtle rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--bg-surface, #151521)', border: '1px solid var(--border-default, #2a2a35)' }}>
      {/* 1. Algorithm badge & Controls */}
      <div className="flex items-center justify-between">
        <Badge style={{ background: isMinimaxFamily ? 'var(--accent, #8b5cf6)' : '#4b5563', color: '#fff' }}>
          {algo.toUpperCase()}
        </Badge>
        {isStreaming && onControl && (
          <div className="flex gap-1">
            <button onClick={handlePauseToggle} style={{ padding: '2px 6px', fontSize: 10, background: paused ? '#ef4444' : 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 4, color: '#fff' }}>
              {paused ? 'RESUME' : 'PAUSE'}
            </button>
          </div>
        )}
      </div>

      {isStreaming && onControl && (
        <div className="flex gap-1 justify-end">
          {[0.5, 1, 2, 3].map(s => (
            <button key={s} onClick={() => handleSpeed(s)} style={{ padding: '2px 6px', fontSize: 10, background: speed === s ? 'var(--accent)' : 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: 4, color: '#fff' }}>
              {s}x
            </button>
          ))}
        </div>
      )}

      {/* 2. Step Counter */}
      <div className="font-mono text-sm text-muted" style={{ color: 'var(--text-muted, #71717a)' }}>
        Step {steps.length > 0 ? steps.length : 0} {isStreaming ? '' : ' / Total'}
      </div>

      {/* 3. Current action verb */}
      <div style={{ minHeight: '30px' }}>
        {isStreaming && !paused ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[20px] font-bold tracking-widest"
            style={{ color: 'var(--accent, #a855f7)' }}
          >
            THINKING...
          </motion.div>
        ) : (
          <div className="text-[20px] font-bold" style={{ color: currentStep ? getActionColor(currentStep.action) : 'inherit' }}>
            {paused ? 'PAUSED' : currentStep ? currentStep.action : 'Waiting...'}
          </div>
        )}
      </div>

      {/* 4. Mini board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: 60, height: 60, gap: 2, background: 'var(--border-default, #2a2a35)' }}>
        {boardState.map((c, i) => (
          <div key={i} className="bg-surface-2 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--bg-surface-2, #1e1e2d)', color: c === 'X' ? 'var(--accent, #a855f7)' : 'var(--gold, #f59e0b)' }}>
            {c}
          </div>
        ))}
      </div>

      {/* 5. Score bar */}
      <div className="flex flex-col gap-1">
        <div className="text-xs text-muted" style={{ color: 'var(--text-muted, #71717a)' }}>Score: {score}</div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default, #2a2a35)' }}>
          <motion.div
            animate={{ width: `${scorePercent}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full"
            style={{ background: scoreColor }}
          />
        </div>
      </div>

      {/* 6. Depth */}
      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>
        Depth: {currentStep?.depth ?? '-'}
      </div>

      {/* 7. Pruned indicator */}
      <AnimatePresence>
        {currentStep?.pruned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ color: '#ef4444', border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
          >
            Branch pruned
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. Explanation text */}
      <div
        className="font-mono overflow-y-visible"
        style={{ 
          fontSize: 15, 
          lineHeight: 1.8,
          padding: '12px 16px',
          color: 'var(--text-primary, #f1f0fe)', 
          borderLeft: '3px solid var(--accent, #a855f7)', 
          background: 'rgba(108,99,255,0.08)',
          borderRadius: '0 8px 8px 0',
        }}
      >
        <AnimatePresence mode="wait">
          {!isStreaming && !currentStep ? (
             <motion.div key="empty" initial={{opacity:0, y:4}} animate={{opacity:1, y:0}}>No AI thoughts yet.</motion.div>
          ) : (
             <motion.div key={currentStep?.step_id ?? 0} initial={{opacity:0, y:4}} animate={{opacity:1, y:0}}>{currentStep?.explanation ?? ''}</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
