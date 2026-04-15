import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ComplexityInsights from '@/components/learn/ComplexityInsights'
import { useComplexityStore } from '@/store/complexityStore'
import './TicTacToe.css'

/* ─── Types ─── */
type Cell = 'X' | 'O' | null
type Board = Cell[]
type GameResult = 'X' | 'O' | 'draw' | null
type Difficulty = 'easy' | 'medium' | 'hard'

/* ─── Constants ─── */
const MAX_ROUNDS = 5
const SPLIT_STORAGE_KEY = 'ttt-split-ratio'

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const POS_NAMES = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

/* ─══════════════════════════════════════════════════
   GAME LOGIC — pure functions, no React
   ══════════════════════════════════════════════════ */

function checkWinner(board: Board): { result: GameResult; line: number[] | null } {
  for (const combo of WIN_LINES) {
    const [a, b, c] = combo
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { result: board[a] as 'X' | 'O', line: combo }
    }
  }
  if (board.every(c => c !== null)) return { result: 'draw', line: null }
  return { result: null, line: null }
}

/* Full minimax — used for Hard + hint analysis */
function minimax(board: Board, isMaximizing: boolean, depth: number, maxDepth: number): number {
  const { result } = checkWinner(board)
  if (result === 'O') return 10 - depth
  if (result === 'X') return depth - 10
  if (result === 'draw') return 0
  if (depth >= maxDepth) return 0 // depth-limited for Medium

  // Track complexity metrics
  const cs = useComplexityStore.getState();
  cs.incrementNodes();
  cs.incrementStates();
  if (depth + 1 > cs.depthReached) cs.setDepth(depth + 1);

  if (isMaximizing) {
    let best = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O'
        best = Math.max(best, minimax(board, false, depth + 1, maxDepth))
        board[i] = null
      }
    }
    return best
  } else {
    let best = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X'
        best = Math.min(best, minimax(board, true, depth + 1, maxDepth))
        board[i] = null
      }
    }
    return best
  }
}

/* Get AI move based on difficulty */
function getAIMove(board: Board, difficulty: Difficulty): number {
  const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
  if (empty.length === 0) return -1

  if (difficulty === 'easy') {
    return empty[Math.floor(Math.random() * empty.length)]
  }

  // Medium: depth 2, occasional suboptimal play (20% chance)
  // Hard: full depth, always optimal
  const maxDepth = difficulty === 'medium' ? 2 : 100
  const moves: { idx: number; score: number }[] = []
  for (const i of empty) {
    board[i] = 'O'
    const score = minimax(board, false, 0, maxDepth)
    board[i] = null
    moves.push({ idx: i, score })
  }
  moves.sort((a, b) => b.score - a.score)

  // Medium: 20% chance to pick 2nd-best move (if available)
  if (difficulty === 'medium' && moves.length >= 2 && Math.random() < 0.2) {
    return moves[1].idx
  }
  return moves[0].idx
}

/* Best move for player X — always full minimax for accurate hints */
function getHintMove(board: Board): number {
  let bestScore = Infinity
  let bestMove = -1
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = 'X'
      const score = minimax(board, true, 0, 100)
      board[i] = null
      if (score < bestScore) {
        bestScore = score
        bestMove = i
      }
    }
  }
  return bestMove
}

/* Generate a learn-mode hint description for a cell */
function getLearnHint(board: Board, move: number): string {
  const b = [...board]

  // Does this move win for X?
  b[move] = 'X'
  const { result: xWin } = checkWinner(b)
  b[move] = null
  if (xWin === 'X') return 'This move wins the game!'

  // Does this move block O from winning?
  b[move] = 'O'
  const { result: oWin } = checkWinner(b)
  b[move] = null
  if (oWin === 'O') return 'This blocks the opponent from winning.'

  // Does center create a fork?
  if (move === 4) return 'The center connects to the most lines — dominant.'

  // Corner = fork potential
  if ([0, 2, 6, 8].includes(move)) return 'A corner move creates two-way threats.'

  return 'This move strengthens your position.'
}

/* ─══════════════════════════════════════════════════
   DIFFICULTY-ADAPTIVE EXPLANATION GENERATOR
   ══════════════════════════════════════════════════ */

function analyzeMovesForExplanation(board: Board, chosenMove: number, difficulty: Difficulty): {
  analyses: { position: string; score: number; outcome: string }[]
  emptyCount: number
  chosenScore: number
} {
  const empty = board.map((v, i) => v === null ? i : -1).filter(i => i >= 0)
  const analyses: { position: string; score: number; outcome: string }[] = []
  let chosenScore = 0
  const maxDepth = difficulty === 'medium' ? 2 : 100
  for (const i of empty) {
    board[i] = 'O'
    const score = difficulty === 'easy' ? 0 : minimax(board, false, 0, maxDepth)
    board[i] = null
    const outcome = score > 0 ? 'AI wins' : score < 0 ? 'You win' : 'Draw'
    analyses.push({ position: POS_NAMES[i], score, outcome })
    if (i === chosenMove) chosenScore = score
  }
  analyses.sort((a, b) => b.score - a.score)
  return { analyses, emptyCount: empty.length, chosenScore }
}

