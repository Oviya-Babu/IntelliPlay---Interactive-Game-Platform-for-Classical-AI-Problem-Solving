import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Badge } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import TutorPanel from '@/components/learn/TutorPanel'
import ComplexityInsights from '@/components/learn/ComplexityInsights'
import { useGameStore } from '@/store/gameStore'
import { useComplexityStore } from '@/store/complexityStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'
import HowToPlay from '@/components/learn/HowToPlay'
import ConceptCard from '@/components/learn/ConceptCard'

interface EightPuzzleProps {
  onSessionChange?: (id: string | null) => void
}

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]

export default function EightPuzzle({ onSessionChange }: EightPuzzleProps) {
  const navigate = useNavigate()

  // Core game state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<number[]>(GOAL_STATE)
  const [blankPos, setBlankPos] = useState(8)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [aiSolving, setAiSolving] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [invalidMoveAttempt, setInvalidMoveAttempt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastMovedTile, setLastMovedTile] = useState<number | null>(null)
  const [bestMoves, setBestMoves] = useState<any[]>([])

  // AI playback state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1)
  const [currentExplanation, setCurrentExplanation] = useState('')
  const playbackIntervalRef = useRef<number | null>(null)
  const playbackIndexRef = useRef<number>(0)

  const goalState = GOAL_STATE
  const stream = useAIStream(aiSolving ? sessionId : null, 'eightpuzzle')
  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()

  // Initialize game on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const res = await gameService.newEightPuzzle()
        console.log('[8-PUZZLE] Game initialized:', res)
        setSessionId(res.session_id)
        setBoard(res.board)
        setBlankPos(res.blank_pos)
        setOptimalMoves(res.optimal_moves)
        setMoveCount(0)
        setIsSolved(false)
        setAiSolving(false)
        useGameStore.getState().startGame('eightpuzzle')
      } catch (e) {
        console.error('[8-PUZZLE] Failed to start game:', e)
      } finally {
        setIsLoading(false)
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
        // Update complexity metrics during AI playback
        const cs = useComplexityStore.getState();
        cs.incrementNodes();
        cs.incrementStates();
        cs.setDepth(i + 1);
        cs.updateElapsedTime();
      }

      playbackIndexRef.current = i + 1
    }, speedMs)

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
    }
  }, [aiSolving, isPaused, currentSpeed, stream.steps])

  // Helper: Convert flat index to row/col
  const getRowCol = (index: number) => {
    return [Math.floor(index / 3), index % 3]
  }

  // Helper: Check if two positions are adjacent (Manhattan distance = 1)
  const arePositionsAdjacent = (i: number, j: number) => {
    const [r1, c1] = getRowCol(i)
    const [r2, c2] = getRowCol(j)
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1
  }

  // Check if tile at index is adjacent to empty space
  const isAdjacent = (tileIdx: number) => {
    const emptyIdx = board.indexOf(0)
    return arePositionsAdjacent(tileIdx, emptyIdx)
  }

  // STEP 2: Check if puzzle is solvable
  const isSolvable = (testBoard: number[]) => {
    let inversions = 0
    for (let i = 0; i < testBoard.length; i++) {
      for (let j = i + 1; j < testBoard.length; j++) {
        if (testBoard[i] && testBoard[j] && testBoard[i] > testBoard[j]) {
          inversions++
        }
      }
    }
    return inversions % 2 === 0
  }

  // Generate a solvable shuffled board
  const generateSolvableBoard = () => {
    let shuffled = [...goalState]
    let isSolvableBoard = false

    // Keep shuffling until we get a solvable board that's not already solved
    while (!isSolvableBoard || shuffled.join('') === goalState.join('')) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      isSolvableBoard = isSolvable(shuffled)
    }

    return shuffled
  }

  // Calculate Manhattan distance for a tile
  const getManhattanDistance = (index: number, value: number) => {
    if (value === 0) return 0
    const goalIndex = goalState.indexOf(value)
    const [currentRow, currentCol] = getRowCol(index)
    const [goalRow, goalCol] = getRowCol(goalIndex)
    return Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol)
  }

  // Handle tile click - move tile to adjacent empty space
  const handleTileClick = (tileIdx: number) => {
    console.log('[8-PUZZLE] handleTileClick called with index:', tileIdx, 'board:', board)
    
    // Validation checks
    if (!sessionId) {
      console.warn('[8-PUZZLE] No session ID available')
      return
    }
    if (isSolved) {
      console.log('[8-PUZZLE] Already solved')
      return
    }
    if (aiSolving) {
      console.log('[8-PUZZLE] AI currently solving')
      return
    }
    if (board[tileIdx] === 0) {
      console.warn('[8-PUZZLE] Clicked on empty space')
      return
    }

    // Check adjacency
    if (!isAdjacent(tileIdx)) {
      console.log('[8-PUZZLE] Invalid move: tile not adjacent to empty space', {
        tileIdx,
        tileValue: board[tileIdx],
        emptyIdx: board.indexOf(0),
      })
      setInvalidMoveAttempt(true)
      setTimeout(() => setInvalidMoveAttempt(false), 3000)
      return
    }

    const movedTileValue = board[tileIdx]
    console.log('[8-PUZZLE] Valid move attempt - sending to backend', {
      boardBefore: board,
      tileIdx,
      tileValue: movedTileValue,
      emptyIdx: board.indexOf(0),
      sessionId,
    })

    // Track last moved tile for feedback
    setLastMovedTile(movedTileValue)

    // Send move to backend
    gameService
      .moveEightPuzzle({ session_id: sessionId, tile_pos: tileIdx })
      .then((res) => {
        console.log('[8-PUZZLE] ✓ Move successful - response:', res)
        setBoard(res.board)
        setBlankPos(res.board.indexOf(0))
        setMoveCount(res.move_count)
        setIsSolved(res.is_solved)
        console.log('[8-PUZZLE] State updated:', {
          newBoard: res.board,
          moved: true,
        })
      })
      .catch((e: any) => {
        console.error('[8-PUZZLE] ✗ Move failed - error:', e?.message || e, {
          sessionId,
          tileIdx,
          errorDetails: e,
        })
        setInvalidMoveAttempt(true)
        setTimeout(() => setInvalidMoveAttempt(false), 3000)
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
      setLastMovedTile(null)
      setBestMoves([])
      useGameStore.getState().startGame('eightpuzzle')
      console.log('[8-PUZZLE] New game started:', { board: res.board, optimal: res.optimal_moves })

      // TODO: Load initial best moves (requires backend endpoint)
      // if (res.session_id) {
      //   gameService.getBestMoves(res.session_id, res.board)
      //     .then((bestMovesRes) => setBestMoves(bestMovesRes.moves || []))
      // }
    } catch (e) {
      console.error('Failed to start 8-puzzle', e)
    }
  }, [])

  // Compute best next move based on heuristic (local suggestion)
  const getNextBestMove = () => {
    if (bestMoves.length === 0) return null
    return bestMoves[0]
  }

  // Get best move tile position
  const getBestMoveTileIdx = () => {
    const best = getNextBestMove()
    if (!best) return null
    // Try to find which tile was moved in the best move
    if (best.explanation) {
      const tileMatch = best.explanation.match(/[Tt]ile (\d+)/)
      if (tileMatch) return parseInt(tileMatch[1])
    }
    return null
  }

  // Watch AI solve - shows final state immediately, then can step through
  const watchAISolve = useCallback(() => {
    if (!sessionId || aiSolving) return
    console.log('[8-PUZZLE] Starting AI solve - preparing solution steps')
    // Start AI solving which will trigger WebSocket connection and stream steps
    setMoveCount(0)
    setCurrentStepIndex(0)
    setCurrentExplanation('Fetching optimal solution from AI...')
    setIsPaused(false)
    setAiSolving(true)
    // Start complexity tracking
    useComplexityStore.getState().startTracking('eightpuzzle');
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
              {/* Current State */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/70">Current State</p>
                <h2 className="mt-2 text-lg font-bold text-emerald-300">Initial Position</h2>
                <p className="mt-1 text-xs leading-5 text-white/60">Starting configuration of the puzzle</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {board.map((val) => (
                  <div
                    key={`current-${val}-${board.indexOf(val)}`}
                    className="flex h-12 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300"
                  >
                    {val === 0 ? '·' : val}
                  </div>
                ))}
              </div>

              {/* Goal State */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/70">Goal State</p>
                <h2 className="mt-2 text-lg font-bold text-blue-300">Target Position</h2>
                <p className="mt-1 text-xs leading-5 text-white/60">What we need to reach</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {goalState.map((val) => (
                  <div
                    key={`goal-${val}`}
                    className="flex h-12 items-center justify-center rounded border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300"
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
                  <p className="text-xs text-white/70 mt-2">Reach solution in ≤ {optimalMoves} moves using A* algorithm</p>
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
                gridTemplateColumns: 'repeat(3, clamp(72px, 18vw, 90px))',
                gridTemplateRows: 'repeat(3, clamp(72px, 18vw, 90px))',
              }}
            >
              {board.map((val, idx) => {
                const adj = isAdjacent(idx)
                const isBestMove = bestMoves.length > 0 && val === bestMoves[0]?.board?.[idx]
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
                      background: val === 0 ? 'rgba(255,255,255,0.03)' : 'var(--bg-surface)',
                      borderColor:
                        adj && !isSolved && !aiSolving && val !== 0
                          ? 'rgba(107,99,255,0.6)'
                          : 'rgba(255,255,255,0.1)',
                      color: 'var(--accent,#6c63ff)',
                      opacity: aiSolving ? 0.5 : 1,
                      boxShadow:
                        adj && !isSolved && !aiSolving && val !== 0
                          ? isBestMove
                            ? '0 0 30px rgba(34,197,94,0.6), inset 0 0 20px rgba(34,197,94,0.2)'
                            : '0 0 20px rgba(107,99,255,0.3)'
                          : 'none',
                      transition: 'all 0.3s ease',
                      pointerEvents: 'auto',
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
                  if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
                  const nextIdx = Math.min(stream.steps.length - 1, currentStepIndex + 1)
                  const nextStep = stream.steps[nextIdx] as any
                  if (nextStep?.state?.board) {
                    setBoard(nextStep.state.board)
                    setBlankPos(nextStep.state.board.indexOf(0))
                    setMoveCount(nextIdx)
                    setCurrentExplanation(nextStep.explanation || '')
                  }
                  setCurrentStepIndex(nextIdx)
                  // If we just applied the last step, mark solved
                  if (nextIdx === stream.steps.length - 1) {
                    setAiSolving(false)
                    setIsSolved(true)
                  }
                }}
                onPrev={() => {
                  setIsPaused(true)
                  if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current)
                  const prevIdx = Math.max(0, currentStepIndex - 1)
                  const prevStep = stream.steps[prevIdx] as any
                  if (prevStep?.state?.board) {
                    setBoard(prevStep.state.board)
                    setBlankPos(prevStep.state.board.indexOf(0))
                    setMoveCount(prevIdx)
                    setCurrentExplanation(prevStep.explanation || '')
                  }
                  setCurrentStepIndex(prevIdx)
                }}
                onPause={() => setIsPaused(true)}
                onResume={() => setIsPaused(false)}
                onSpeedChange={handleSpeedChange}
                sessionId={sessionId}
                boardState={JSON.stringify(board)}
              />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur-sm space-y-5 overflow-y-auto max-h-[70vh]">
                <div>
                  <h3 className="text-md font-bold text-[var(--text-primary)] mb-3">How 8-Puzzle Works</h3>
                  <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-5">
                    <div className="bg-white/5 border border-white/10 rounded p-3">
                      <p className="font-semibold text-[var(--text-primary)] mb-1">📋 The Problem:</p>
                      <p>Arrange numbered tiles 1-8 in order, with empty space at bottom-right corner, by sliding adjacent tiles into the empty space.</p>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded p-3">
                      <p className="font-semibold text-[var(--text-primary)] mb-1">🎯 Movement Rules:</p>
                      <ul className="space-y-1 ml-3 text-[var(--text-secondary)]">
                        <li>• Only tiles adjacent to empty space can move</li>
                        <li>• Click a tile to swap it with empty space</li>
                        <li>• Tiles with arrows show valid moves</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded p-3">
                      <p className="font-semibold text-[var(--text-primary)] mb-1">🚀 AI Strategy:</p>
                      <p>Uses <span className="font-semibold text-emerald-400">A* Search</span> algorithm with <span className="font-semibold text-emerald-400">Manhattan Distance</span> heuristic to find the optimal solution in minimal moves!</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded p-3">
                      <p className="font-semibold text-[var(--text-primary)] mb-1">💡 Algorithm Insight:</p>
                      <p><span className="text-blue-400">f(n)</span> = <span className="text-green-400">g(n)</span> + <span className="text-orange-400">h(n)</span></p>
                      <p className="text-[var(--text-muted)] mt-2 text-xs">
                        <span className="text-green-400">g(n)</span>: moves taken so far<br/>
                        <span className="text-orange-400">h(n)</span>: estimated distance to goal<br/>
                        <span className="text-blue-400">f(n)</span>: total estimated cost
                      </p>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
                      <p className="font-semibold text-emerald-400 mb-2">✨ Pro Tips:</p>
                      <ul className="space-y-1 text-emerald-300/80 text-xs ml-3">
                        <li>• Click "Watch AI Solve" to see optimal strategy</li>
                        <li>• Position corner tiles first</li>
                        <li>• Each step reduces total cost</li>
                      </ul>
                    </div>

                    {/* Educational Info Box — Phase 2.6 */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 space-y-3">
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">📌 Why is the goal fixed?</p>
                        <p className="text-[var(--text-secondary)] leading-5">The 8-puzzle uses the standard goal state: tiles 1–8 in order with the empty space at the end. This allows algorithms like A* to compute a single, consistent optimal path every time.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-400 mb-1">🚫 Why can't some puzzles be solved?</p>
                        <p className="text-[var(--text-secondary)] leading-5">Some board configurations are mathematically impossible to solve. If the number of <span className="text-blue-300 font-medium">inversions</span> (pairs of tiles out of order) is <span className="text-red-400 font-medium">odd</span>, the puzzle has no solution. A* detects this via parity — only boards with <span className="text-green-400 font-medium">even inversions</span> are generated.</p>
                      </div>
                    </div>

                    {/* Complexity Insights */}
                    <ComplexityInsights gameId="eightpuzzle" variant="tailwind" />
                  </div>
                </div>
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
