import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { gameService } from '@/services/gameService'
import { useAIStream } from '@/hooks/useAIStream'
import AIThinkingPanel from './AIThinkingPanel'
import { useGameStore } from '@/store/gameStore'
import { useProgressStore } from '@/store/progressStore'
import { calcScore, calcStars } from '@/utils/starCalculator'
import HowToPlay from '@/components/learn/HowToPlay'
import ConceptCard from '@/components/learn/ConceptCard'
import WhyThisMove from '@/components/learn/WhyThisMove'

interface LetterBoxProps {
  letter: string
  assignment: Record<string,number>
  selected: string | null
  conflictLetter: string | null
  domainSize: number
  isSolved: boolean
  onSelect: (l: string) => void
}

function LetterBox({ letter, assignment, selected, conflictLetter, domainSize, isSolved, onSelect }: LetterBoxProps) {
  const isSelected = selected === letter
  const isConflict = conflictLetter === letter
  const digit = assignment[letter]
  
  return (
    <div
      onClick={() => onSelect(letter)}
      style={{
        width: 52, height: 64,
        border: isConflict ? '2px solid #ef4444'
              : isSelected ? '2px solid var(--accent)'
              : isSolved ? '2px solid #10b981'
              : '1px solid var(--border-default)',
        borderRadius: 8,
        background: isConflict ? 'rgba(239,68,68,0.15)'
                  : isSelected ? 'rgba(108,99,255,0.15)' 
                  : isSolved ? 'rgba(16,185,129,0.1)'
                  : 'var(--bg-surface)',
        cursor: isSolved ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1 }}>{letter}</span>
      <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, marginTop: 2,
                     color: digit !== undefined ? 'var(--accent)' : 'var(--text-primary)' }}>
        {digit !== undefined ? digit : '?'}
      </span>
      <span style={{ position: 'absolute', bottom: -18, fontSize: 10, color: 'var(--text-muted, #71717a)', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {domainSize} options
      </span>
    </div>
  )
}

const PRESETS = [
  'SEND + MORE = MONEY',
  'CROSS + ROADS = DANGER',
  'BASE + BALL = GAMES',
  'EAT + THAT = APPLE',
  'POINT + ZERO = ENERGY',
  'GREEN + GREEN = YELLOW',
  'WATER + WATER = RIVER',
  'APPLE + LEMON = BANANA',
  'SUN + MOON = STARS',
  'EARTH + VENUS = PLANET',
  'BLACK + GREEN = COLORS',
  'RIGHT + WRONG = TRUTH',
  'HAPPY + HAPPY = JOYFUL'
]

