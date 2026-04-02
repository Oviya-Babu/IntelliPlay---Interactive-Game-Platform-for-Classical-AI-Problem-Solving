import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import AIThinkingPanel from './AIThinkingPanel'
import { errorShake } from '@/animations/variants'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'
import HowToPlay from '@/components/learn/HowToPlay'
import ConceptCard from '@/components/learn/ConceptCard'
import WhyThisMove from '@/components/learn/WhyThisMove'

const QUEEN_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M2 19h20v2H2v-2zm2-2l1.5-6L8 14l4-10 4 10 2.5-3L20 17H4zm4-3.5L12 4l4 9.5-2-2.5-2 4-2-4-2 2.5z" />
  </svg>
)

export default function NQueens() {
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<number[]>([])
  const [n, setN] = useState(8)
  const [conflicts, setConflicts] = useState<number[][]>([])
  const [domains, setDomains] = useState<Record<string, number[]>>({})
  const [isSolved, setIsSolved] = useState(false)
  const [shakingCell, setShakingCell] = useState<string | null>(null)
  const [aiSolving, setAiSolving] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [moveCount, setMoveCount] = useState(0)
  const [resultData, setResultData] = useState<any>(null)

  useEffect(() => { startGame() }, [])

  const stream = useAIStream(aiSolving ? sessionId : null, 'nqueens')

  const lastAppliedStepRef = useRef(-1)
  useEffect(() => {
    if (!aiSolving || !stream.currentStep) return
    const step = stream.currentStep
    if (step.step_id <= lastAppliedStepRef.current) return
    lastAppliedStepRef.current = step.step_id
    const stateData = step.state as { board?: number[]; domains?: Record<string, number[]> }
    if (stateData?.board) {
      setBoard([...stateData.board])
      if (stateData.domains) setDomains(stateData.domains)
    }
  }, [stream.currentStep, aiSolving])

  useEffect(() => {
    if (!stream.isStreaming && aiSolving && stream.steps.length > 0) {
      setAiSolving(false)
      const b = board
      const placed = b.filter(c => c !== -1).length
      if (placed === n) setIsSolved(true)
    }
  }, [stream.isStreaming, aiSolving, stream.steps.length, board, n])

  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()

  useEffect(() => {
    if (isSolved) {
      const elapsed = getElapsedMs()
      const s = calcStars({ movesUsed: moveCount, optimalMoves: n, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves: n, hintsUsed, livesLost, difficulty: 4 })
      completeLevel('nqueens', s, score, elapsed)
      setResultData({ gameId: 'nqueens', stars: s, score, movesUsed: moveCount, optimalMoves: n, timeMs: elapsed })
    }
  }, [isSolved])

  const startGame = useCallback(async (size?: number) => {
    const sz = size ?? n
    try {
      const res = await gameService.newNQueens(sz)
      setSessionId(res.session_id)
      setBoard(res.board)
      setN(res.n)
      setConflicts([])
      setDomains({})
      setIsSolved(false)
      setAiSolving(false)
      setMoveCount(0)
      lastAppliedStepRef.current = -1
      useGameStore.getState().startGame('nqueens')
    } catch (e) {
      console.error('Failed to start N-Queens', e)
    }
  }, [n])

  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (!sessionId || isSolved || aiSolving) return

    // If queen already placed here, remove it
    if (board[row] === col) {
      const newBoard = [...board]
      newBoard[row] = -1
      setBoard(newBoard)
      setConflicts([])
      return
    }

    try {
      const res = await gameService.moveNQueens({ session_id: sessionId, row, col })
      setBoard(res.board)
      setConflicts(res.conflicts)
      setDomains(res.domains)
      setIsSolved(res.is_solved)
      setMoveCount(c => c + 1)
    } catch {
      const key = `${row}-${col}`
      setShakingCell(key)
      setTimeout(() => setShakingCell(null), 400)
    }
  }, [sessionId, board, isSolved, aiSolving])

  const watchAISolve = useCallback(() => {
    if (!sessionId) return
    setAiSolving(true)
    lastAppliedStepRef.current = -1
  }, [sessionId])

  const handleSpeedChange = (s: number) => {
    setSpeed(s)
    stream.sendControl({ type: 'set_speed', delay_ms: Math.round(1200 / s) })
  }

  // Check if a row is in a conflict pair
  const conflictRows = new Set<number>()
  conflicts.forEach(([r1, r2]) => { conflictRows.add(r1); conflictRows.add(r2) })

  const renderBoard = () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gridTemplateRows: `repeat(${n}, 1fr)`,
        width: 'min(480px, 90vw)',
        border: '2px solid var(--border-default, #2a2a35)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: n * n }).map((_, idx) => {
        const row = Math.floor(idx / n)
        const col = idx % n
        const isDark = (row + col) % 2 === 1
        const hasQueen = board[row] === col
        const isConflict = hasQueen && conflictRows.has(row)
        const domainCols = !hasQueen && board[row] === -1
          ? (domains[String(row)] ?? [])
          : []
        const key = `${row}-${col}`

        return (
            <motion.div
            key={key}
            variants={errorShake}
            animate={shakingCell === key ? 'shake' : 'idle'}
            onClick={() => handleCellClick(row, col)}
            style={{
              aspectRatio: '1/1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSolved || aiSolving ? 'default' : 'pointer',
              background: isConflict
                ? 'rgba(239,68,68,0.3)'
                : isSolved && hasQueen
                  ? 'rgba(16,185,129,0.25)'
                  : isDark
                    ? 'var(--bg-surface-2, #1a1a28)'
                    : 'var(--bg-surface, #151521)',
              position: 'relative',
              userSelect: 'none',
            }}
          >
            {hasQueen && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                style={{ color: 'var(--accent, #a855f7)', lineHeight: 0 }}
              >
                {QUEEN_SVG}
              </motion.div>
            )}

            {/* Domain dots */}
            {domainCols.length > 0 && domainCols.includes(col) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent, #a855f7)',
                  opacity: 0.4,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #08080f)', paddingTop: 16 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 48px', display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Left: AI Panel 280px */}
        <div style={{ flex: '0 0 280px', minWidth: 0 }}>
          <AIThinkingPanel
            steps={stream.steps}
            isStreaming={stream.isStreaming}
            currentStep={stream.currentStep}
          />
          <WhyThisMove currentStep={stream.currentStep} />
        </div>
        {/* Center: Game + HowToPlay */}
        <div style={{ flex: '1 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <HowToPlay gameId="nqueens" />
          <div className="flex items-center gap-4 w-full justify-between" style={{ maxWidth: n * cellSize + 16 }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary, #f1f0fe)' }}>N-Queens</h2>
          <Button onClick={() => startGame()}>New Game</Button>
        </div>

        {/* N selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>Board size:</span>
          {[4, 6, 8].map(sz => (
            <button
              key={sz}
              onClick={() => { setN(sz); startGame(sz) }}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: n === sz ? '2px solid var(--accent, #a855f7)' : '1px solid var(--border-default, #2a2a35)',
                background: n === sz ? 'var(--accent, #a855f7)' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {sz}x{sz}
            </button>
          ))}
        </div>

        {/* Single Responsive Board */}
        <div style={{ margin: '16px auto' }}>{renderBoard()}</div>

        {/* Controls */}
        {sessionId && !isSolved && (
          <div className="flex items-center gap-4">
            <Button onClick={watchAISolve} disabled={aiSolving}>
              {aiSolving ? 'Solving...' : 'Watch AI Solve'}
            </Button>
            {aiSolving && (
              <div className="flex items-center gap-2">
                {[0.5, 1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: speed === s ? '2px solid var(--accent, #a855f7)' : '1px solid var(--border-default, #2a2a35)',
                      background: speed === s ? 'var(--accent, #a855f7)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Solved banner */}
        <AnimatePresence>
          {isSolved && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              style={{
                background: '#10b981',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: 12,
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Solved! Valid arrangement found.
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <ConceptCard 
        gameId="nqueens" 
        open={!!resultData} 
        onClose={() => {
          const data = resultData
          setResultData(null)
          navigate('/results', { state: data })
        }} 
      />
    </div>
  )
}
