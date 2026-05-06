import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import TutorPanel from '@/components/learn/TutorPanel'

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]

interface EightPuzzleNewProps {
  onSessionChange?: (id: string | null) => void
}

export default function EightPuzzleNew({ onSessionChange }: EightPuzzleNewProps) {
  // Core state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<number[]>(GOAL_STATE)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // AI solving state
  const [aiSolving, setAiSolving] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [currentExplanation, setCurrentExplanation] = useState('')
  const [invalidMove, setInvalidMove] = useState(false)

  // Hint system state
  const [hintMove, setHintMove] = useState<number | null>(null)
  const [hintExplanation, setHintExplanation] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [loadingHint, setLoadingHint] = useState(false)

  // Undo/Redo history state
  const [boardHistory, setBoardHistory] = useState<number[][]>([GOAL_STATE])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Hooks
  const stream = useAIStream(aiSolving ? sessionId : null, 'eightpuzzle')
  const playbackIntervalRef = useRef<number | null>(null)
  const goalReachedRef = useRef(false)
  const playbackIndexRef = useRef(0)  // ✅ Track playback progress with ref instead of state

  // Initialize game on mount
  useEffect(() => {
    startNewGame()

    // Cleanup on unmount
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    onSessionChange?.(sessionId)
  }, [onSessionChange, sessionId])

  // ✅ Game Completion Handler - Stop all AI operations when puzzle is solved
  useEffect(() => {
    if (isSolved) {
      // Clear any running intervals
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
      
      // Stop AI operations
      setAiSolving(false)
      setIsPaused(false)
      
      console.log('[8-PUZZLE] ✅ GOAL STATE REACHED - GAME COMPLETED')
      console.log('[8-PUZZLE] ✅ Moves:', moveCount, '/ Optimal:', optimalMoves)
      console.log('[8-PUZZLE] ✅ Waiting for user to request new game...')
    }
  }, [isSolved, moveCount, optimalMoves])

  // AI  playback loop - Fixed speed control and timing
  useEffect(() => {
    // ✅ ABSOLUTE STOP: If puzzle is solved, never run AI logic
    if (isSolved || goalReachedRef.current) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
      return
    }

    if (!stream?.steps || stream.steps.length === 0) return
    if (!aiSolving || isPaused) return
    
    // If goal was already reached, don't start a new interval
    if (goalReachedRef.current) return

    const steps = stream.steps
    // ✅ CRITICAL FIX: Much slower default speeds for learning
    // These times determine how long to display each step
    // Default (1x) is now MUCH slower to allow users to understand and follow
    const speedMs = 
      speed === 0.5 ? 3000 :  // 0.5x: 3000ms per step (3 seconds - very slow for learning)
      speed === 1 ? 2000 :    // 1x: 2000ms per step (2 seconds - DEFAULT, slow for following)
      speed === 2 ? 1000 :    // 2x: 1000ms per step (1 second - faster)
      500                      // 3x: 500ms per step (very fast)

    // ✅ Reset index when starting or speed changes
    playbackIndexRef.current = 0

    // Clear any existing interval first
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
    }

    playbackIntervalRef.current = window.setInterval(() => {
      const index = playbackIndexRef.current

      // Double-check: if goal reached, stop immediately
      if (goalReachedRef.current || isSolved) {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
          playbackIntervalRef.current = null
        }
        return
      }
      
      if (index >= steps.length) {
        // Mark goal as reached FIRST
        goalReachedRef.current = true
        
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
          playbackIntervalRef.current = null
        }
        
        const last = steps[steps.length - 1] as any
        setBoard(last.state.board)
        // Move count = total steps - 1 (first step is initial state, not a move)
        const totalMoves = Math.max(0, steps.length - 1)
        setMoveCount(totalMoves)
        setCurrentStepIndex(steps.length - 1)
        // CRITICAL: Stop AI solving immediately when goal is reached
        setAiSolving(false)
        setIsSolved(true)
        return
      }

      const step = steps[index] as any
      if (step?.state?.board) {
        setBoard(step.state.board)
        // Same counting: moves = step index (0 = initial, 1 = 1 move, etc)
        setMoveCount(Math.max(0, index))
        setCurrentExplanation(step.explanation || `Step ${index + 1}`)
        setCurrentStepIndex(index)
      }

      // ✅ Increment using ref instead of local variable
      playbackIndexRef.current++
    }, speedMs)

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
    // ✅ CRITICAL FIX: Removed currentStepIndex from dependencies
    // This prevents the effect from restarting on every step
    // Dependencies: only aiSolving, isPaused, speed, steps, and isSolved
  }, [aiSolving, isPaused, speed, stream?.steps, isSolved])

  // Start new game
  const startNewGame = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      // Reset goal reached flag when starting new game
      goalReachedRef.current = false
      // ✅ Reset playback index when starting new game
      playbackIndexRef.current = 0
      
      const res = await gameService.newEightPuzzle()
      
      console.log('[8-PUZZLE] New game:', {
        sessionId: res.session_id,
        board: res.board,
        optimalMoves: res.optimal_moves,
        blankPos: res.blank_pos,
      })

      setSessionId(res.session_id)
      setBoard(res.board)
      setBoardHistory([res.board])
      setHistoryIndex(0)
      setOptimalMoves(res.optimal_moves)
      setMoveCount(0)
      setIsSolved(false)
      setAiSolving(false)
      setCurrentStepIndex(0)
      setCurrentExplanation('')
      setInvalidMove(false)
      setShowHint(false)
    } catch (err) {
      console.error('[8-PUZZLE] Error:', err)
      setError('Failed to start game')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check if tile is adjacent to blank
  const isAdjacentToBlank = (tileIndex: number): boolean => {
    const blankIndex = board.indexOf(0)
    if (blankIndex === -1) return false

    const blankRow = Math.floor(blankIndex / 3)
    const blankCol = blankIndex % 3
    const tileRow = Math.floor(tileIndex / 3)
    const tileCol = tileIndex % 3

    return Math.abs(blankRow - tileRow) + Math.abs(blankCol - tileCol) === 1
  }

  // Handle tile click
  const handleTileClick = useCallback(
    async (tileIndex: number) => {
      if (!sessionId || isSolved || aiSolving) return
      if (board[tileIndex] === 0) return // Empty space
      if (!isAdjacentToBlank(tileIndex)) {
        setInvalidMove(true)
        setTimeout(() => setInvalidMove(false), 1500)
        return
      }

      try {
        const res = await gameService.moveEightPuzzle({
          session_id: sessionId,
          tile_pos: tileIndex,
        })
        
        // Add to history and remove any future states if we were in the past
        const newHistory = boardHistory.slice(0, historyIndex + 1)
        newHistory.push(res.board)
        setBoardHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        
        setBoard(res.board)
        setMoveCount(res.move_count)
        setIsSolved(res.is_solved)
        setShowHint(false)
      } catch (err) {
        console.error('[8-PUZZLE] Move error:', err)
        setInvalidMove(true)
        setTimeout(() => setInvalidMove(false), 1500)
      }
    },
    [sessionId, board, isSolved, aiSolving, boardHistory, historyIndex]
  )

  // Undo move
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && !aiSolving && !isSolved) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setBoard(boardHistory[newIndex])
      setMoveCount(newIndex)
      setShowHint(false)
    }
  }, [historyIndex, boardHistory, aiSolving, isSolved])

  // Redo move
  const handleRedo = useCallback(() => {
    if (historyIndex < boardHistory.length - 1 && !aiSolving && !isSolved) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setBoard(boardHistory[newIndex])
      setMoveCount(newIndex)
      setShowHint(false)
    }
  }, [historyIndex, boardHistory, aiSolving, isSolved])

  // Start AI solving
  const solvePuzzle = useCallback(() => {
    // ✅ CRITICAL: Prevent solving if puzzle is already solved
    if (!sessionId || aiSolving || isSolved || goalReachedRef.current) return
    // ✅ Reset playback index when starting to solve
    playbackIndexRef.current = 0
    setAiSolving(true)
    setIsPaused(false)
    setCurrentStepIndex(0)
    setCurrentExplanation('Solving puzzle with A* algorithm...')
  }, [sessionId, aiSolving, isSolved])

  // Get hint - suggest next move
  const getHint = useCallback(async () => {
    if (!sessionId || isSolved || aiSolving || loadingHint) return
    
    setLoadingHint(true)
    try {
      // Use the game session to get a hint
      // We'll make a call to solve from current state and get the first move
      const API_URL = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API_URL}/api/games/eightpuzzle/${sessionId}/hint`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (res.ok) {
        const data = await res.json()
        setHintMove(data.tile_pos)
        setHintExplanation(data.explanation)
        setShowHint(true)
      }
    } catch (err) {
      console.error('[8-PUZZLE] Hint error:', err)
      // Fallback: generate hint locally by finding adjacent tiles to blank
      const blankIdx = board.indexOf(0)
      if (blankIdx !== -1) {
        const adjacent = []
        const row = Math.floor(blankIdx / 3)
        const col = blankIdx % 3
        if (row > 0) adjacent.push(blankIdx - 3)
        if (row < 2) adjacent.push(blankIdx + 3)
        if (col > 0) adjacent.push(blankIdx - 1)
        if (col < 2) adjacent.push(blankIdx + 1)
        
        if (adjacent.length > 0) {
          const randomTile = adjacent[Math.floor(Math.random() * adjacent.length)]
          setHintMove(randomTile)
          setHintExplanation(`Try moving the tile with number ${board[randomTile]} into the empty space.`)
          setShowHint(true)
        }
      }
    } finally {
      setLoadingHint(false)
    }
  }, [sessionId, isSolved, aiSolving, loadingHint, board])

  // Clear hint when hint button is used
  useEffect(() => {
    if (moveCount > 0) {
      setShowHint(false)
      setHintMove(null)
      setHintExplanation(null)
    }
  }, [moveCount])

  // Get arrow direction
  const getArrowDirection = (tileIndex: number): string => {
    if (!isAdjacentToBlank(tileIndex) || isSolved || aiSolving) return ''
    
    const blankIndex = board.indexOf(0)
    const blankRow = Math.floor(blankIndex / 3)
    const blankCol = blankIndex % 3
    const tileRow = Math.floor(tileIndex / 3)
    const tileCol = tileIndex % 3

    if (tileRow < blankRow) return '↓'
    if (tileRow > blankRow) return '↑'
    if (tileCol < blankCol) return '→'
    if (tileCol > blankCol) return '←'
    return ''
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base,#08080f)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-opacity-50"></div>
          <p className="mt-4 text-white">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base,#08080f)] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">8-Puzzle Game</h1>
          <p className="text-white/60">Click tiles adjacent to the empty space to move them</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-300">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[250px_1fr_380px] gap-6">
          {/* Left Panel - State Info */}
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm h-fit">
            <div className="space-y-6">
              {/* Current State */}
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-400/70">Current State</p>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  {board.map((val, i) => (
                    <div
                      key={`current-${i}`}
                      className="flex h-10 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300"
                    >
                      {val === 0 ? '·' : val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal State */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold uppercase text-blue-400/70">Goal State</p>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  {GOAL_STATE.map((val, i) => (
                    <div
                      key={`goal-${i}`}
                      className="flex h-10 items-center justify-center rounded border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300"
                    >
                      {val === 0 ? '·' : val}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-white/10 pt-4 space-y-3 text-xs">
                <div>
                  <p className="text-white/60">Moves</p>
                  <p className="text-white font-bold text-lg">{moveCount} / {optimalMoves}</p>
                </div>
                <div>
                  <p className="text-white/60">Status</p>
                  <p className={`font-bold ${isSolved ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {isSolved ? '✓ SOLVED!' : 'Playing'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Panel - Game Board */}
          <main className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
              {/* Game Grid */}
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 100px)' }}>
                {board.map((val, idx) => {
                  const arrow = getArrowDirection(idx)
                  const isAdj = isAdjacentToBlank(idx)
                  
                  return (
                    <motion.button
                      key={`tile-${idx}`}
                      onClick={() => handleTileClick(idx)}
                      className="relative h-24 rounded-lg border font-bold text-2xl cursor-pointer transition-all"
                      style={{
                        background: val === 0 ? 'rgba(255,255,255,0.02)' : 'var(--bg-surface,#151521)',
                        borderColor:
                          hintMove === idx && showHint
                            ? 'rgba(249, 115, 22, 0.9)'
                            : isAdj && !isSolved && !aiSolving && val !== 0
                            ? 'rgba(107,99,255,0.8)'
                            : 'rgba(255,255,255,0.1)',
                        color: 'var(--accent,#6c63ff)',
                        boxShadow:
                          hintMove === idx && showHint
                            ? '0 0 30px rgba(249, 115, 22, 0.6), inset 0 0 20px rgba(249, 115, 22, 0.2)'
                            : isAdj && !isSolved && !aiSolving && val !== 0
                            ? '0 0 20px rgba(107,99,255,0.4)'
                            : 'none',
                        opacity: aiSolving ? 0.6 : 1,
                      }}
                      whileHover={
                        isAdj && !isSolved && !aiSolving && val !== 0 ? { scale: 1.05 } : {}
                      }
                      disabled={!isAdj || isSolved || aiSolving || val === 0}
                    >
                      {val !== 0 ? val : ''}
                      {arrow && <span className="absolute bottom-1 text-xs opacity-70">{arrow}</span>}
                    </motion.button>
                  )
                })}
              </div>

              {/* Messages */}
              {invalidMove && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/20 border border-red-500 rounded px-4 py-2 text-red-300 text-sm"
                >
                  Only move tiles adjacent to the empty space
                </motion.div>
              )}

              {isSolved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/20 border border-emerald-500 rounded-lg px-6 py-4 text-center"
                >
                  <div className="text-2xl font-bold text-emerald-300">✓ SOLVED!</div>
                  <div className="text-sm text-emerald-300/80">Moves: {moveCount}</div>
                </motion.div>
              )}

              {/* Explanation from AI */}
              {aiSolving && currentExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 border border-white/10 rounded p-4 text-center text-sm text-white/80 max-w-md"
                >
                  {currentExplanation}
                </motion.div>
              )}

              {/* Hint Explanation */}
              {showHint && hintExplanation && !aiSolving && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-500/20 border border-orange-500 rounded p-4 text-center text-sm text-orange-300 max-w-md"
                >
                  <div className="font-semibold mb-1">💡 Hint</div>
                  {hintExplanation}
                </motion.div>
              )}

              {/* Control Buttons */}
              <div className="flex flex-col gap-4 items-center w-full">
                {/* Top Row - New Game */}
                <Button onClick={startNewGame} variant="secondary" size="sm" className="w-full">
                  New Game
                </Button>
                
                {!aiSolving && !isSolved && sessionId && (
                  <>
                    {/* Second Row - Solve & Hint */}
                    <div className="flex gap-3 justify-center w-full">
                      <Button onClick={solvePuzzle} size="sm" className="flex-1">
                        Solve Puzzle
                      </Button>
                      <Button onClick={getHint} variant="secondary" size="sm" disabled={loadingHint} className="flex-1">
                        {loadingHint ? '🤔 Getting hint...' : '💡 Get Hint'}
                      </Button>
                    </div>
                    
                    {/* Third Row - Undo & Redo */}
                    <div className="flex gap-3 justify-center w-full">
                      <Button 
                        onClick={handleUndo} 
                        variant="secondary" 
                        size="sm"
                        disabled={historyIndex <= 0}
                        className="flex-1"
                      >
                        ↶ Undo
                      </Button>
                      <Button 
                        onClick={handleRedo} 
                        variant="secondary" 
                        size="sm"
                        disabled={historyIndex >= boardHistory.length - 1}
                        className="flex-1"
                      >
                        ↷ Redo
                      </Button>
                    </div>
                  </>
                )}
                
                {aiSolving && (
                  <Button
                    onClick={() => setIsPaused(!isPaused)}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </Button>
                )}
              </div>

              {/* Speed Controls */}
              {aiSolving && (
                <div className="flex gap-2">
                  {[0.5, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        speed === s
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Right Panel - AI Tutor */}
          {aiSolving && stream?.steps && stream.steps.length > 0 ? (
            <TutorPanel
              gameId="eightpuzzle"
              steps={stream.steps}
              isStreaming={false}
              currentStepIndex={currentStepIndex}
              onNext={() => {
                setIsPaused(true)
                setCurrentStepIndex(Math.min(stream.steps.length - 1, currentStepIndex + 1))
              }}
              onPrev={() => {
                setIsPaused(true)
                setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
              }}
              onPause={() => setIsPaused(true)}
              onResume={() => setIsPaused(false)}
              onSpeedChange={(s) => setSpeed(s)}
              sessionId={sessionId || ''}
              boardState={JSON.stringify(board)}
            />
          ) : (
            <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm h-fit">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white mb-2">How to Play</h3>
                  <ul className="text-xs text-white/70 space-y-1">
                    <li>• Click tiles next to empty space</li>
                    <li>• Arrange numbers 1-8 in order</li>
                    <li>• Empty space goes in bottom-right</li>
                  </ul>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <h3 className="font-bold text-white mb-2">AI Algorithm</h3>
                  <p className="text-xs text-white/70">
                    Click "Solve Puzzle" to watch the AI solve it using the A* search algorithm with Manhattan distance heuristic.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