export default function Cryptarith() {
  const navigate = useNavigate()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [equation, setEquation] = useState(PRESETS[0])
  const [letters, setLetters] = useState<string[]>([])
  const [leadingLetters, setLeadingLetters] = useState<string[]>([])
  const [domains, setDomains] = useState<Record<string, number[]>>({})
  const [assignment, setAssignment] = useState<Record<string, number>>({})
  const [isSolved, setIsSolved] = useState(false)
  const [isContradiction, setIsContradiction] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [flashingLetters, setFlashingLetters] = useState<string[]>([])
  const [aiSolving, setAiSolving] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [moveCount, setMoveCount] = useState(0)
  const [resultData, setResultData] = useState<any>(null)

  useEffect(() => { startGame() }, [])

  const stream = useAIStream(aiSolving ? sessionId : null, 'cryptarith')

  // Auto-apply AI steps
  const lastAppliedStepRef = useRef(-1)
  useEffect(() => {
    if (!aiSolving || !stream.currentStep) return
    const step = stream.currentStep
    if (step.step_id <= lastAppliedStepRef.current) return
    lastAppliedStepRef.current = step.step_id
    const stateData = step.state as { assignment?: Record<string, number> }
    if (stateData?.assignment) {
      setAssignment({ ...stateData.assignment })
    }
  }, [stream.currentStep, aiSolving])

  useEffect(() => {
    if (!stream.isStreaming && aiSolving && stream.steps.length > 0) {
      setAiSolving(false)
      if (Object.keys(assignment).length === letters.length) {
        setIsSolved(true)
      }
    }
  }, [stream.isStreaming, aiSolving, stream.steps.length, assignment, letters.length])

  const { getElapsedMs, hintsUsed, livesLost } = useGameStore()
  const { completeLevel } = useProgressStore()

  useEffect(() => {
    if (isSolved) {
      const elapsed = getElapsedMs()
      const optimal = letters.length || 10
      const s = calcStars({ movesUsed: moveCount, optimalMoves: optimal, timeMs: elapsed, hintsUsed, livesLost })
      const score = calcScore({ movesUsed: moveCount, optimalMoves: optimal, hintsUsed, livesLost, difficulty: 5 })
      completeLevel('cryptarith', s, score, elapsed)
      setResultData({ gameId: 'cryptarith', stars: s, score, movesUsed: moveCount, optimalMoves: optimal, timeMs: elapsed })
    }
  }, [isSolved])

  const startGame = useCallback(async (eq?: string) => {
    const e = eq ?? equation
    try {
      const res = await gameService.newCryptarith(e)
      setSessionId(res.session_id)
      setEquation(res.equation)
      setLetters(res.letters)
      setLeadingLetters(res.leading_letters)
      setDomains(res.domains)
      setAssignment({})
      setIsSolved(false)
      setIsContradiction(false)
      setSelectedLetter(null)
      setAiSolving(false)
      setMoveCount(0)
      lastAppliedStepRef.current = -1
      useGameStore.getState().startGame('cryptarith')
    } catch (e) {
      console.error('Failed to start cryptarith', e)
    }
  }, [equation])

  const handleLetterClick = (letter: string) => {
    if (isSolved || aiSolving) return
    if (selectedLetter === letter) {
      setSelectedLetter(null)
    } else {
      setSelectedLetter(letter)
    }
  }

  const handleDigitClick = useCallback(async (digit: number) => {
    if (!sessionId || !selectedLetter || isSolved || aiSolving) return

    try {
      const res = await gameService.assignCryptarith({
        session_id: sessionId,
        letter: selectedLetter,
        digit,
      })
      setAssignment(res.assignment)
      setIsSolved(res.is_solved)
      setIsContradiction(res.is_contradiction)
      setSelectedLetter(null)
      setMoveCount(c => c + 1)

      // Update domains: remove assigned digit from others
      const newDomains = { ...domains }
      for (const l of letters) {
        if (res.assignment[l] !== undefined) {
          newDomains[l] = [res.assignment[l]]
        }
      }
      setDomains(newDomains)
    } catch {
      // 422 = duplicate digit
      const conflicting = Object.entries(assignment).find(([, d]) => d === digit)
      if (conflicting) {
        setFlashingLetters([selectedLetter, conflicting[0]])
        setTimeout(() => setFlashingLetters([]), 600)
      }
    }
  }, [sessionId, selectedLetter, isSolved, aiSolving, domains, letters, assignment])

  const watchAISolve = useCallback(() => {
    if (!sessionId) return
    setAiSolving(true)
    lastAppliedStepRef.current = -1
  }, [sessionId])

  const handleSpeedChange = (s: number) => {
    setSpeed(s)
    stream.sendControl({ type: 'set_speed', delay_ms: Math.round(1200 / s) })
  }

  // Parse equation for display
  const parts = equation.replace('=', '+').split('+').map(p => p.trim())
  const word1 = parts[0] || ''
  const word2 = parts[1] || ''
  const result = parts[2] || ''

  // Compute numeric values if fully assigned
  const getNumericWord = (word: string) => {
    const digits = word.split('').map(ch => assignment[ch])
    if (digits.some(d => d === undefined)) return null
    return parseInt(digits.join(''), 10)
  }

  const num1 = getNumericWord(word1)
  const num2 = getNumericWord(word2)
  const numR = getNumericWord(result)

  // Assigned digits set for constraint display
  const assignedDigits = new Set(Object.values(assignment))
  const allUnique = assignedDigits.size === Object.keys(assignment).length
  const sumCorrect = num1 !== null && num2 !== null && numR !== null && num1 + num2 === numR

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
          <HowToPlay gameId="cryptarith" />
          <div className="flex items-center gap-4 w-full justify-between">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary, #f1f0fe)' }}>Cryptarithmetic</h2>
            <div className="flex gap-2">
              <Button onClick={() => startGame()}>Clear / Reset</Button>
            </div>
          </div>

        {/* Equation selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>Puzzle:</span>
          <select
            value={equation}
            onChange={e => { setEquation(e.target.value); startGame(e.target.value) }}
            style={{
              background: 'var(--bg-surface, #151521)',
              color: 'var(--text-primary, #f1f0fe)',
              border: '1px solid var(--border-default, #2a2a35)',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 13,
            }}
          >
            {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Equation display */}
        <div style={{ fontFamily: 'monospace', fontSize: 18, background: 'var(--bg-surface, #151521)', border: '1px solid var(--border-default)', padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {word1.split('').map((l, i) => <LetterBox key={`${l}-${i}`} letter={l} assignment={assignment} selected={selectedLetter} conflictLetter={flashingLetters.includes(l) ? l : null} domainSize={domains[l]?.length ?? 0} isSolved={isSolved} onSelect={handleLetterClick} />)}
          </div>
          
          {/* Row 2 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 24, color: 'var(--text-secondary)', marginRight: 8 }}>+</span>
            {word2.split('').map((l, i) => <LetterBox key={`${l}-${i}`} letter={l} assignment={assignment} selected={selectedLetter} conflictLetter={flashingLetters.includes(l) ? l : null} domainSize={domains[l]?.length ?? 0} isSolved={isSolved} onSelect={handleLetterClick} />)}
          </div>
          
          {/* Divider line */}
          <div style={{ borderTop: '2px solid var(--border-default)', width: '100%' }} />
          
          {/* Row 3 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {result.split('').map((l, i) => <LetterBox key={`${l}-${i}`} letter={l} assignment={assignment} selected={selectedLetter} conflictLetter={flashingLetters.includes(l) ? l : null} domainSize={domains[l]?.length ?? 0} isSolved={isSolved} onSelect={handleLetterClick} />)}
          </div>
          
        </div>

        {/* Domain bubbles */}
        <div className="flex flex-wrap gap-3 justify-center">
          {letters.map(l => (
            <div key={l} className="flex flex-col items-center gap-1">
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary, #f1f0fe)' }}>{l}</span>
              <div className="flex gap-0.5">
                {(domains[l] ?? []).map(d => {
                  const isEliminated = assignment[l] !== undefined && assignment[l] !== d
                  return (
                    <span
                      key={d}
                      style={{
                        fontSize: 10,
                        padding: '1px 3px',
                        borderRadius: 4,
                        background: isEliminated ? 'transparent' : 'var(--bg-surface-2, #1a1a28)',
                        color: isEliminated ? 'var(--text-muted, #71717a)' : 'var(--accent, #a855f7)',
                        textDecoration: isEliminated ? 'line-through' : 'none',
                        opacity: isEliminated ? 0.4 : 1,
                      }}
                    >
                      {d}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Digit palette */}
        {sessionId && !isSolved && !aiSolving && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
            <p style={{ width: '100%', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {selectedLetter 
                ? `Assigning digit to letter "${selectedLetter}" — pick below:`
                : 'Select a letter above, then pick a digit:'}
            </p>
            {[0,1,2,3,4,5,6,7,8,9].map(d => (
              <button
                key={d}
                onClick={() => handleDigitClick(d)}
                disabled={!selectedLetter}
                style={{
                  width: 52, height: 52,
                  borderRadius: 8, fontSize: 20, fontWeight: 700,
                  background: selectedLetter ? 'var(--accent)' : 'var(--bg-surface)',
                  color: '#fff',
                  border: '1px solid var(--border-default)',
                  cursor: selectedLetter ? 'pointer' : 'not-allowed',
                  opacity: selectedLetter ? 1 : 0.35,
                  transition: 'all 0.15s',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* AI + constraint panel row */}
        <div className="flex gap-6 items-start w-full">
          {/* Controls */}
          <div className="flex flex-col gap-3 flex-1">
            {sessionId && !isSolved && (
              <div className="flex items-center gap-3">
                <Button onClick={watchAISolve} disabled={aiSolving}>
                  {aiSolving ? 'Solving...' : 'Watch AI Solve'}
                </Button>
                {aiSolving && (
                  <div className="flex items-center gap-1">
                    {[0.5, 1, 2, 3].map(s => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 5,
                          fontSize: 11,
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
          </div>

          {/* Constraint panel */}
          <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ width: 200, background: 'var(--bg-surface, #151521)', border: '1px solid var(--border-default, #2a2a35)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #71717a)', textTransform: 'uppercase', letterSpacing: 1 }}>Constraints</span>

            {leadingLetters.map(l => {
              const ok = assignment[l] === undefined || assignment[l] !== 0
              return (
                <div key={l} className="flex items-center gap-2" style={{ fontSize: 12 }}>
                  <span style={{ color: ok ? '#10b981' : '#ef4444' }}>{ok ? 'v' : 'x'}</span>
                  <span style={{ color: 'var(--text-secondary, #a1a1aa)' }}>{l} {'!='} 0</span>
                </div>
              )
            })}

            <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
              <span style={{ color: allUnique ? '#10b981' : '#ef4444' }}>{allUnique ? 'v' : 'x'}</span>
              <span style={{ color: 'var(--text-secondary, #a1a1aa)' }}>All unique</span>
            </div>

            <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
              <span style={{ color: num1 === null ? '#71717a' : sumCorrect ? '#10b981' : '#ef4444' }}>
                {num1 === null ? 'o' : sumCorrect ? 'v' : 'x'}
              </span>
              <span style={{ color: 'var(--text-secondary, #a1a1aa)' }}>Sum correct</span>
            </div>
          </div>
        </div>

        {/* Solved banner */}
        <AnimatePresence>
          {isSolved && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="flex flex-col items-center gap-2"
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
              <span>Solved!</span>
              {num1 !== null && num2 !== null && numR !== null && (
                <span style={{ fontSize: 16, fontWeight: 500 }}>
                  {num1} + {num2} = {numR}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contradiction warning */}
        <AnimatePresence>
          {isContradiction && !isSolved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Contradiction! Sum does not match. Try different assignments.
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      <ConceptCard 
        gameId="cryptarith" 
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
