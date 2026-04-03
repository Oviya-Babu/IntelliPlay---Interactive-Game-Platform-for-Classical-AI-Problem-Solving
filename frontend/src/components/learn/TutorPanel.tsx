import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TypewriterText } from '@/components/ui/TypewriterText'
import type { StepDict } from '@/types/ai.types'

const AGENTS = {
  tictactoe: {
    name: 'AlphaBot', avatar: '🤖',
    algorithm: 'Minimax + Alpha-Beta Pruning',
    model: 'Classical adversarial search (1950s)',
    strength: 'Perfect play — unbeatable at full depth',
    color: '#7c3aed',
    catchphrase: 'Every move I make is mathematically optimal.',
    personality: 'confident and competitive'
  },
  eightpuzzle: {
    name: 'AStarley', avatar: '🧭',
    algorithm: 'A* Heuristic Search',
    model: 'Informed search with Manhattan distance heuristic',
    strength: 'Guaranteed optimal solution path',
    color: '#0891b2',
    catchphrase: "I always know roughly how far the goal is.",
    personality: 'methodical and precise'
  },
  missionaries: {
    name: 'BFSean', avatar: '🌊',
    algorithm: 'Breadth-First Search',
    model: 'Systematic level-by-level state exploration',
    strength: 'Guarantees minimum number of crossings',
    color: '#0d9488',
    catchphrase: "I check every option here before going deeper.",
    personality: 'systematic and thorough'
  },
  nqueens: {
    name: 'Cassandra', avatar: '♛',
    algorithm: 'CSP Backtracking + Forward Checking',
    model: 'Constraint Satisfaction Problem solver',
    strength: 'Finds all 92 solutions for 8-Queens',
    color: '#b45309',
    catchphrase: "I eliminate impossibilities until only truth remains.",
    personality: 'logical and methodical'
  },
  cryptarith: {
    name: 'CipherX', avatar: '🔐',
    algorithm: 'CSP + Coefficient-based Constraint Propagation',
    model: 'Mathematical pruning via partial sum bounds',
    strength: 'Eliminates 99.98% of search space via pruning',
    color: '#be185d',
    catchphrase: "Every constraint I check saves thousands of tries.",
    personality: 'playful and clever'
  }
} as const

