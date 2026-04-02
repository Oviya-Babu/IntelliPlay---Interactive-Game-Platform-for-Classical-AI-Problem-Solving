import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Types ─── */
type Cell = 'X' | 'O' | null
type Board = Cell[]
type GameResult = 'X' | 'O' | 'draw' | null
type Difficulty = 'easy' | 'medium' | 'hard'

/* ─── Constants ─── */
const MAX_ROUNDS = 5

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

  const maxDepth = difficulty === 'medium' ? 3 : 100
  let bestScore = -Infinity
  let bestMove = empty[0]
  for (const i of empty) {
    board[i] = 'O'
    const score = minimax(board, false, 0, maxDepth)
    board[i] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = i
    }
  }
  return bestMove
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

/* Fallback AI explanation */
function getFallbackExplanation(board: Board, move: number): string {
  const pos = POS_NAMES[move]
  if (move === 4) return `I chose the ${pos} — it connects to the most winning lines.`
  const t = [...board]; t[move] = 'O'
  if (checkWinner(t).result === 'O') return `I placed O at ${pos} to complete my line. GG!`
  const b2 = [...board]; b2[move] = 'X'
  if (checkWinner(b2).result === 'X') return `I blocked you at ${pos}. Close one!`
  if ([0, 2, 6, 8].includes(move)) return `I took the ${pos} corner for double-threat potential.`
  return `I chose ${pos} to strengthen my position.`
}

/* Gemini API call */
async function fetchExplanation(board: Board, move: number): Promise<string> {
  try {
    const r = await fetch('/api/explain-move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board_state: board.map(c => c ?? ''), move, player: 'O' }),
    })
    if (!r.ok) throw new Error()
    const d = await r.json()
    return d.explanation || getFallbackExplanation(board, move)
  } catch {
    return getFallbackExplanation(board, move)
  }
}

/* ─══════════════════════════════════════════════════
   SVG MARKS
   ══════════════════════════════════════════════════ */

function XMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14">
      <motion.line x1="22" y1="22" x2="78" y2="78" stroke="#f87171" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} />
      <motion.line x1="78" y1="22" x2="22" y2="78" stroke="#f87171" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: 0.08, ease: 'easeOut' }} />
    </svg>
  )
}

