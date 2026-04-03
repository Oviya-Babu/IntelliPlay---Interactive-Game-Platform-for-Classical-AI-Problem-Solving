import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Badge, Card } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'

const GOAL_STATE = { m_left: 0, c_left: 0, boat: 1 }

export default function MissionariesRefactored() {
  const navigate = useNavigate()
  
  // Game state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mLeft, setMLeft] = useState(3)
  const [cLeft, setCLeft] = useState(3)
  const [boatSide, setBoatSide] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Selection state
  const [selectedM, setSelectedM] = useState(0)
  const [selectedC, setSelectedC] = useState(0)

  // AI and history
  const [aiSolving, setAiSolving] = useState(false)
  const [aiPaused, setAiPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [moveHistory, setMoveHistory] = useState<Array<{ m: number; c: number; m_left: number; c_left: number; boat: number }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Messages
  const [aiMessage, setAiMessage] = useState('Welcome! Click missionaries or cannibals to select them, then click Move.')
  const [invalidMove, setInvalidMove] = useState(false)

  const stream = useAIStream(aiSolving ? sessionId : null, 'missionaries')
  const playbackIntervalRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)

  // Initialize game
  useEffect(() => {
    startNewGame()
  }, [])

  // Check if solved
  useEffect(() => {
    if (mLeft === 0 && cLeft === 0 && boatSide === 1) {
      setIsSolved(true)
      setAiMessage('🎉 Congratulations! You solved the puzzle!')
      
      const elapsed = useGameStore.getState().getElapsedMs()
      const hintsUsed = useGameStore.getState().hintsUsed
      const livesLost = useGameStore.getState().livesLost
      const s = calcStars({ movesUsed: moveCount, optimalMoves, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves, hintsUsed, livesLost, difficulty: 3 })
      
      useProgressStore.getState().completeLevel('missionaries', s, score, elapsed)
    }
  }, [mLeft, cLeft, boatSide])

  const startNewGame = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const res = await gameService.newMissionaries()
      
      setSessionId(res.session_id)
      setMLeft(res.state.m_left)
      setCLeft(res.state.c_left)
      setBoatSide(res.state.boat_side)
      setOptimalMoves(res.optimal_moves)
      setMoveCount(0)
      setIsSolved(false)
      setSelectedM(0)
      setSelectedC(0)
      setMoveHistory([])
      setHistoryIndex(-1)
      setAiMessage('Welcome! Click missionaries or cannibals to select them.')
      
      useGameStore.getState().startGame('missionaries')
    } catch (err) {
      console.error('Failed to start game:', err)
      setError('Failed to start game')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Validate move
  const isValidMove = useCallback((m: number, c: number): { valid: boolean; reason?: string } => {
    if (m + c === 0) return { valid: false, reason: 'Select at least 1 person' }
    if (m + c > 2) return { valid: false, reason: 'Max 2 people per trip' }

    let newMLeft = mLeft, newCLeft = cLeft
    if (boatSide === 0) {
      newMLeft -= m
      newCLeft -= c
    } else {
      newMLeft += m
      newCLeft += c
    }

    // Check constraints
    if (newMLeft > 0 && newCLeft > newMLeft) {
      return { valid: false, reason: 'Cannibals would eat missionaries on left' }
    }
    if (newMLeft < 3 && (3 - newMLeft) > 0) {
      const mRight = 3 - newMLeft
      const cRight = 3 - newCLeft
      if (mRight > 0 && cRight > mRight) {
        return { valid: false, reason: 'Cannibals would eat missionaries on right' }
      }
    }

    return { valid: true }
  }, [mLeft, cLeft, boatSide])

  // Handle move
  const handleMove = useCallback(async () => {
    if (isSolved || aiSolving) return

    const validation = isValidMove(selectedM, selectedC)
    if (!validation.valid) {
      setAiMessage(`❌ ${validation.reason}`)
      setInvalidMove(true)
      setTimeout(() => setInvalidMove(false), 1500)
      return
    }

    try {
      const res = await gameService.moveMissionaries({
        session_id: sessionId!,
        missionaries: selectedM,
        cannibals: selectedC,
      })

      const newHistory = moveHistory.slice(0, historyIndex + 1)
      newHistory.push({
        m: selectedM,
        c: selectedC,
        m_left: res.state.m_left,
        c_left: res.state.c_left,
        boat: res.state.boat_side,
      })
      setMoveHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)

      setMLeft(res.state.m_left)
      setCLeft(res.state.c_left)
      setBoatSide(res.state.boat_side)
      setMoveCount(moveCount + 1)
      setSelectedM(0)
      setSelectedC(0)
      setAiMessage(`✓ Good move! Moved ${selectedM}M + ${selectedC}C across.`)
    } catch (err: any) {
      setAiMessage(`❌ ${err.response?.data?.detail || 'Invalid move'}`)
      setInvalidMove(true)
      setTimeout(() => setInvalidMove(false), 1500)
    }
  }, [isSolved, aiSolving, selectedM, selectedC, sessionId, moveHistory, historyIndex, moveCount, isValidMove])

  // Undo move
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && !aiSolving && !isSolved) {
      const newIndex = historyIndex - 1
      const prev = moveHistory[newIndex]
      setMLeft(prev.m_left)
      setCLeft(prev.c_left)
      setBoatSide(prev.boat)
      setHistoryIndex(newIndex)
      setMoveCount(newIndex + 1)
      setSelectedM(0)
      setSelectedC(0)
      setAiMessage('Undo complete.')
    }
  }, [historyIndex, moveHistory, aiSolving, isSolved])

  // Get hint
  const handleHint = useCallback(async () => {
    if (!sessionId || isSolved || aiSolving) return

    try {
      const res = await fetch(`/api/games/missionaries/${sessionId}/hint`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setAiMessage(`💡 Hint: ${data.explanation}`)
      }
    } catch (err) {
      setAiMessage('Could not generate hint.')
    }
  }, [sessionId, isSolved, aiSolving])

  // Auto-solve
  const handleAutoSolve = useCallback(() => {
    if (!sessionId || isSolved || aiSolving) return
    setAiSolving(true)
    setAiPaused(false)
    currentIndexRef.current = 0
    isPlayingRef.current = true
    setAiMessage('🤖 AI is solving...')
  }, [sessionId, isSolved, aiSolving])

  // AI playback loop
  useEffect(() => {
    if (!stream?.steps || stream.steps.length === 0) return
    if (!aiSolving || aiPaused || !isPlayingRef.current) {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
      return
    }

    const steps = stream.steps
    const speedMs = speed === 0.5 ? 800 : speed === 1 ? 500 : speed === 2 ? 250 : 100

    playbackIntervalRef.current = window.setInterval(() => {
      if (!isPlayingRef.current) {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
          playbackIntervalRef.current = null
        }
        return
      }

      const index = currentIndexRef.current

      if (index >= steps.length) {
        // Done
        isPlayingRef.current = false
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
          playbackIntervalRef.current = null
        }
        setAiSolving(false)
        setAiMessage('✅ Solution complete!')
        return
      }

      const step = steps[index] as any
      if (step?.state) {
        setMLeft(step.state.m_left)
        setCLeft(step.state.c_left)
        setBoatSide(step.state.boat)
        setAiMessage(step.explanation || `Step ${index + 1}`)
      }

      currentIndexRef.current++
    }, speedMs)

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
        playbackIntervalRef.current = null
      }
    }
  }, [aiSolving, aiPaused, speed, stream?.steps])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
          <p className="mt-4 text-white">Loading game...</p>
        </div>
      </div>
    )
  }

  const mRight = 3 - mLeft
  const cRight = 3 - cLeft

  return (
    <div className="w-full p-4" style={{ background: 'var(--bg-base, #08080f)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Missionaries & Cannibals</h1>
          <p className="text-white/60">Get everyone across without cannibals eating missionaries!</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-300">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[350px_1fr_300px] gap-6">
          {/* LEFT PANEL - AI Tutor */}
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm h-fit">
            <div className="space-y-4">
              <h3 className="font-bold text-white text-lg">AI Tutor</h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                <p className="text-sm text-white/80">{aiMessage}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleHint} variant="secondary" size="sm" fullWidth disabled={isSolved || aiSolving}>
                  💡 Get Hint
                </Button>
                <Button onClick={handleAutoSolve} variant="secondary" size="sm" fullWidth disabled={isSolved || aiSolving}>
                  🤖 Auto Solve
                </Button>
              </div>
            </div>
          </aside>

          {/* CENTER PANEL - Game Area */}
          <main className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="space-y-8">
              {/* River with banks */}
              <div className="space-y-4">
                {/* Left Bank */}
                <div className="rounded-xl border-2 border-blue-500/30 bg-blue-500/10 p-6">
                  <p className="text-xs uppercase text-blue-400/70 font-semibold mb-4">Left Bank</p>
                  <div className="grid grid-cols-6 gap-3">
                    {/* Missionaries */}
                    {Array.from({ length: mLeft }).map((_, i) => (
                      <motion.button
                        key={`m-left-${i}`}
                        onClick={() => {
                          if (!isSolved && !aiSolving && boatSide === 0) {
                            setSelectedM(selectedM + 1)
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all ${
                          selectedM > i && boatSide === 0
                            ? 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/50'
                            : 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/50'
                        }`}
                      >
                        👔
                      </motion.button>
                    ))}
                    {/* Cannibals */}
                    {Array.from({ length: cLeft }).map((_, i) => (
                      <motion.button
                        key={`c-left-${i}`}
                        onClick={() => {
                          if (!isSolved && !aiSolving && boatSide === 0) {
                            setSelectedC(selectedC + 1)
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all ${
                          selectedC > i && boatSide === 0
                            ? 'bg-red-500 text-white border-2 border-red-400 shadow-lg shadow-red-500/50'
                            : 'bg-red-500/30 text-red-300 border-2 border-red-500/50'
                        }`}
                      >
                        🔱
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* River with boat */}
                <motion.div
                  animate={{ x: boatSide === 0 ? -20 : 20 }}
                  className="flex justify-between items-center px-4 py-6 rounded-xl border-2 border-cyan-500/30 bg-cyan-500/10 relative h-24"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-cyan-400/50 font-semibold">~ RIVER ~</p>
                  </div>
                  {boatSide === 0 && (
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <div className="text-4xl">🚤</div>
                    </motion.div>
                  )}
                  {boatSide === 1 && (
                    <motion.div className="ml-auto" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <div className="text-4xl">🚤</div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Right Bank */}
                <div className="rounded-xl border-2 border-purple-500/30 bg-purple-500/10 p-6">
                  <p className="text-xs uppercase text-purple-400/70 font-semibold mb-4">Right Bank</p>
                  <div className="grid grid-cols-6 gap-3">
                    {/* Missionaries */}
                    {Array.from({ length: mRight }).map((_, i) => (
                      <motion.button
                        key={`m-right-${i}`}
                        onClick={() => {
                          if (!isSolved && !aiSolving && boatSide === 1) {
                            setSelectedM(selectedM + 1)
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all ${
                          selectedM > i && boatSide === 1
                            ? 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/50'
                            : 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500/50'
                        }`}
                      >
                        👔
                      </motion.button>
                    ))}
                    {/* Cannibals */}
                    {Array.from({ length: cRight }).map((_, i) => (
                      <motion.button
                        key={`c-right-${i}`}
                        onClick={() => {
                          if (!isSolved && !aiSolving && boatSide === 1) {
                            setSelectedC(selectedC + 1)
                          }
                        }}
                        whileHover={{ scale: 1.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all ${
                          selectedC > i && boatSide === 1
                            ? 'bg-red-500 text-white border-2 border-red-400 shadow-lg shadow-red-500/50'
                            : 'bg-red-500/30 text-red-300 border-2 border-red-500/50'
                        }`}
                      >
                        🔱
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {invalidMove && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm"
                >
                  Invalid move!
                </motion.div>
              )}

              {isSolved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500/20 border border-emerald-500 rounded text-center"
                >
                  <div className="text-2xl font-bold text-emerald-300">✓ SOLVED!</div>
                  <div className="text-sm text-emerald-300/80">Moves: {moveCount} / {optimalMoves}</div>
                </motion.div>
              )}
            </div>
          </main>

          {/* RIGHT PANEL - Controls */}
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm h-fit">
            <div className="space-y-6">
              {/* Selection display */}
              <div>
                <p className="text-xs uppercase text-white/60 font-semibold mb-3">Selected for boat</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center">
                    <p className="text-2xl">👔</p>
                    <p className="text-xs text-emerald-300 font-bold">{selectedM}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-center">
                    <p className="text-2xl">🔱</p>
                    <p className="text-xs text-red-300 font-bold">{selectedC}</p>
                  </div>
                </div>
              </div>

              {/* Move controls */}
              <div className="space-y-2">
                <Button
                  onClick={handleMove}
                  disabled={isSolved || aiSolving || selectedM + selectedC === 0}
                  fullWidth
                >
                  → Move
                </Button>
                {selectedM > 0 || selectedC > 0 ? (
                  <Button
                    onClick={() => {
                      setSelectedM(0)
                      setSelectedC(0)
                    }}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    Clear Selection
                  </Button>
                ) : null}
              </div>

              {/* History controls */}
              <div className="border-t border-white/10 pt-4">
                <Button
                  onClick={handleUndo}
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={historyIndex <= 0 || aiSolving || isSolved}
                >
                  ↶ Undo
                </Button>
              </div>

              {/* Stats */}
              <div className="border-t border-white/10 pt-4 space-y-3 text-xs">
                <div>
                  <p className="text-white/60">Moves</p>
                  <p className="text-white font-bold text-lg">{moveCount} / {optimalMoves}</p>
                </div>
                <div>
                  <p className="text-white/60">Boat Position</p>
                  <p className="text-white font-bold">{boatSide === 0 ? 'Left' : 'Right'}</p>
                </div>
              </div>

              {/* AI controls */}
              {aiSolving && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  <Button
                    onClick={() => setAiPaused(!aiPaused)}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    {aiPaused ? '▶ Resume' : '⏸ Pause'}
                  </Button>
                  <div className="flex gap-2">
                    {[0.5, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`px-2 py-1 rounded text-xs font-bold flex-1 ${
                          speed === s
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New Game */}
              <div className="pt-4 border-t border-white/10">
                <Button onClick={startNewGame} variant="secondary" size="sm" fullWidth>
                  New Game
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