const QUIZZES = {
  tictactoe: [
    { q: "AlphaBot just skipped a branch without exploring it. This technique is called:", opts: ["Random skipping","Alpha-beta pruning","Depth limiting","Heuristic search"], correct: 1, explain: "Alpha-beta pruning skips branches that mathematically can't beat the current best move — like stopping a job interview the moment you find someone better than your current best candidate!" },
    { q: "AlphaBot's score is +10. What does this mean?", opts: ["You scored 10 points","Draw is forced","AlphaBot found a forced win","AlphaBot is losing"], correct: 2, explain: "Positive = AlphaBot winning, Negative = you winning, 0 = perfect draw. AlphaBot always tries to maximize this score!" },
    { q: "Why does AlphaBot always play perfectly in TicTacToe?", opts: ["It memorized all games","It looks at all 9 possible moves ahead ✓","It gets lucky","Random strategy"], correct: 1, explain: "TicTacToe has at most 9 moves total. AlphaBot searches the COMPLETE game tree — every possible future. No surprises possible!" },
    { q: "Minimax is named because:", opts: ["It uses minimum and maximum speeds","It maximizes AI score while minimizing yours ✓","A person named Mini Max invented it","It's minimum complexity"], correct: 1, explain: "MAX-imize the AI score, MIN-imize the opponent score. Two opposite goals, one elegant algorithm!" },
    { q: "If AlphaBot evaluated 2459 nodes, what is one 'node'?", opts: ["One second of computation","One possible future board state ✓","One player move","One algorithm step"], correct: 1, explain: "Each unique board arrangement is a node in the game tree. AlphaBot builds this tree mentally and finds the best leaf!" }
  ],
  eightpuzzle: [
    { q: "Manhattan distance counts:", opts: ["Distance in New York City", "Steps each tile needs horizontally + vertically to reach goal ✓", "Number of wrong tiles", "Random estimate"], correct: 1, explain: "Sum the left/right + up/down moves each tile needs, ignoring other tiles. Like counting city blocks — always an underestimate!" },
    { q: "A* always picks the node with lowest f = g + h. Here g means:", opts: ["Estimated remaining distance", "Actual moves taken from start ✓", "Goal distance", "Heuristic value"], correct: 1, explain: "g = cost so far (actual moves made). h = estimated remaining (Manhattan distance). f = g + h = total estimated path cost!" },
    { q: "Why is A* better than blind BFS for 8-Puzzle?", opts: ["It's always faster", "It uses a heuristic to aim at the goal ✓", "It uses less memory", "It finds longer paths"], correct: 1, explain: "BFS explores in all directions equally. A* uses Manhattan distance to zoom toward the goal — far fewer states explored!" },
    { q: "AStarley says optimal_moves=21. This means:", opts: ["You need roughly 21 moves", "21 is the absolute minimum ✓", "Puzzle is very hard", "AStarley needs 21 seconds"], correct: 1, explain: "A* guarantees optimality. If it says 21, no solution with fewer moves exists — proven mathematically!" },
    { q: "What makes an 8-Puzzle position unsolvable?", opts: ["Too many moves needed", "Blank in a corner", "Odd inversion count (parity) ✓", "All tiles wrong"], correct: 2, explain: "Exactly half of all 8-Puzzle configurations are unsolvable. AStarley checks inversion parity before even trying!" }
  ],
  missionaries: [
    { q: "BFS explores states level by level. Why does this guarantee shortest path?", opts: ["It's the fastest algorithm", "It fully explores depth N before N+1, so first solution = shortest ✓", "It uses a heuristic", "It backtracks"], correct: 1, explain: "Like pond ripples — BFS checks ALL states 1 move away before ANY state 2 moves away. First goal found = minimum moves. Proven!" },
    { q: "BFSean found goal at depth 11. Depth means:", opts: ["11 seconds elapsed", "Number of moves from start ✓", "Number of people moved", "States explored"], correct: 1, explain: "Depth = moves taken from initial state. BFS guarantees depth 11 is optimal — no shorter solution exists!" },
    { q: "The BFS data structure is a queue. Queue means:", opts: ["Last in, first out", "First in, first out ✓", "Random order", "Priority order"], correct: 1, explain: "FIFO (First In, First Out) ensures level-by-level exploration. Using a stack instead gives DFS — no shortest path guarantee!" },
    { q: "Why does BFSean reject some states immediately?", opts: ["Too slow to explore", "Constraint: cannibals outnumber missionaries ✓", "Already visited", "Boat too full"], correct: 1, explain: "Constraint checking eliminates invalid states before adding to queue. Less work with same correctness guarantee!" },
    { q: "BFSean explored 15 nodes. A 'node' here is:", opts: ["A crossing action", "A person", "A unique game state (M_left, C_left, boat_side) ✓", "A constraint"], correct: 2, explain: "Each unique combination of missionaries left, cannibals left, and boat position is one state/node in the search space!" }
  ],
  nqueens: [
    { q: "Forward checking eliminates values from future variables. Why is this powerful?", opts: ["Makes animation smoother", "Catches dead ends early — before wasting time exploring them ✓", "Required by chess rules", "Reduces board size"], correct: 1, explain: "Without forward checking, you'd discover conflicts much later after lots of work. FC catches problems immediately after each placement!" },
    { q: "Cassandra backtracks. This means:", opts: ["Moves the queen forward", "Removes last placed queen and tries next column ✓", "Restarts from scratch", "Checks constraints again"], correct: 1, explain: "Backtracking = undo last decision, try next option. Like solving a maze by backing up at dead ends — systematic, exhaustive!" },
    { q: "How many valid solutions exist for 8-Queens?", opts: ["1", "8", "64", "92 ✓"], correct: 3, explain: "Exactly 92 valid arrangements for 8 queens on an 8×8 board — out of 4.4 billion possible placements. Cassandra finds all of them!" },
    { q: "CSP stands for:", opts: ["Computer Science Problem", "Calculated Solution Path", "Constraint Satisfaction Problem ✓", "Chess Strategy Protocol"], correct: 2, explain: "Variables (queen positions) + Domains (valid columns) + Constraints (no attacks) = CSP. Assign values satisfying all constraints!" },
    { q: "Placing a queen at row 3 affects all future rows because:", opts: ["Boards gets smaller", "It attacks that column and diagonals in every future row ✓", "Rules change after row 3", "Random effect"], correct: 1, explain: "One queen eliminates an entire column plus two diagonal lines through all future rows. Forward checking propagates this instantly!" }
  ],
  cryptarith: [
    { q: "CipherX pruned a branch without trying those digits. Why?", opts: ["Random skip", "Even best remaining digits can't make the sum reach zero ✓", "Digit already used", "Too slow"], correct: 1, explain: "CipherX computes min/max possible sum with remaining digits. If zero is outside that range — mathematically impossible! Skip instantly!" },
    { q: "In SEND+MORE=MONEY, why must M=1?", opts: ["M is first alphabetically", "SEND<10000 and MORE<10000, so sum<20000, MONEY starts with 1 ✓", "Random assignment", "Always 1 in puzzles"], correct: 1, explain: "Maximum sum of two 4-digit numbers is 19998. MONEY is 5 digits starting with M, so M must be 1. Math eliminates 90% of search!" },
    { q: "Why must each letter map to a UNIQUE digit?", opts: ["For extra difficulty", "The cryptarithmetic rule — bijection makes it solvable and fair ✓", "Random rule", "To make it faster"], correct: 1, explain: "Shared digits would create trivial or ambiguous solutions. Uniqueness is what makes cryptarithmetic a genuine mathematical puzzle!" },
    { q: "CipherX tried 847 assignments. Without pruning, it would need:", opts: ["848 tries", "About the same", "10! = 3,628,800 tries ✓", "Infinite tries"], correct: 2, explain: "10 digits, 8 letters = 10!/2! = 1,814,400 ordered assignments without pruning. CipherX eliminated 99.95% via constraint propagation!" },
    { q: "'Leading letter cannot be zero' means:", opts: ["Letter Z is special", "First letter of each word cannot map to 0 ✓", "Zero not a valid digit", "Counting starts at 1"], correct: 1, explain: "SEND with S=0 would really be a 3-digit number (0END=END). Leading zeros make arithmetic nonsensical, so they're forbidden!" }
  ]
}

