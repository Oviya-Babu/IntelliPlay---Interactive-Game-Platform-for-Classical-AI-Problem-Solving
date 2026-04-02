import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Badge } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import TutorPanel from '@/components/learn/TutorPanel'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'
import HowToPlay from '@/components/learn/HowToPlay'
import ConceptCard from '@/components/learn/ConceptCard'

interface EightPuzzleProps {
  onSessionChange?: (id: string | null) => void
}

export default function EightPuzzle({ onSessionChange }: EightPuzzleProps) {
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 0])
  const [blankPos, setBlankPos] = useState(8)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [aiSolving, setAiSolving] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [resultData, setResultData] = useState<any>(null)

  useEffect(() => { startGame() }, [])

  const stream = useAIStream(aiSolving ? sessionId : null, 'eightpuzzle')

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Follow latest step if playing
  useEffect(() => {
    if (aiSolving && !isPaused && stream.steps.length > 0) {
      setCurrentStepIndex(stream.steps.length - 1)
    }
  }, [stream.steps.length, aiSolving, isPaused])

  // Update board when currentStepIndex changes
  useEffect(() => {
    if (aiSolving && stream.steps[currentStepIndex]) {
      const step = stream.steps[currentStepIndex]
      const stateData = step.state as { board?: number[] }
      if (stateData?.board) {
        setBoard(stateData.board)
        setBlankPos(stateData.board.indexOf(0))
        setMoveCount(currentStepIndex + 1) // rough moves
      }
    }
  }, [currentStepIndex, aiSolving, stream.steps])

  useEffect(() => {
    if (!stream.isStreaming && aiSolving && stream.steps.length > 0) {
      setAiSolving(false)
      setIsSolved(true)
    }
  }, [stream.isStreaming, aiSolving, stream.steps.length])

  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()

  useEffect(() => {
    if (isSolved) {
      const elapsed = getElapsedMs()
      const s = calcStars({ movesUsed: moveCount, optimalMoves, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves, hintsUsed, livesLost, difficulty: 2 })
      completeLevel('eightpuzzle', s, score, elapsed)
      setResultData({ gameId: 'eightpuzzle', stars: s, score, movesUsed: moveCount, optimalMoves, timeMs: elapsed })
    }
  }, [isSolved])

  const startGame = useCallback(async () => {
    try {
      const res = await gameService.newEightPuzzle()
      setSessionId(res.session_id)
      setBoard(res.board)
      setBlankPos(res.blank_pos)
      setOptimalMoves(res.optimal_moves)
      setMoveCount(0)
      setIsSolved(false)
      setAiSolving(false)
      setIsPaused(false)
      setCurrentStepIndex(0)
      useGameStore.getState().startGame('eightpuzzle')
    } catch (e) {
      console.error('Failed to start 8-puzzle', e)
    }
  }, [])

  const isAdjacent = (tileIdx: number) => {
    const rowB = Math.floor(blankPos / 3)
    const colB = blankPos % 3
    const rowT = Math.floor(tileIdx / 3)
    const colT = tileIdx % 3
    return Math.abs(rowB - rowT) + Math.abs(colB - colT) === 1
  }

  const handleTileClick = useCallback(async (tileIdx: number) => {
    if (!sessionId || isSolved || aiSolving) return
    if (board[tileIdx] === 0) return

    if (!isAdjacent(tileIdx)) return

    // Optimistic update
    const newBoard = [...board]
    newBoard[blankPos] = board[tileIdx]
    newBoard[tileIdx] = 0
    setBoard(newBoard)
    setBlankPos(tileIdx)
    setMoveCount(c => c + 1)

    try {
      const res = await gameService.moveEightPuzzle({ session_id: sessionId, tile_pos: tileIdx })
      setBoard(res.board)
      setBlankPos(res.blank_pos)
      setMoveCount(res.move_count)
      setIsSolved(res.is_solved)
    } catch (e) {
      console.error('Move failed', e)
      setBoard(board) // Revert
      setBlankPos(blankPos)
      setMoveCount(c => c - 1)
    }
  }, [sessionId, board, blankPos, isSolved, aiSolving])

  const watchAISolve = useCallback(() => {
    if (!sessionId) return
    setAiSolving(true)
    setIsPaused(false)
    setCurrentStepIndex(0)
  }, [sessionId])

  const handleSpeedChange = (ms: number) => {
    stream.sendControl({ type: 'set_speed', delay_ms: ms })
  }

  const getBadgeColor = () => {
    if (moveCount <= optimalMoves) return '#10b981'
    if (moveCount <= optimalMoves * 1.5) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #08080f)', paddingTop: 16 }}>
      <HowToPlay gameId="eightpuzzle" />
      
      <div style={{
        display: 'flex', gap: 24,
        alignItems: 'flex-start',
        maxWidth: 1160, margin: '0 auto',
        padding: '16px 24px 48px',
        flexWrap: 'wrap',
      }}>
        {/* Left — game */}
        <div style={{ flex: '1 1 400px', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="flex items-center gap-4 w-full justify-between" style={{ maxWidth: 324 }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary, #f1f0fe)' }}>8-Puzzle</h2>
            <Button onClick={startGame}>New Game</Button>
          </div>

          {sessionId && (
            <Badge style={{ background: getBadgeColor(), color: '#fff', fontSize: 14, padding: '4px 12px' }}>
              Moves: {moveCount} / Target: {optimalMoves}
            </Badge>
          )}

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gridTemplateRows: 'repeat(3, 100px)',
            gap: '6px', margin: '0 auto',
            opacity: aiSolving ? 0.8 : 1
          }}>
            {board.map((val, idx) => {
              const adj = isAdjacent(idx)
              
              let arrow = ''
              if (adj) {
                const bRow = Math.floor(blankPos / 3), bCol = blankPos % 3
                const tRow = Math.floor(idx / 3), tCol = idx % 3
                if (tRow < bRow) arrow = '↓'
                else if (tRow > bRow) arrow = '↑'
                else if (tCol < bCol) arrow = '→'
                else if (tCol > bCol) arrow = '←'
              }

              return (
                <motion.div
                  key={val === 0 ? 'blank' : `tile-${val}`}
                  layout transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  onClick={() => handleTileClick(idx)}
                  style={{
                    width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 12, fontSize: 28, fontWeight: 700,
                    background: val === 0 ? 'rgba(255,255,255,0.03)' : 'var(--bg-surface, #151521)',
                    border: val === 0 ? '2px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--accent, #6c63ff)',
                    cursor: val === 0 ? 'default' : adj && !isSolved && !aiSolving ? 'pointer' : 'default',
                    userSelect: 'none', position: 'relative',
                  }}
                  whileHover={adj && !isSolved && !aiSolving && val !== 0 ? { scale: 1.02, background: 'var(--bg-surface-2, #1a1a28)' } : {}}
                >
                  {val !== 0 && (
                    <>
                      <span>{val}</span>
                      {adj && !isSolved && !aiSolving && (
                        <span style={{ position: 'absolute', opacity: 0.3, fontSize: 16, bottom: 4 }}>{arrow}</span>
                      )}
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>

          {sessionId && !isSolved && !aiSolving && (
            <div className="flex items-center gap-4 mt-4">
              <Button onClick={watchAISolve}>Watch AI Solve</Button>
            </div>
          )}

          <AnimatePresence>
            {isSolved && (
              <motion.div
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                style={{ background: '#10b981', color: '#fff', padding: '16px 32px', borderRadius: 12, fontSize: 20, fontWeight: 700, textAlign: 'center', marginTop: 16 }}
              >
                Solved! {moveCount} moves
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — tutor */}
        <div style={{ flex: '0 0 380px', minWidth: 340 }}>
          <TutorPanel
            gameId="eightpuzzle"
            steps={stream.steps}
            isStreaming={stream.isStreaming}
            currentStepIndex={currentStepIndex}
            onNext={() => { setIsPaused(true); setCurrentStepIndex(i => Math.min(stream.steps.length - 1, i + 1)) }}
            onPrev={() => { setIsPaused(true); setCurrentStepIndex(i => Math.max(0, i - 1)) }}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
            onSpeedChange={handleSpeedChange}
            sessionId={sessionId}
            boardState={JSON.stringify(board)}
          />
        </div>
      </div>

      <ConceptCard 
        gameId="eightpuzzle" open={!!resultData} 
        onClose={() => { const data = resultData; setResultData(null); navigate('/results', { state: data }) }} 
      />
    </div>
  )
}