function OMark() {
  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14">
      <motion.circle cx="50" cy="50" r="30" fill="none" stroke="#60a5fa" strokeWidth="12" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
    </svg>
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
    "Welcome! You're X — tap any square to start. I'll respond as O using the Minimax algorithm."
  )
  const [moveLog, setMoveLog] = useState<string[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  /* ── Derived ── */
  const diffLabel = difficulty === 'easy' ? 'Random' : difficulty === 'medium' ? 'Depth 3' : 'Depth ∞'

  /* ── Effects ── */
  useEffect(() => { setHintCell(null); setLearnHintText(null) }, [board])
  useEffect(() => {
    panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: 'smooth' })
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
    setExplanation("Your turn — place X on the board.")
    isPlayerTurn.current = true
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
    setExplanation("New match! You're X — tap any square to start.")
  }, [resetBoard])

  /* ── Difficulty change ── */
  const changeDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d)
    resetBoard()
    setExplanation(`Difficulty set to ${DIFF_LABELS[d]}. Your move!`)
  }, [resetBoard])

  /* ── Undo ── */
  const handleUndo = useCallback(() => {
    if (history.length === 0 || gameOver || thinking) return
    const prev = history[history.length - 1]
    setBoard(prev.board)
    setMoveLog(prev.moveLog)
    setHistory(h => h.slice(0, -1))
    setExplanation("Undo complete — your turn again.")
    isPlayerTurn.current = true
  }, [history, gameOver, thinking])

  /* ── Hint button (manual, only in play mode) ── */
  const handleManualHint = useCallback(() => {
    if (gameOver || thinking || !isPlayerTurn.current) return
    const hint = getHintMove(board)
    if (hint >= 0) {
      setHintCell(hint)
      setLearnHintText(getLearnHint(board, hint))
      setExplanation(`💡 Try the ${POS_NAMES[hint]} — ${getLearnHint(board, hint).toLowerCase()}`)
    }
  }, [board, gameOver, thinking])

  /* ── Cell click ── */
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

    // AI turn
    isPlayerTurn.current = false
    setThinking(true)
    setExplanation('🤔 Thinking…')
    await new Promise(r => setTimeout(r, difficulty === 'easy' ? 250 : 400))

    const aiIdx = getAIMove(afterPlayer, difficulty)
    if (aiIdx < 0) return
    const afterAI = [...afterPlayer]
    afterAI[aiIdx] = 'O'
    setBoard(afterAI)

    const aiExp = await fetchExplanation(afterPlayer, aiIdx)
    setExplanation(aiExp)
    setMoveLog(prev => [...prev, `AI → ${POS_NAMES[aiIdx]}`])

    const aCheck = checkWinner(afterAI)
    if (aCheck.result) {
      setGameOver(true)
      setResult(aCheck.result)
      setWinLine(aCheck.line)
      if (aCheck.result === 'O') {
        setExplanation(aiExp + "\n\n🏆 I win this round!")
        setScores(s => ({ ...s, ai: s.ai + 1 }))
      } else {
        setExplanation("🤝 It's a draw!")
        setScores(s => ({ ...s, draws: s.draws + 1 }))
      }
    } else {
      isPlayerTurn.current = true
    }
    setThinking(false)
  }, [board, gameOver, thinking, difficulty, moveLog])

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
      { x: 16.67, y: 50 },    { x: 50, y: 50 },    { x: 83.33, y: 50 },
      { x: 16.67, y: 83.33 }, { x: 50, y: 83.33 }, { x: 83.33, y: 83.33 },
    ]
    return { x1: `${c[cells[0]].x}%`, y1: `${c[cells[0]].y}%`, x2: `${c[cells[2]].x}%`, y2: `${c[cells[2]].y}%` }
  }

  const canNextRound = gameOver && round < MAX_ROUNDS

  /* ═══ RENDER ═══ */
  return (
    <div className="flex h-[calc(100vh-60px)] w-full bg-[#08080f] text-gray-100 overflow-hidden">

      {/* ════════════ LEFT: GAME AREA (70%) ════════════ */}
      <div className="w-[70%] flex flex-col items-center justify-center relative">

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
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/[0.04] blur-[100px]" />
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
              className="mb-3 px-4 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 font-medium"
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
                        : 'bg-[#1a1a2e] border border-white/[0.06] hover:bg-purple-600/20 hover:border-purple-500/30'
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

      {/* ════════════ RIGHT: AI TUTOR PANEL (30%) ════════════ */}
      <div className="w-[30%] border-l border-white/10 p-5 flex flex-col bg-[#0a0a14]/60 backdrop-blur-sm">

        {/* AlphaBot header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">AlphaBot</h2>
              <p className="text-xs text-gray-500 font-medium tracking-wide">Minimax AI Tutor</p>
            </div>
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-transparent" />
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex rounded-lg border border-white/10 overflow-hidden">
          <button type="button" onClick={() => setLearnMode(false)}
            className={`flex-1 px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all
              ${!learnMode ? 'bg-purple-600/80 text-white' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'}`}>
            🎮 Play
          </button>
          <button type="button" onClick={() => setLearnMode(true)}
            className={`flex-1 px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all
              ${learnMode ? 'bg-yellow-600/80 text-white' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'}`}>
            📖 Learn
          </button>
        </div>

        {/* Thinking indicator */}
        <AnimatePresence>
          {thinking && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex gap-1">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
              </div>
              <span className="text-xs text-blue-300 font-medium">Evaluating game tree…</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation box */}
        <div ref={panelRef} className="flex-1 min-h-0 rounded-xl bg-[#12121f] border border-white/[0.06] p-4 overflow-y-auto">
          <motion.p key={explanation} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
            {explanation}
          </motion.p>
        </div>

        {/* Move log */}
        {moveLog.length > 0 && (
          <div className="mt-3">
            <h3 className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">Move Log</h3>
            <div className="max-h-20 overflow-y-auto space-y-0.5 pr-1">
              {moveLog.map((msg, i) => (
                <p key={i} className="text-[10px] text-gray-500 font-mono leading-relaxed">
                  <span className="text-gray-600 mr-1">{i + 1}.</span>{msg}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 h-px bg-white/[0.06]" />

        {/* Panel buttons */}
        <div className="mt-3 flex gap-2">
          {!learnMode && (
            <button type="button" onClick={handleManualHint} disabled={gameOver || thinking}
              className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-500/20 text-xs font-semibold text-white hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-purple-500/10">
              💡 Hint
            </button>
          )}
          <button type="button" onClick={resetBoard}
            className="flex-1 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-300 hover:bg-white/[0.10] hover:text-white transition-all active:scale-95">
            ↺ Reset Board
          </button>
        </div>

        {/* How Minimax Works */}
        <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">How Minimax Works</h4>
          <ul className="space-y-1">
            <li className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
              <span className="text-purple-400 mt-0.5">▸</span> Explores all possible future moves
            </li>
            <li className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
              <span className="text-purple-400 mt-0.5">▸</span> Assumes opponent always plays best
            </li>
            <li className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
              <span className="text-purple-400 mt-0.5">▸</span> Picks the move with the optimal outcome
            </li>
            <li className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
              <span className="text-purple-400 mt-0.5">▸</span> Pruning skips unnecessary branches
            </li>
          </ul>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            <span className="text-[10px] text-gray-400 font-mono">Active · {diffLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