interface TutorPanelProps {
  gameId: keyof typeof AGENTS
  steps: StepDict[]
  isStreaming: boolean
  currentStepIndex: number
  onNext: () => void
  onPrev: () => void
  onPause: () => void
  onResume: () => void
  onSpeedChange: (ms: number) => void
  sessionId: string | null
  boardState: string
}

export default function TutorPanel({
  gameId, steps, isStreaming, currentStepIndex,
  onNext, onPrev, onPause, onResume, onSpeedChange,
  sessionId, boardState
}: TutorPanelProps) {
  const agent = AGENTS[gameId]
  const currentStep = steps[currentStepIndex]
  const totalSteps = steps.length
  
  const [speed, setSpeed] = useState(1200)

  // Quiz State
  const [quizActive, setQuizActive] = useState(false)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null)
  const [quizzesShown, setQuizzesShown] = useState<number[]>([])

  useEffect(() => {
    // Show quiz every 5 steps (max 3 times)
    if (currentStepIndex > 0 && currentStepIndex % 5 === 0 && quizzesShown.length < 3) {
       // pick a random quiz not shown yet
       const pool = QUIZZES[gameId].map((_, i) => i).filter(i => !quizzesShown.includes(i))
       if (pool.length > 0) {
         const pick = pool[Math.floor(Math.random() * pool.length)]
         setQuizIndex(pick)
         setQuizActive(true)
         setQuizAnswered(null)
         setQuizzesShown([...quizzesShown, pick])
         onPause()
       }
    }
  }, [currentStepIndex, gameId, quizzesShown, onPause])

  const handleQuizAnswer = (idx: number) => {
    setQuizAnswered(idx)
    setTimeout(() => {
      setQuizActive(false)
      onResume()
    }, 4500)
  }

  // Chat State
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{role: 'user'|'agent', content: string}[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const sendChat = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !sessionId) return
    const msg = chatInput.trim()
    setChatInput('')
    setMessages(p => [...p, {role: 'user', content: msg}])
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          session_id: sessionId,
          question: msg,
          current_explanation: currentStep?.explanation || '',
          board_state: boardState
        })
      })
      const data = await res.json()
      setMessages(p => [...p, {role: 'agent', content: data.answer}])
    } catch(err) {
      setMessages(p => [...p, {role: 'agent', content: "I'm having trouble thinking right now. Check my explanation panel!"}])
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Color mappings
  const actionColor = (action?: string) => {
    if (!action) return 'transparent'
    const a = action.toLowerCase()
    if (a.includes('evaluat')) return 'var(--info, #3b82f6)'
    if (a.includes('prun') || a.includes('invalid')) return 'var(--warning, #f59e0b)'
    if (a.includes('backtrack')) return 'var(--destructive, #ef4444)'
    if (a.includes('solut') || a.includes('best')) return 'var(--success, #10b981)'
    return 'var(--accent, #6c63ff)'
  }

  const bg = 'var(--bg-surface, #151521)'
  const border = '1px solid var(--border-default, #2a2a35)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      
      {/* SECTION 1: Agent Identity */}
      <div style={{ background: bg, border, borderLeft: `4px solid ${agent.color}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 32 }}>{agent.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 'bold' }}>{agent.name}</span>
              {isStreaming ? (
                <span style={{ fontSize: 10, fontWeight: 'bold', color: agent.color, animation: 'blink 1.5s infinite' }}>THINKING...</span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--success, #10b981)' }}>READY</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{agent.algorithm}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.model}</div>
        <div style={{ fontSize: 12, color: agent.color, fontStyle: 'italic', marginTop: 8 }}>"{agent.catchphrase}"</div>
      </div>

      {/* SECTION 2 & 4: Core Area (Hero / Quiz) */}
      <div style={{ background: bg, border, borderRadius: 12, overflow: 'hidden', position: 'relative', minHeight: 180 }}>
        <AnimatePresence mode="popLayout">
          {quizActive ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ padding: 16 }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 'bold', color: agent.color, marginBottom: 12 }}>🧠 Quick Check!</h3>
              <p style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 16 }}>{QUIZZES[gameId][quizIndex].q}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {QUIZZES[gameId][quizIndex].opts.map((opt, i) => {
                  const isCorrect = i === QUIZZES[gameId][quizIndex].correct
                  const isSelected = quizAnswered === i
                  
                  let btnBg = 'var(--bg-surface-2, #1e1e2d)'
                  let btnBorder = 'var(--border-default)'
                  
                  if (quizAnswered !== null) {
                    if (isCorrect) { btnBg = 'rgba(16,185,129,0.2)'; btnBorder = '#10b981' }
                    else if (isSelected) { btnBg = 'rgba(239,68,68,0.2)'; btnBorder = '#ef4444' }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => quizAnswered === null && handleQuizAnswer(i)}
                      style={{
                        padding: '10px 12px', borderRadius: 8, fontSize: 14, textAlign: 'left',
                        background: btnBg, border: `1px solid ${btnBorder}`,
                        cursor: quizAnswered === null ? 'pointer' : 'default',
                        transition: 'all 0.2s', width: '100%'
                      }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              
              <AnimatePresence>
                {quizAnswered !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.1)', borderLeft: '3px solid #10b981', borderRadius: '0 8px 8px 0', fontSize: 13 }}
                  >
                    {quizAnswered === QUIZZES[gameId][quizIndex].correct && <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: 4 }}>+10 pts! Excellent.</div>}
                    {QUIZZES[gameId][quizIndex].explain}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="think"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{agent.avatar} {agent.name} says:</span>
                {currentStep && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 12, background: actionColor(currentStep.action), color: '#fff' }}>
                      {currentStep.action}
                    </span>
                    {currentStep.value && (
                      <span style={{ fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 12, background: 'rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                        f(n)={currentStep.value}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, minHeight: 80, background: 'rgba(255,255,255,0.02)', border: `1px solid var(--text-muted)`, borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center' }}>
                {currentStep ? (
                  <div style={{ width: '100%' }}>
                    <div style={{ fontSize: 14, lineHeight: '1.6', color: '#fff' }}>
                      <TypewriterText key={currentStep.explanation} text={currentStep.explanation} speed={15} />
                    </div>
                    {currentStep.state && (
                      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        <div style={{ color: 'var(--text-muted)' }}>
                          Board: {JSON.stringify(currentStep.state.board).substring(0, 40)}...
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 15, color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting for game to begin...</p>
                )}
              </div>
              
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 4, background: 'var(--bg-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: agent.color, width: `${totalSteps > 0 ? (Math.min(currentStepIndex + 1, totalSteps) / totalSteps) * 100 : 0}%`, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps || '?'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SECTION 3: Step Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onNext}
          disabled={quizActive || (currentStepIndex >= totalSteps - 1 && !isStreaming)}
          style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 15, fontWeight: 'bold',
            background: agent.color, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: `0 4px 14px 0 ${agent.color}40`,
            opacity: (quizActive || (currentStepIndex >= totalSteps - 1 && !isStreaming)) ? 0.5 : 1
          }}
        >
          {totalSteps === 0 ? "▶ Watch AI Think" : currentStepIndex >= totalSteps - 1 ? (isStreaming ? "Thinking..." : "✓ Explanation Complete") : "▶ Next Step"}
        </button>
        
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onPrev} disabled={quizActive || currentStepIndex === 0} style={{ flex: 1, padding: 8, borderRadius: 6, background: bg, border, color: '#fff', fontSize: 13, cursor: 'pointer', opacity: currentStepIndex === 0 ? 0.5 : 1 }}>◀ Prev</button>
          <button onClick={() => isStreaming ? onPause() : onResume()} style={{ flex: 1, padding: 8, borderRadius: 6, background: bg, border, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            {isStreaming ? '⏸ Pause' : '▶ Auto'}
          </button>
          {[0.5, 1, 2, 3].map(s => (
            <button
              key={s}
              onClick={() => { setSpeed(s * 1000); onSpeedChange(s * 1000) }}
              style={{
                padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                background: speed === s * 1000 ? agent.color : bg,
                border: speed === s * 1000 ? `1px solid ${agent.color}` : border,
                color: '#fff'
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5: Chat */}
      <div style={{ background: bg, border, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ maxHeight: 120, overflowY: 'auto', padding: messages.length ? 12 : 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ 
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? agent.color : 'var(--bg-surface-2)',
              borderLeft: m.role === 'agent' ? `3px solid ${agent.color}` : 'none',
              padding: '6px 10px', borderRadius: 8, fontSize: 13, maxWidth: '85%'
            }}>
              {m.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendChat} style={{ display: 'flex', borderTop: border }}>
          <input
            value={chatInput} onChange={e => setChatInput(e.target.value)}
            placeholder={`Ask ${agent.name} anything...`}
            style={{ flex: 1, padding: '10px 12px', background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' }}
          />
          <button type="submit" disabled={!chatInput.trim()} style={{ background: 'transparent', border: 'none', padding: '0 16px', color: agent.color, cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
        </form>
      </div>

      {/* SECTION 6: Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: bg, border, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
        <span>Nodes: <motion.span key={currentStep?.nodes_evaluated} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: 'var(--text-muted)' }}>{currentStep?.nodes_evaluated || 0}</motion.span></span>
        <span>Depth: <motion.span key={currentStep?.depth} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: 'var(--text-muted)' }}>{currentStep?.depth || 0}</motion.span></span>
        <span>Pruned: <motion.span key={currentStep?.pruning_count} initial={{ scale: 1.5, color: '#fff' }} animate={{ scale: 1, color: 'var(--text-muted)' }}>{currentStep?.pruning_count || 0}</motion.span></span>
      </div>

    </div>
  )
}