function generateExplanation(board: Board, move: number, difficulty: Difficulty): string {
  const pos = POS_NAMES[move]
  const isCenter = move === 4
  const isCorner = [0, 2, 6, 8].includes(move)

  // Logic checks
  const t = [...board]; t[move] = 'O'
  const iWin = checkWinner(t).result === 'O'
  const b2 = [...board]; b2[move] = 'X'
  const iBlock = checkWinner(b2).result === 'X'

  const { analyses, emptyCount, chosenScore } = analyzeMovesForExplanation([...board], move, difficulty)

  // ─── EASY MODE: Conversational, no formulas ───
  if (difficulty === 'easy') {
    let thinking = `Hmm, let me pick a spot... I have ${emptyCount} squares to choose from.`
    let decision: string
    if (iWin) {
      decision = `Oh wait — placing my O at **${pos}** completes a line! Lucky guess! 🎯`
    } else if (iBlock) {
      decision = `I randomly picked **${pos}**... and it happens to block your winning move!`
    } else if (isCenter) {
      decision = `I'll go with **${pos}**. The center is always a cozy spot!`
    } else if (isCorner) {
      decision = `I'll try the **${pos}** corner — seems like a nice spot.`
    } else {
      decision = `I'll put my O at **${pos}**. No deep thinking — just a random pick!`
    }
    return `### 💭 LET ME THINK...\n${thinking}\n\n### 🎲 MY PICK\n${decision}\n\n### ℹ️ NOTE\n_In Easy mode, I pick randomly without analyzing the game tree. No Minimax here!_`
  }

  // ─── MEDIUM MODE: Basic reasoning, limited depth ───
  if (difficulty === 'medium') {
    const topMoves = analyses.slice(0, 3)
    const stateText = `I'm scanning ${emptyCount} possible moves, looking 2 moves ahead...`
    const optionsText = topMoves.map((a, i) =>
      `${i === 0 ? '→' : '  '} **${a.position}** — likely outcome: ${a.outcome}`
    ).join('\n')
    let logicText: string
    let decisionText: string
    if (iWin) {
      logicText = `I can see a winning line at ${pos}! Even with limited depth, this is clear.`
      decisionText = `Placing O at **${pos.toUpperCase()}** to win! 🏆`
    } else if (iBlock) {
      logicText = `You were about to win at ${pos}. I need to block that move.`
      decisionText = `Blocking your win at **${pos.toUpperCase()}** 🛡️`
    } else {
      logicText = `With a depth limit of 2, I can only see a couple moves ahead. **${pos}** looks strongest from here.`
      decisionText = `Best move at depth 2: **${pos.toUpperCase()}** (score: ${chosenScore})`
    }
    return `### 📊 CURRENT STATE\n${stateText}\n\n### 🔍 OPTIONS ANALYZED\n${optionsText}\n\n### 🧠 REASONING\n${logicText}\n\n### ✅ DECISION\n${decisionText}`
  }

  // ─── HARD MODE: Full Minimax with scores, formula, tree logic ───
  const topMoves = analyses.slice(0, 4)
  const stateText = `Evaluating all ${emptyCount} possible moves through complete game tree search.`
  const optionsText = topMoves.map((a) => {
    const marker = a.position === pos ? '★' : ' '
    const scoreLabel = a.score > 0 ? `+${a.score}` : `${a.score}`
    return `${marker} **${a.position}** → score: \`${scoreLabel}\` (${a.outcome})`
  }).join('\n')

  let logicText: string
  if (iWin) {
    logicText = `**MAX layer (my turn):** I select the move with the highest score.\nAt **${pos}**, minimax returns \`+${chosenScore}\` — this completes a winning line.\n\`minimax(board, maximize=true) → ${chosenScore}\``
  } else if (iBlock) {
    logicText = `**MIN layer (your turn):** If I don't play ${pos}, you'll play there and win (score: \`-10\`).\n**MAX layer (my turn):** By blocking at ${pos}, I keep score at \`${chosenScore}\`.\n\`max(minimax(block), minimax(lose)) → max(${chosenScore}, -10) = ${chosenScore}\``
  } else {
    const worstAlt = analyses[analyses.length - 1]
    logicText = `**MAX layer (AI):** I pick the move that maximizes my guaranteed score.\n**MIN layer (Opponent):** You'll pick the move that minimizes my score.\n\nBest: **${pos}** → \`${chosenScore > 0 ? '+' : ''}${chosenScore}\`\nWorst alternative: **${worstAlt.position}** → \`${worstAlt.score > 0 ? '+' : ''}${worstAlt.score}\`\n\n\`minimax = max(${analyses.slice(0, 3).map(a => a.score).join(', ')}${analyses.length > 3 ? ', ...' : ''}) = ${chosenScore}\``
  }

  const metrics = useComplexityStore.getState()
  const decisionText = `**BEST MOVE: ${pos.toUpperCase()}** (score: \`${chosenScore > 0 ? '+' : ''}${chosenScore}\`)\n${chosenScore > 0 ? 'This guarantees a win.' : chosenScore === 0 ? 'This guarantees at least a draw.' : 'Best defensive option.'}\n_Searched ${metrics.nodesExplored.toLocaleString()} nodes at depth ${metrics.depthReached}_`

  return `### 📊 CURRENT STATE\n${stateText}\n\n### 🔍 OPTIONS ANALYZED\n${optionsText}\n\n### 🧠 MINIMAX LOGIC\n${logicText}\n\n### ✅ DECISION\n${decisionText}`
}

/* Generate explanation based on difficulty (replaces API call) */
async function fetchExplanation(board: Board, move: number, difficulty: Difficulty): Promise<string> {
  return generateExplanation(board, move, difficulty)
}

