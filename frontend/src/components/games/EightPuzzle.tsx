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

  // Core game state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 0])
  const [blankPos, setBlankPos] = useState(8)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [aiSolving, setAiSolving] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [invalidMoveAttempt, setInvalidMoveAttempt] = useState(false)

  // AI playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1)
  const [currentExplanation, setCurrentExplanation] = useState('')
  const playbackIntervalRef = useRef<number | null>(null)
  const playbackIndexRef = useRef<number>(0)

  const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0]
  const stream = useAIStream(aiSolving ? sessionId : null, 'eightpuzzle')
  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()
  // Initialize game
  useEffect(() => {
    const init = async () => {
      try {
        const res = await gameService.newEightPuzzle()
        setSessionId(res.session_id)
        setBoard(res.board)
        setBlankPos(res.blank_pos)
        setOptimalMoves(res.optimal_moves)
        setMoveCount(0)
        setIsSolved(false)
        setAiSolving(false)
        useGameStore.getState().startGame('eightpuzzle')
        console.log('[8-PUZZLE] Game initialized')
      } catch (e) {
        console.error('Failed to start 8-puzzle', e)
      }
    }
    init()
  }, [])

  useEffect(() => {
    onSessionChange?.(sessionId)
  }, [onSessionChange, sessionId])

  // Track solve completion
  useEffect(() => {
    if (isSolved) {
      const elapsed = getElapsedMs()
      const s = calcStars({ movesUsed: moveCount, optimalMoves, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves, hintsUsed, livesLost, difficulty: 2 })
      completeLevel('eightpuzzle', s, score, elapsed)
      setResultData({ gameId: 'eightpuzzle', stars: s, score, movesUsed: moveCount, optimalMoves, timeMs: elapsed })
    }
  }, [isSolved])

  // AI playback
  useEffect(() => {
    if (!stream?.steps || stream.steps.length === 0) return
    if (!aiSolving || isPaused) return

    const steps = stream.steps
    const speedMs = currentSpeed === 0.5 ? 800 : currentSpeed === 1 ? 500 : 250
    playbackIndexRef.current = 0

    playbackIntervalRef.current = window.setInterval(() => {
      const i = playbackIndexRef.current

      if (i >= steps.length) {
        clearInterval(playbackIntervalRef.current!)
        const finalStep = steps[steps.length - 1] as any
        setBoard(finalStep.state.board)
        setBlankPos(finalStep.state.board.indexOf(0))
        setMoveCount(steps.length - 1)
        setCurrentExplanation(finalStep.explanation || '')
        setCurrentStepIndex(steps.length - 1)
        setAiSolving(false)
        setIsSolved(true)
        console.log('[8-PUZZLE] PLAYBACK COMPLETE')
        return
      }

      const step = steps[i] as any
      if (step?.state?.board) {
        setBoard(step.state.board)
        setBlankPos(step.state.board.indexOf(0))
        setMoveCount(i)
        setCurrentExplanation(step.explanation || '')
        setCurrentStepIndex(i)
      }

      playbackIndexRef.current = i + 1
    }, speedMs)

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
    }
  }, [aiSolving, isPaused, currentSpeed, stream.steps])

  // Check adjacency
  const isAdjacent = (tileIdx: number) => {
    const rowB = Math.floor(blankPos / 3)
    const colB = blankPos % 3
    const rowT = Math.floor(tileIdx / 3)
    const colT = tileIdx % 3
    return Math.abs(rowB - rowT) + Math.abs(colB - colT) === 1
  }

  // Handle tile click
  const handleTileClick = (tileIdx: number) => {
    if (!sessionId || isSolved || aiSolving) return
    if (board[tileIdx] === 0) return
    if (!isAdjacent(tileIdx)) {
      setInvalidMoveAttempt(true)
      setTimeout(() => setInvalidMoveAttempt(false), 3000)
      return
    }

    gameService
      .moveEightPuzzle({ session_id: sessionId, tile_pos: tileIdx })
      .then((res) => {
        setBoard(res.board)
        setBlankPos(res.blank_pos)
        setMoveCount(res.move_count)
        setIsSolved(res.is_solved)
        console.log('[8-PUZZLE] Move successful, solved:', res.is_solved)
      })
      .catch((e) => {
        console.error('Move failed', e)
      })
  }

  // Start new game
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
      setInvalidMoveAttempt(false)
      setCurrentExplanation('')
      useGameStore.getState().startGame('eightpuzzle')
      console.log('[8-PUZZLE] New game started')
    } catch (e) {
      console.error('Failed to start 8-puzzle', e)
    }
  }, [])

  // Watch AI solve
  const watchAISolve = useCallback(() => {
    if (!sessionId || aiSolving) return
    console.log('[8-PUZZLE] Starting AI solve')
    setMoveCount(0)
    setCurrentStepIndex(0)
    setCurrentExplanation('')
    setIsPaused(false)
    setAiSolving(true)
  }, [sessionId, aiSolving])

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed)
  }

  const getBadgeColor = () => {
    if (moveCount <= optimalMoves) return '#10b981'
    if (moveCount <= optimalMoves * 1.5) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base,#08080f)] pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 mt-2">
          <HowToPlay gameId="eightpuzzle" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)_380px] lg:items-start">
          {/* Left Panel */}
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur-sm h-fit">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Goal State</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary,#f1f0fe)]">Goal</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">Arrange tiles 1-8 in order</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {goalState.map((val) => (
                  <div
                    key={`goal-${val}`}
                    className="flex h-14 items-center justify-center rounded-lg border border-white/10 bg-[var(--bg-surface,#151521)] text-sm font-bold text-[var(--accent,#6c63ff)]"
                  >
                    {val === 0 ? '·' : val}
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary,#f1f0fe)]">How to Play</h3>
                  <p className="text-xs text-white/70 mt-2">Click tiles next to empty space to move them</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary,#f1f0fe)]">Goal Target</h3>
                  <p className="text-xs text-white/70 mt-2">Reach solution in ≤ target moves using A* optimal path</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Panel – Game Board */}
          <main className="flex min-w-0 flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-lg shadow-black/10 backdrop-blur-sm">
            <div className="w-full flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-primary,#f1f0fe)]">8-Puzzle</h2>
              <Button onClick={startGame} size="sm">New Game</Button>
            </div>

            {sessionId && (
              <div className="text-center">
                <Badge style={{ background: getBadgeColor(), color: '#fff' }}>
                  Moves: {moveCount} / Target: {optimalMoves}
                </Badge>
              </div>
            )}

            {invalidMoveAttempt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2"
              >
                Only move tiles adjacent to empty space
              </motion.div>
            )}

            {/* Game Board */}
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: 'repeat(3, 90px)',
                gridTemplateRows: 'repeat(3, 90px)',
              }}
            >
              {board.map((val, idx) => {
                const adj = isAdjacent(idx)
                let arrow = ''
                if (adj && !isSolved && !aiSolving) {
                  const bRow = Math.floor(blankPos / 3)
                  const bCol = blankPos % 3
                  const tRow = Math.floor(idx / 3)
                  const tCol = idx % 3
                  if (tRow < bRow) arrow = '↓'
                  else if (tRow > bRow) arrow = '↑'
                  else if (tCol < bCol) arrow = '→'
                  else if (tCol > bCol) arrow = '←'
                }

                return (
                  <motion.div
                    key={val === 0 ? 'blank' : `tile-${val}`}
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    onClick={() => handleTileClick(idx)}
                    className="flex items-center justify-center rounded-lg border font-bold text-lg cursor-pointer relative"
                    style={{
                      background: val === 0 ? 'rgba(255,255,255,0.03)' : 'var(--bg-surface,#151521)',
                      borderColor:
                        adj && !isSolved && !aiSolving && val !== 0
                          ? 'rgba(107,99,255,0.6)'
                          : 'rgba(255,255,255,0.1)',
                      color: 'var(--accent,#6c63ff)',
                      opacity: aiSolving ? 0.5 : 1,
                      boxShadow:
                        adj && !isSolved && !aiSolving && val !== 0
                          ? '0 0 20px rgba(107,99,255,0.3)'
                          : 'none',
                    }}
                    whileHover={adj && !isSolved && !aiSolving && val !== 0 ? { scale: 1.05 } : {}}
                  >
                    {val !== 0 ? val : ''}
                    {arrow && <span className="text-xs absolute bottom-1 opacity-60">{arrow}</span>}
                  </motion.div>
                )
              })}
            </div>

            {/* Speed Controls */}
            {aiSolving && (
              <div className="text-center space-y-2">
                <div className="text-xs text-white/60">Speed: {currentSpeed}x</div>
                <div className="flex gap-1 justify-center">
                  {[0.5, 1, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-2 py-1 text-xs rounded ${
                        currentSpeed === s
                          ? 'bg-[var(--accent,#6c63ff)] text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentExplanation && (
              <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded p-2 text-center max-w-sm">
                {currentExplanation}
              </div>
            )}

            {/* Control Buttons */}
            {sessionId && !isSolved && !aiSolving && (
              <Button onClick={watchAISolve}>Watch AI Solve</Button>
            )}

            {/* Solved Message */}
            <AnimatePresence>
              {isSolved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-6 py-4"
                >
                  <div className="text-2xl font-bold text-emerald-300">✓ SOLVED!</div>
                  <div className="text-sm text-emerald-300/80">{moveCount} moves</div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Panel */}
          <div className="min-w-0">
            {aiSolving && stream.steps.length > 0 ? (
              <TutorPanel
                gameId="eightpuzzle"
                steps={stream.steps}
                isStreaming={false}
                currentStepIndex={currentStepIndex}
                onNext={() => {
                  setIsPaused(true)
                  setCurrentStepIndex((i) => Math.min(stream.steps.length - 1, i + 1))
                }}
                onPrev={() => {
                  setIsPaused(true)
                  setCurrentStepIndex((i) => Math.max(0, i - 1))
                }}
                onPause={() => setIsPaused(true)}
                onResume={() => setIsPaused(false)}
                onSpeedChange={handleSpeedChange}
                sessionId={sessionId}
                boardState={JSON.stringify(board)}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-[var(--text-primary,#f1f0fe)] mb-4">Tips</h3>
                <ul className="space-y-3 text-xs text-white/70 leading-5">
                  <li>• Tiles with arrows can be clicked to move</li>
                  <li>• Solve row by row: top → middle → bottom</li>
                  <li>• Watch AI to see optimal strategy</li>
                  <li>• Target is the minimum moves needed</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConceptCard
        gameId="eightpuzzle"
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
