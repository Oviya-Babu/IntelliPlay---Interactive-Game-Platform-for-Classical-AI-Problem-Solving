import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Badge } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import AIThinkingPanel from './AIThinkingPanel'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'
import HowToPlay from '@/components/learn/HowToPlay'
import ConceptCard from '@/components/learn/ConceptCard'
import WhyThisMove from '@/components/learn/WhyThisMove'

export default function Missionaries() {
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mLeft, setMLeft] = useState(3)
  const [cLeft, setCLeft] = useState(3)
  const [boatSide, setBoatSide] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [optimalMoves, setOptimalMoves] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [aiSolving, setAiSolving] = useState(false)
  const [resultData, setResultData] = useState<any>(null)
  const [speed, setSpeed] = useState(1)

  // Selection for crossing
  const [selM, setSelM] = useState(0)
  const [selC, setSelC] = useState(0)

  useEffect(() => { startGame() }, [])

  const stream = useAIStream(aiSolving ? sessionId : null, 'missionaries')

  // Auto-apply AI steps
  const lastAppliedStepRef = useRef(-1)
  useEffect(() => {
    if (!aiSolving || !stream.currentStep) return
    const step = stream.currentStep
    if (step.step_id <= lastAppliedStepRef.current) return
    lastAppliedStepRef.current = step.step_id
    const stateData = step.state as { m_left?: number; c_left?: number; boat?: number }
    if (stateData && stateData.m_left !== undefined) {
      setMLeft(stateData.m_left)
      setCLeft(stateData.c_left ?? 0)
      setBoatSide(stateData.boat ?? 0)
      setMoveCount(prev => prev + 1)
    }
  }, [stream.currentStep, aiSolving])

  useEffect(() => {
    if (!stream.isStreaming && aiSolving && stream.steps.length > 0) {
      setAiSolving(false)
      setIsSolved(mLeft === 0 && cLeft === 0 && boatSide === 1)
    }
  }, [stream.isStreaming, aiSolving, stream.steps.length, mLeft, cLeft, boatSide])

  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()

  useEffect(() => {
    if (isSolved) {
      const elapsed = getElapsedMs()
      const s = calcStars({ movesUsed: moveCount, optimalMoves, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves, hintsUsed, livesLost, difficulty: 3 })
      completeLevel('missionaries', s, score, elapsed)
      setResultData({ gameId: 'missionaries', stars: s, score, movesUsed: moveCount, optimalMoves, timeMs: elapsed })
    }
  }, [isSolved])

  const startGame = useCallback(async () => {
    try {
      const res = await gameService.newMissionaries()
      setSessionId(res.session_id)
      setMLeft(res.state.m_left)
      setCLeft(res.state.c_left)
      setBoatSide(res.state.boat_side)
      setOptimalMoves(res.optimal_moves)
      setMoveCount(0)
      setIsSolved(false)
      setAiSolving(false)
      setSelM(0)
      setSelC(0)
      lastAppliedStepRef.current = -1
      useGameStore.getState().startGame('missionaries')
    } catch (e) {
      console.error('Failed to start missionaries', e)
    }
  }, [])

  const crossRiver = useCallback(async () => {
    if (!sessionId || isSolved || aiSolving) return
    if (selM + selC === 0 || selM + selC > 2) return

    try {
      const res = await gameService.moveMissionaries({
        session_id: sessionId,
        missionaries: selM,
        cannibals: selC,
      })
      setMLeft(res.state.m_left)
      setCLeft(res.state.c_left)
      setBoatSide(res.state.boat_side)
      setMoveCount(res.move_count)
      setIsSolved(res.is_solved)
      setSelM(0)
      setSelC(0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid move'
      setToast(msg.includes('Cannibals') ? msg : 'Invalid! Cannibals would outnumber missionaries')
      setTimeout(() => setToast(null), 2000)
    }
  }, [sessionId, selM, selC, isSolved, aiSolving])

  const watchAISolve = useCallback(() => {
    if (!sessionId) return
    setAiSolving(true)
    lastAppliedStepRef.current = -1
  }, [sessionId])

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed)
    const delayMs = Math.round(1200 / newSpeed)
    stream.sendControl({ type: 'set_speed', delay_ms: delayMs })
  }

  const mRight = 3 - mLeft
  const cRight = 3 - cLeft

  const MissionaryIcon = ({ size = 28 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="12" r="8" fill="#f1f0fe" />
      <line x1="20" y1="20" x2="20" y2="34" stroke="#f1f0fe" strokeWidth="3" />
      <line x1="12" y1="25" x2="28" y2="25" stroke="#f1f0fe" strokeWidth="3" />
      <line x1="14" y1="38" x2="20" y2="30" stroke="#f1f0fe" strokeWidth="3" />
      <line x1="26" y1="38" x2="20" y2="30" stroke="#f1f0fe" strokeWidth="3" />
      {/* Cross */}
      <line x1="20" y1="6" x2="20" y2="18" stroke="#a855f7" strokeWidth="2" />
      <line x1="15" y1="10" x2="25" y2="10" stroke="#a855f7" strokeWidth="2" />
    </svg>
  )

  const CannibalIcon = ({ size = 28 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="12" r="8" fill="#ef4444" />
      <line x1="20" y1="20" x2="20" y2="34" stroke="#ef4444" strokeWidth="3" />
      <line x1="12" y1="25" x2="28" y2="25" stroke="#ef4444" strokeWidth="3" />
      <line x1="14" y1="38" x2="20" y2="30" stroke="#ef4444" strokeWidth="3" />
      <line x1="26" y1="38" x2="20" y2="30" stroke="#ef4444" strokeWidth="3" />
    </svg>
  )

  const renderPeople = (m: number, c: number) => (
    <div className="flex flex-wrap gap-1 justify-center" style={{ maxWidth: 120 }}>
      {Array.from({ length: m }).map((_, i) => <MissionaryIcon key={`m${i}`} />)}
      {Array.from({ length: c }).map((_, i) => <CannibalIcon key={`c${i}`} />)}
    </div>
  )

  const CountControl = ({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary, #a1a1aa)', width: 80 }}>{label}</span>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-default, #2a2a35)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>-</button>
      <span className="text-lg font-bold" style={{ color: 'var(--text-primary, #f1f0fe)', width: 20, textAlign: 'center' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-default, #2a2a35)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>+</button>
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
          <HowToPlay gameId="missionaries" />
          <div className="flex items-center gap-4 w-full justify-between">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary, #f1f0fe)' }}>Missionaries & Cannibals</h2>
          <Button onClick={startGame}>New Game</Button>
        </div>

        {sessionId && (
          <Badge style={{ background: 'var(--accent, #a855f7)', color: '#fff', fontSize: 14, padding: '4px 12px' }}>
            Moves: {moveCount} / Target: {optimalMoves}
          </Badge>
        )}

        {/* River scene */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          width: '100%',
          minHeight: 200,
          gap: 0,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {/* Left bank */}
          <div style={{ flex: 1, background: 'var(--bg-surface, #151521)', border: '1px solid var(--border-default, #2a2a35)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted, #71717a)' }}>Left Bank</span>
            {renderPeople(mLeft, cLeft)}
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted, #71717a)' }}>{mLeft}M / {cLeft}C</div>
          </div>

          {/* River */}
          <div className="flex flex-col items-center justify-center" style={{ width: 80, position: 'relative', background: '#1e3a5f' }}>
            <svg width="80" height="200" viewBox="0 0 80 200">
              {/* Animated waves */}
              <motion.path
                d="M 0 30 Q 20 20, 40 30 Q 60 40, 80 30"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="transparent"
                animate={{ d: ['M 0 30 Q 20 20, 40 30 Q 60 40, 80 30', 'M 0 30 Q 20 40, 40 30 Q 60 20, 80 30'] }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              />
              <motion.path
                d="M 0 90 Q 20 80, 40 90 Q 60 100, 80 90"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="transparent"
                animate={{ d: ['M 0 90 Q 20 80, 40 90 Q 60 100, 80 90', 'M 0 90 Q 20 100, 40 90 Q 60 80, 80 90'] }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.5 }}
              />
              <motion.path
                d="M 0 150 Q 20 140, 40 150 Q 60 160, 80 150"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="transparent"
                animate={{ d: ['M 0 150 Q 20 140, 40 150 Q 60 160, 80 150', 'M 0 150 Q 20 160, 40 150 Q 60 140, 80 150'] }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.8 }}
              />
            </svg>
            {/* Boat */}
            <motion.div
              animate={{ y: boatSide === 0 ? 20 : 140 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{ position: 'absolute', left: 10, width: 60 }}
            >
              <svg width="60" height="30" viewBox="0 0 60 30">
                <path d="M 5 15 L 15 25 L 45 25 L 55 15 Z" fill="#8b5cf6" stroke="#a855f7" strokeWidth="2" />
                <line x1="30" y1="5" x2="30" y2="15" stroke="#a855f7" strokeWidth="2" />
                <polygon points="30,5 45,12 30,12" fill="#a855f7" opacity="0.6" />
              </svg>
            </motion.div>
          </div>

          {/* Right bank */}
          <div style={{ flex: 1, background: 'var(--bg-surface, #151521)', border: '1px solid var(--border-default, #2a2a35)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted, #71717a)' }}>Right Bank</span>
            {renderPeople(mRight, cRight)}
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted, #71717a)' }}>{mRight}M / {cRight}C</div>
          </div>
        </div>

        {/* Controls */}
        {sessionId && !isSolved && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {!aiSolving && (
              <>
                <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: 14 }}>
                  Select passengers (max 2 total):
                </p>
                <div className="flex gap-4 mb-2">
                  <CountControl label="Missionaries" value={selM} onChange={(v) => { if (v + selC <= 2) setSelM(v) }} max={2} />
                  <CountControl label="Cannibals" value={selC} onChange={(v) => { if (selM + v <= 2) setSelC(v) }} max={2} />
                </div>
              </>
            )}
            
            <div className="flex items-center gap-4">
              {!aiSolving && (
                <Button onClick={crossRiver} disabled={selM + selC === 0 || selM + selC > 2}>
                  Cross River {'>'}
                </Button>
              )}
              <Button onClick={watchAISolve} disabled={aiSolving} style={{ background: !aiSolving ? 'transparent' : 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                {aiSolving ? 'AI Solving...' : 'Watch AI Solve'}
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
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ef4444',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                zIndex: 100,
              }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

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
              Everyone crossed safely!
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <ConceptCard 
        gameId="missionaries" 
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