/* ─══════════════════════════════════════════════════
   SVG MARKS
   ══════════════════════════════════════════════════ */

function XMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14">
      <motion.line x1="22" y1="22" x2="78" y2="78" stroke="#f87171" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, ease: 'easeOut' }} />
      <motion.line x1="78" y1="22" x2="22" y2="78" stroke="#f87171" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }} />
    </svg>
  )
}

function OMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14">
      <motion.circle cx="50" cy="50" r="30" fill="none" stroke="#60a5fa" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} />
    </svg>
  )
}

/* ─══════════════════════════════════════════════════
   TYPEWRITER TEXT — character-by-character reveal
   ══════════════════════════════════════════════════ */

function TypewriterExplanation({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    idxRef.current = 0

    if (!text) return

    const interval = setInterval(() => {
      idxRef.current += 2
      if (idxRef.current >= text.length) {
        setDisplayed(text)
        setDone(true)
        clearInterval(interval)
      } else {
        setDisplayed(text.slice(0, idxRef.current))
      }
    }, 12)

    return () => clearInterval(interval)
  }, [text])

  const renderStructured = (content: string) => {
    const sections = content.split('### ').filter(Boolean)
    if (sections.length < 2 && !content.includes('### ')) {
      return <div className="ttt-explanation-simple">{content}</div>
    }

    // Parse inline formatting: **bold**, `code`, _italic_
    const parseInline = (text: string) => {
      const parts: React.ReactNode[] = []
      let remaining = text
      let key = 0
      while (remaining.length > 0) {
        // Find earliest match
        const boldIdx = remaining.indexOf('**')
        const codeIdx = remaining.indexOf('`')
        const italicIdx = remaining.indexOf('_')

        const candidates = [
          boldIdx >= 0 ? { type: 'bold', idx: boldIdx, delim: '**' } : null,
          codeIdx >= 0 ? { type: 'code', idx: codeIdx, delim: '`' } : null,
          italicIdx >= 0 ? { type: 'italic', idx: italicIdx, delim: '_' } : null,
        ].filter(Boolean).sort((a, b) => a!.idx - b!.idx)

        if (candidates.length === 0) {
          parts.push(remaining)
          break
        }

        const match = candidates[0]!
        const endIdx = remaining.indexOf(match.delim, match.idx + match.delim.length)
        if (endIdx < 0) {
          parts.push(remaining)
          break
        }

        // Push text before match
        if (match.idx > 0) parts.push(remaining.slice(0, match.idx))

        const inner = remaining.slice(match.idx + match.delim.length, endIdx)
        if (match.type === 'bold') {
          parts.push(<strong key={key++}>{inner}</strong>)
        } else if (match.type === 'code') {
          parts.push(<code key={key++} className="ttt-inline-code">{inner}</code>)
        } else {
          parts.push(<em key={key++} className="ttt-italic-note">{inner}</em>)
        }
        remaining = remaining.slice(endIdx + match.delim.length)
      }
      return parts
    }

    return (
      <div className="ttt-explanation-structured">
        {sections.map((section, i) => {
          const [title, ...rest] = section.split('\n')
          const body = rest.join('\n').trim()
          const tl = title.toLowerCase()
          const labelClass = tl.includes('think') || tl.includes('state') || tl.includes('evaluat') ? 'thinking' :
            tl.includes('option') || tl.includes('analyz') ? 'analysis' :
            tl.includes('logic') || tl.includes('minimax') || tl.includes('reason') ? 'logic' :
            tl.includes('decision') || tl.includes('pick') || tl.includes('note') || tl.includes('hint') ? 'result' :
            tl.includes('welcome') || tl.includes('match') || tl.includes('updated') || tl.includes('mode') || tl.includes('undo') || tl.includes('draw') ? 'welcome' :
            'result'

          return (
            <div key={i} className="ttt-explanation-block">
              <div className={`ttt-explanation-label ${labelClass}`}>{title}</div>
              <div className="ttt-explanation-content">
                {parseInline(body)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="ttt-typewriter">
      {renderStructured(displayed)}
      {!done && <span className="ttt-typewriter-cursor" />}
    </div>
  )
}

/* ─══════════════════════════════════════════════════
   MINIMAX TREE VISUALIZATION — conceptual display
   ══════════════════════════════════════════════════ */

function MinimaxTreeViz({ board, difficulty }: { board: Board; difficulty: Difficulty }) {
  const metrics = useComplexityStore()
  const emptyCount = board.filter(c => c === null).length

  return (
    <div className="ttt-tree-viz">
      <div className="ttt-tree-container">
        {/* Root node */}
        <div className="ttt-tree-row">
          <div className="ttt-tree-node root">
            Current State
          </div>
        </div>

        <div className="ttt-tree-connector">│</div>

        {/* MAX level */}
        <div className="ttt-tree-row">
          <div className="ttt-tree-node max">MAX (AI)</div>
          <span className="ttt-tree-connector">← picks highest</span>
        </div>

        <div className="ttt-tree-connector">├──┬──┤</div>

        {/* MIN level children */}
        <div className="ttt-tree-row">
          {Array.from({ length: Math.min(emptyCount, 4) }).map((_, i) => (
            <div key={i} className="ttt-tree-node min">MIN</div>
          ))}
          {metrics.branchesPruned > 0 && (
            <div className="ttt-tree-node pruned">✂ pruned</div>
          )}
        </div>

        <div className="ttt-tree-connector">↕ depth {metrics.depthReached || '...'}</div>

        {/* Leaf evaluations */}
        <div className="ttt-tree-row">
          <div className="ttt-tree-node max" style={{ fontSize: 10 }}>+10</div>
          <div className="ttt-tree-node min" style={{ fontSize: 10 }}>-10</div>
          <div className="ttt-tree-node root" style={{ fontSize: 10 }}>0</div>
        </div>
      </div>

      {/* Legend */}
      <div className="ttt-tree-legend">
        <span className="ttt-tree-legend-item">
          <span className="ttt-tree-legend-dot" style={{ background: 'rgba(16, 185, 129, 0.7)' }} />
          MAX (AI wins)
        </span>
        <span className="ttt-tree-legend-item">
          <span className="ttt-tree-legend-dot" style={{ background: 'rgba(239, 68, 68, 0.7)' }} />
          MIN (You win)
        </span>
        <span className="ttt-tree-legend-item">
          <span className="ttt-tree-legend-dot" style={{ background: 'rgba(245, 158, 11, 0.7)' }} />
          Pruned
        </span>
        <span className="ttt-tree-legend-item">
          <span className="ttt-tree-legend-dot" style={{ background: 'rgba(124, 58, 237, 0.7)' }} />
          Draw
        </span>
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {difficulty === 'easy'
          ? 'Easy mode picks randomly — no tree search used.'
          : difficulty === 'medium'
            ? 'Medium mode searches 3 levels deep, then estimates.'
            : `Hard mode searches the full game tree (${emptyCount} empty cells → up to ${metrics.nodesExplored.toLocaleString()} nodes).`}
      </div>
    </div>
  )
}

/* ─══════════════════════════════════════════════════
   ALPHA-BETA PRUNING VIEW
   ══════════════════════════════════════════════════ */

function AlphaBetaView() {
  const metrics = useComplexityStore()

  const total = metrics.nodesExplored + metrics.branchesPruned
  const exploredPct = total > 0 ? Math.round((metrics.nodesExplored / total) * 100) : 0
  const prunedPct = total > 0 ? 100 - exploredPct : 0
  const efficiency = total > 0 ? ((metrics.branchesPruned / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="ttt-pruning-body">
      <div className="ttt-pruning-bars">
        {/* Explored bar */}
        <div className="ttt-pruning-bar-row">
          <span className="ttt-pruning-bar-label">Explored</span>
          <div className="ttt-pruning-bar-track">
            <div
              className="ttt-pruning-bar-fill explored"
              style={{ width: `${Math.max(exploredPct, 5)}%` }}
            >
              {exploredPct}%
            </div>
          </div>
        </div>

        {/* Pruned bar */}
        <div className="ttt-pruning-bar-row">
          <span className="ttt-pruning-bar-label">Pruned</span>
          <div className="ttt-pruning-bar-track">
            <div
              className="ttt-pruning-bar-fill pruned"
              style={{ width: `${Math.max(prunedPct, 2)}%` }}
            >
              {prunedPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="ttt-pruning-stats">
        <div className="ttt-pruning-stat">
          <span className="ttt-pruning-stat-label">Nodes</span>
          <span className="ttt-pruning-stat-value nodes">{metrics.nodesExplored.toLocaleString()}</span>
        </div>
        <div className="ttt-pruning-stat">
          <span className="ttt-pruning-stat-label">Pruned</span>
          <span className="ttt-pruning-stat-value pruned">{metrics.branchesPruned.toLocaleString()}</span>
        </div>
        <div className="ttt-pruning-stat">
          <span className="ttt-pruning-stat-label">Depth</span>
          <span className="ttt-pruning-stat-value depth">{metrics.depthReached}</span>
        </div>
        <div className="ttt-pruning-stat">
          <span className="ttt-pruning-stat-label">Efficiency</span>
          <span className="ttt-pruning-stat-value efficiency">{efficiency}%</span>
        </div>
      </div>
    </div>
  )
}

/* ─══════════════════════════════════════════════════
   HISTORY SNAPSHOT — for undo
   ══════════════════════════════════════════════════ */

interface Snapshot {
  board: Board
  moveLog: string[]
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function TicTacToe() {
  const navigate = useNavigate()

  /* ── Core game state ── */
  const [board, setBoard] = useState<Board>(() => Array(9).fill(null))
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState<GameResult>(null)
  const [winLine, setWinLine] = useState<number[] | null>(null)
  const [thinking, setThinking] = useState(false)
  const isPlayerTurn = useRef(true)

  /* ── Round / match state ── */
  const [round, setRound] = useState(1)
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 })
  const matchOver = round > MAX_ROUNDS && gameOver

  /* ── Difficulty ── */
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')

  /* ── Learning mode ── */
  const [learnMode, setLearnMode] = useState(false)
  const [hintCell, setHintCell] = useState<number | null>(null)
  const [learnHintText, setLearnHintText] = useState<string | null>(null)

  /* ── Undo history ── */
  const [history, setHistory] = useState<Snapshot[]>([])

  /* ── AI panel ── */
  const [explanation, setExplanation] = useState(
    "### WELCOME\nI'm ready for a match! You're X — tap any square to start.\nI'll evaluate the board using the Minimax algorithm to find the most optimal response."
  )
  const [moveLog, setMoveLog] = useState<string[]>([])
  const tutorScrollRef = useRef<HTMLDivElement>(null)

  /* ── Resizable split ── */
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const stored = localStorage.getItem(SPLIT_STORAGE_KEY)
    return stored ? parseFloat(stored) : 60
  })
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /* ── Collapsible states ── */
  const [complexityOpen, setComplexityOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [pruningOpen, setPruningOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)

  /* ── Derived ── */
  const diffLabel = difficulty === 'easy' ? 'Random' : difficulty === 'medium' ? 'Depth 2' : 'Depth ∞'

  /* ── Effects ── */
  useEffect(() => { setHintCell(null); setLearnHintText(null) }, [board])
  useEffect(() => {
    tutorScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [moveLog])

  // In learn mode, auto-compute best move highlight
  useEffect(() => {
    if (!learnMode || gameOver || thinking || !isPlayerTurn.current) {
      setHintCell(null)
      setLearnHintText(null)
      return
    }
    const best = getHintMove(board)
    if (best >= 0) {
      setHintCell(best)
      setLearnHintText(getLearnHint(board, best))
    }
  }, [board, learnMode, gameOver, thinking])

  /* ── Resizable split drag handlers ── */
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.classList.add('ttt-no-select')

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(Math.max(pct, 35), 75)
      setLeftWidth(clamped)
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.classList.remove('ttt-no-select')
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  // Persist split ratio
  useEffect(() => {
    localStorage.setItem(SPLIT_STORAGE_KEY, String(leftWidth))
  }, [leftWidth])

  /* ── Reset board only (keeps score + round) ── */
  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null))
    setGameOver(false)
    setResult(null)
    setWinLine(null)
    setThinking(false)
    setHintCell(null)
    setLearnHintText(null)
    setMoveLog([])
    setHistory([])
    setExplanation("### WELCOME\nI'm ready for a match! You're X — tap any square to start.\nI'll evaluate the board using the Minimax algorithm to find the most optimal response.")
    isPlayerTurn.current = true
    setTreeOpen(false)
    setPruningOpen(false)
  }, [])

  /* ── Next round ── */
  const nextRound = useCallback(() => {
    if (round >= MAX_ROUNDS) return
    setRound(r => r + 1)
    resetBoard()
  }, [round, resetBoard])

  /* ── Full match reset ── */
  const resetMatch = useCallback(() => {
    setRound(1)
    setScores({ player: 0, ai: 0, draws: 0 })
    resetBoard()
    setExplanation("### NEW MATCH\nYou're X — tap any square to start. I'll play O and explain my logic as we go.")
  }, [resetBoard])

  /* ── Difficulty change ── */
  const changeDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d)
    resetBoard()
    setExplanation(`### STRATEGY UPDATED\nDifficulty set to **${DIFF_LABELS[d]}**. ${d === 'hard' ? 'I will now search the entire game tree for perfect play.' : d === 'medium' ? 'I will look a few moves ahead.' : 'I will play randomly without deep analysis.'}`)
  }, [resetBoard])

  /* ── Undo ── */
  const handleUndo = useCallback(() => {
    if (history.length === 0 || gameOver || thinking) return
    const prev = history[history.length - 1]
    setBoard(prev.board)
    setMoveLog(prev.moveLog)
    setHistory(h => h.slice(0, -1))
    setExplanation("### UNDO PERFORMED\nState reverted. It's your turn again.")
    isPlayerTurn.current = true
  }, [history, gameOver, thinking])

  /* ── Hint button (manual, only in play mode) ── */
  const handleManualHint = useCallback(() => {
    if (gameOver || thinking || !isPlayerTurn.current) return
    const hint = getHintMove(board)
    if (hint >= 0) {
      setHintCell(hint)
      const hintText = getLearnHint(board, hint)
      setLearnHintText(hintText)
      setExplanation(`### HINT SUGGESTED\n💡 Try the **${POS_NAMES[hint]}**. ${hintText}`)
    }
  }, [board, gameOver, thinking])

  /* ── Helper: scroll tutor to top smoothly ── */
  const scrollTutorToTop = useCallback(() => {
    tutorScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  /* ── Cell click — STEP-BY-STEP AI EXECUTION ── */
  const handleCellClick = useCallback(async (index: number) => {
    if (gameOver || thinking || !isPlayerTurn.current || board[index] !== null) return

    // Save snapshot for undo (before this move pair)
    setHistory(h => [...h, { board: [...board], moveLog: [...moveLog] }])

    // Player move
    const afterPlayer = [...board]
    afterPlayer[index] = 'X'
    setBoard(afterPlayer)
    const newLog = [...moveLog, `You → ${POS_NAMES[index]}`]
    setMoveLog(newLog)

    // Check player win / draw
    const pCheck = checkWinner(afterPlayer)
    if (pCheck.result) {
      setGameOver(true)
      setResult(pCheck.result)
      setWinLine(pCheck.line)
      if (pCheck.result === 'X') {
        setExplanation("🎉 You win this round!")
        setScores(s => ({ ...s, player: s.player + 1 }))
      } else {
        setExplanation("🤝 It's a draw!")
        setScores(s => ({ ...s, draws: s.draws + 1 }))
      }
      return
    }

    // ═══════════════════════════════════════
    // AI TURN — Step-by-step teaching flow
    // Step 1: Show current state analysis
    // Step 2: Show options being evaluated
    // Step 3: Show decision
    // Step 4: Place move on board
    // ═══════════════════════════════════════
    isPlayerTurn.current = false
    setThinking(true)
    scrollTutorToTop()

    const emptyCount = afterPlayer.filter(c => c === null).length
    const depthLabel = difficulty === 'easy' ? 'random' : difficulty === 'medium' ? '2 levels deep' : 'the full game tree'

    // ── STEP 1: Current State ──
    setExplanation(`### 📊 CURRENT STATE\nAnalyzing the board... ${emptyCount} empty cells remaining.\nI'll search ${depthLabel} to find the best response.`)
    await new Promise(r => setTimeout(r, difficulty === 'easy' ? 300 : 600))
    scrollTutorToTop()

    // Start tracking complexity
    useComplexityStore.getState().startTracking('tictactoe')

    // Compute AI move
    const aiIdx = getAIMove([...afterPlayer], difficulty)
    if (aiIdx < 0) { setThinking(false); return }

    // ── STEP 2: Show options being evaluated ──
    if (difficulty !== 'easy') {
      const { analyses } = analyzeMovesForExplanation([...afterPlayer], aiIdx, difficulty)
      const topMoves = analyses.slice(0, Math.min(analyses.length, difficulty === 'medium' ? 3 : 4))
      const evalText = topMoves.map((a, i) => {
        const marker = a.position === POS_NAMES[aiIdx] ? '★' : ' '
        return `${marker} **${a.position}** → ${a.outcome}`
      }).join('\n')
      setExplanation(`### 📊 CURRENT STATE\nAnalyzing ${emptyCount} possible moves ${difficulty === 'medium' ? '(2 levels deep)' : '(full tree search)'}...\n\n### 🔍 OPTIONS EVALUATED\nChecking each position...\n${evalText}`)
      await new Promise(r => setTimeout(r, 500))
      scrollTutorToTop()
    }

    // ── STEP 3: Full explanation with decision ──
    const aiExp = generateExplanation([...afterPlayer], aiIdx, difficulty)
    setExplanation(aiExp)
    await new Promise(r => setTimeout(r, difficulty === 'easy' ? 200 : 500))
    scrollTutorToTop()

    // ── STEP 4: Place move on board ──
    const afterAI = [...afterPlayer]
    afterAI[aiIdx] = 'O'
    setBoard(afterAI)
    setMoveLog(prev => [...prev, `AI → ${POS_NAMES[aiIdx]}`])

    // Check AI win / draw
    const aCheck = checkWinner(afterAI)
    if (aCheck.result) {
      setGameOver(true)
      setResult(aCheck.result)
      setWinLine(aCheck.line)
      if (aCheck.result === 'O') {
        setExplanation(aiExp + "\n\n### 🏆 MATCH POINT\nI've secured the win! Study my reasoning above to see how I set up the winning path.")
        setScores(s => ({ ...s, ai: s.ai + 1 }))
      } else {
        setExplanation("### 🤝 DRAW\nThe game ends in a draw — every branch was accounted for.\n\n_Against perfect Minimax play, a draw is the best possible result!_")
        setScores(s => ({ ...s, draws: s.draws + 1 }))
      }
    } else {
      isPlayerTurn.current = true
    }
    setThinking(false)
  }, [board, gameOver, thinking, difficulty, moveLog, scrollTutorToTop])

  /* ── Status badge ── */
  const statusText = gameOver
    ? result === 'X' ? '🎉 You Win!' : result === 'O' ? '🤖 AI Wins' : '🤝 Draw'
    : thinking ? '🤔 AI Thinking…' : '🎮 Your Turn'
  const statusColor = gameOver
    ? result === 'X' ? 'text-emerald-400' : result === 'O' ? 'text-red-400' : 'text-yellow-400'
    : thinking ? 'text-blue-400' : 'text-purple-400'

  /* Win line coords */
  const getWinLineCoords = (cells: number[]) => {
    const c = [
      { x: 16.67, y: 16.67 }, { x: 50, y: 16.67 }, { x: 83.33, y: 16.67 },
      { x: 16.67, y: 50 }, { x: 50, y: 50 }, { x: 83.33, y: 50 },
      { x: 16.67, y: 83.33 }, { x: 50, y: 83.33 }, { x: 83.33, y: 83.33 },
    ]
    return { x1: `${c[cells[0]].x}%`, y1: `${c[cells[0]].y}%`, x2: `${c[cells[2]].x}%`, y2: `${c[cells[2]].y}%` }
  }

  const canNextRound = gameOver && round < MAX_ROUNDS

  /* ═══ RENDER ═══ */
  return (
    <div
      ref={containerRef}
      className="ttt-split-container"
      style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}
    >

      {/* ════════════ LEFT: GAME AREA ════════════ */}
      <div className="ttt-board-panel">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute top-4 left-5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-400
                     hover:bg-white/[0.10] hover:text-white transition-all duration-200"
        >
          ← Home
        </button>

        {/* Background glow */}
        <div className="ttt-board-glow">
          <div className="ttt-board-glow-orb" />
        </div>

        {/* ── TOP BAR: Round + Score + Difficulty ── */}
        <div className="flex items-center gap-6 mb-4 z-10">
          {/* Round */}
          <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold tracking-wide text-gray-400">
            Round <span className="text-white">{Math.min(round, MAX_ROUNDS)}</span> / {MAX_ROUNDS}
          </div>

          {/* Score */}
          <div className="flex gap-4 text-xs font-mono tracking-wider">
            <span className="text-red-400 font-bold">You: {scores.player}</span>
            <span className="text-gray-600">|</span>
            <span className="text-blue-400 font-bold">AI: {scores.ai}</span>
            <span className="text-gray-600">|</span>
            <span className="text-yellow-400 font-bold">Draw: {scores.draws}</span>
          </div>

          {/* Difficulty selector */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => changeDifficulty(d)}
                className={`px-3 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200
                  ${difficulty === d
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
                  }`}
              >
                {DIFF_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <motion.div
          key={statusText}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-5 px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm text-sm font-semibold tracking-wide ${statusColor}`}
        >
          {statusText}
        </motion.div>

        {/* Learn mode hint text */}
        <AnimatePresence>
          {learnMode && learnHintText && !gameOver && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ttt-hint-banner mb-3"
            >
              💡 {learnHintText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── GAME BOARD ── */}
        <div className="relative" style={{ width: 360, height: 360 }}>
          <div className="grid grid-cols-3 gap-3 w-full h-full">
            {board.map((cell, i) => {
              const isWin = winLine?.includes(i)
              const isHint = hintCell === i && !cell
              const disabled = !!cell || gameOver || thinking || !isPlayerTurn.current

              return (
                <motion.button
                  key={i}
                  id={`cell-${i}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => void handleCellClick(i)}
                  className={`
                    relative flex items-center justify-center rounded-xl text-5xl font-bold
                    transition-all duration-200 select-none outline-none
                    ${isWin
                      ? 'bg-emerald-500/10 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : isHint
                        ? 'bg-yellow-500/10 border-2 border-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.15)]'
                        : 'bg-[#1a1a2e] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/30 hover:shadow-[0_0_16px_rgba(124,58,237,0.15)]'
                    }
                    ${disabled && !cell && !isWin ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                  `}
                  whileHover={!disabled ? { scale: 1.04 } : {}}
                  whileTap={!disabled ? { scale: 0.92 } : {}}
                >
                  <AnimatePresence mode="wait">
                    {cell === 'X' && (
                      <motion.div key="x" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        <XMark />
                      </motion.div>
                    )}
                    {cell === 'O' && (
                      <motion.div key="o" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        <OMark />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hint glow indicator */}
                  {isHint && (
                    <motion.div className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}>
                      <span className="text-2xl text-yellow-400">✦</span>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Win line overlay */}
          {winLine && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <motion.line
                {...getWinLineCoords(winLine)}
                stroke={result === 'X' ? '#34d399' : '#60a5fa'}
                strokeWidth="6" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                filter="url(#glow)"
              />
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
            </svg>
          )}
        </div>

        {/* ── BOTTOM BUTTONS ── */}
        <div className="flex items-center gap-3 mt-6 z-10">
          <button type="button" onClick={handleUndo} disabled={history.length === 0 || gameOver || thinking}
            className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-400 hover:bg-white/[0.10] hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95">
            ↶ Undo
          </button>

          {canNextRound && (
            <button type="button" onClick={nextRound}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 border border-emerald-500/20 text-xs font-bold text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/10">
              Next Round →
            </button>
          )}

          {(matchOver || (gameOver && round >= MAX_ROUNDS)) && (
            <button type="button" onClick={resetMatch}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 border border-purple-500/20 text-xs font-bold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 active:scale-95 shadow-lg shadow-purple-500/10">
              New Match
            </button>
          )}

          <button type="button" onClick={resetMatch}
            className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-400 hover:bg-white/[0.10] hover:text-white transition-all duration-200 active:scale-95">
            ↺ Reset Match
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-[11px] text-gray-600 tracking-widest uppercase font-mono">
          Minimax · {DIFF_LABELS[difficulty]} · IntelliPlay
        </p>
      </div>

      {/* ════════════ DRAG DIVIDER ════════════ */}
      <div
        className={`ttt-divider ${isDragging.current ? 'dragging' : ''}`}
        onMouseDown={handleDividerMouseDown}
      >
        <div className="ttt-divider-handle" />
      </div>

      {/* ════════════ RIGHT: AI TUTOR PANEL ════════════ */}
      <div className="ttt-tutor-panel">

        {/* ── Sticky AlphaBot Header ── */}
        <div className="ttt-tutor-header">
          <div className="ttt-tutor-header-row">
            <div className="ttt-tutor-avatar">🤖</div>
            <div>
              <h2 className="ttt-tutor-name">AlphaBot</h2>
              <p className="ttt-tutor-subtitle">Minimax AI Tutor</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="ttt-mode-toggle" style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setLearnMode(false)}
              className={`ttt-mode-btn ${!learnMode ? 'active-play' : ''}`}>
              🎮 Play
            </button>
            <button type="button" onClick={() => setLearnMode(true)}
              className={`ttt-mode-btn ${learnMode ? 'active-learn' : ''}`}>
              📖 Learn
            </button>
          </div>

          <div className="ttt-tutor-divider" />
        </div>

        {/* ── Scrollable Tutor Content — CONTINUOUS FLOW ── */}
        <div ref={tutorScrollRef} className="ttt-tutor-scroll">

          {/* Thinking indicator */}
          <AnimatePresence>
            {thinking && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="ttt-thinking-bar">
                  <div className="ttt-thinking-dots">
                    <motion.div className="ttt-thinking-dot" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                    <motion.div className="ttt-thinking-dot" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                    <motion.div className="ttt-thinking-dot" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
                  </div>
                  <span className="ttt-thinking-label">Traversing game tree nodes...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────────────────────────────────────────
              SECTION 1: 🧠 AI REASONING (HERO)
              ────────────────────────────────────────── */}
          <div className="ttt-section-card hero">
            <div className="ttt-section-header">
              <span className="ttt-section-header-icon">🧠</span>
              AI Reasoning
              <span className="ttt-section-badge">Primary</span>
            </div>
            <div className="ttt-explanation-body">
              <TypewriterExplanation key={explanation} text={explanation} />
            </div>
          </div>

          {/* ──────────────────────────────────────────
              SECTION 2: 📋 MOVE HISTORY
              ────────────────────────────────────────── */}
          {moveLog.length > 0 && (
            <div className="ttt-section-card">
              <div className="ttt-section-header">
                <span className="ttt-section-header-icon">📋</span>
                Move History
                <span className="ttt-section-badge">{moveLog.length} moves</span>
              </div>
              <div className="ttt-move-log-list">
                {moveLog.map((msg, i) => (
                  <p key={i} className="ttt-move-log-entry">
                    <span className="ttt-move-log-num">{i + 1}.</span>{msg}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              SECTION 3: 🌳 MINIMAX SEARCH TREE
              Always visible — no collapse
              ────────────────────────────────────────── */}
          <div className="ttt-section-card">
            <div className="ttt-section-header">
              <span className="ttt-section-header-icon">🌳</span>
              Minimax Search Tree
              <span className="ttt-section-badge live">Live</span>
            </div>
            <MinimaxTreeViz board={board} difficulty={difficulty} />
          </div>

          {/* ──────────────────────────────────────────
              SECTION 4: ⚡ ALPHA-BETA PRUNING
              Always visible — clear explanation
              ────────────────────────────────────────── */}
          <div className="ttt-section-card">
            <div className="ttt-section-header">
              <span className="ttt-section-header-icon">⚡</span>
              Alpha-Beta Pruning
              {useComplexityStore.getState().branchesPruned > 0 && <span className="ttt-section-badge live">Active</span>}
            </div>
            <div className="ttt-pruning-body">
              <div className="ttt-pruning-explain">
                <span className="ttt-pruning-explain-icon">✂️</span>
                <div>
                  <div className="ttt-pruning-explain-title">What is Alpha-Beta Pruning?</div>
                  <div className="ttt-pruning-explain-text">
                    When the AI finds a move that's already better than a previous option, it <strong>skips</strong> remaining branches — they can't change the outcome. This makes Minimax dramatically faster without losing accuracy.
                  </div>
                </div>
              </div>
              {useComplexityStore.getState().branchesPruned > 0 && (
                <div className="ttt-pruning-message">
                  ✂️ <strong>{useComplexityStore.getState().branchesPruned}</strong> branches pruned — these paths were skipped because they cannot improve the result.
                </div>
              )}
              <AlphaBetaView />
            </div>
          </div>

          {/* ──────────────────────────────────────────
              SECTION 5: 📊 COMPLEXITY INSIGHTS
              Always visible
              ────────────────────────────────────────── */}
          <div className="ttt-section-card">
            <div className="ttt-section-header">
              <span className="ttt-section-header-icon">📊</span>
              Complexity Insights
            </div>
            <div className="ttt-complexity-body">
              <ComplexityInsights gameId="tictactoe" variant="tailwind" />
            </div>
          </div>

          {/* ──────────────────────────────────────────
              SECTION 6: 📙 HOW MINIMAX WORKS
              Always visible — educational reference
              ────────────────────────────────────────── */}
          <div className="ttt-section-card">
            <div className="ttt-section-header">
              <span className="ttt-section-header-icon">📙</span>
              How Minimax Works
            </div>
            <div className="ttt-how-content">
              <div className="ttt-how-step">
                <span className="ttt-how-step-num">1</span>
                <div>
                  <strong>Explore All Moves</strong>
                  <p>The AI generates every possible future game state, building a tree of all move sequences from the current position down to the end.</p>
                </div>
              </div>
              <div className="ttt-how-step">
                <span className="ttt-how-step-num">2</span>
                <div>
                  <strong>Assume Perfect Play</strong>
                  <p>The AI assumes you'll always make your best move. It never underestimates the opponent — this is the "Min" in Minimax.</p>
                </div>
              </div>
              <div className="ttt-how-step">
                <span className="ttt-how-step-num">3</span>
                <div>
                  <strong>Score Each Outcome</strong>
                  <p>Win = <code>+1</code>, Loss = <code>-1</code>, Draw = <code>0</code>. Scores bubble up from leaf nodes through the tree.</p>
                </div>
              </div>
              <div className="ttt-how-step">
                <span className="ttt-how-step-num">4</span>
                <div>
                  <strong>Choose the Best Path</strong>
                  <p>The AI picks the move that guarantees the highest score even in the worst case — this is the "Max" in Minimax.</p>
                </div>
              </div>
            </div>
            <div className="ttt-how-status">
              <div className="ttt-how-status-dot" />
              <span className="ttt-how-status-text">Learning Agent Active · {diffLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Panel Footer (Hint + Reset buttons) ── */}
        <div className="ttt-panel-footer">
          <div className="ttt-panel-buttons">
            {!learnMode && (
              <button type="button" onClick={handleManualHint} disabled={gameOver || thinking}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-500/20 text-xs font-semibold text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-purple-500/10">
                💡 AI Hint
              </button>
            )}
            <button type="button" onClick={resetBoard}
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-300 hover:bg-white/[0.10] hover:text-white transition-all active:scale-95">
              ↺ Reset Board
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

