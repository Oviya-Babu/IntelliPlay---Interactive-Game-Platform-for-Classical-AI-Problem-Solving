import React, { useState, useEffect, useRef, useCallback } from 'react'
import './NQueens.css'

interface Message {
  type: 'info' | 'system' | 'teaching' | 'success' | 'danger' | 'warning' | 'hint'
  text: string
}

interface GameState {
  n: number
  board: number[]
  mode: 'manual' | 'solve' | 'learn'
  queensPlaced: number
  steps: any[]
  currentStepIdx: number
  isPlaying: boolean
  isPaused: boolean
  speed: number
  isSolved: boolean
  totalSteps: number
  totalBacktracks: number
  hintCell: { row: number; col: number } | null
  firstBacktrackSeen: boolean
  firstConflictSeen: boolean
  firstPlacementSeen: boolean
  conflictingQueens: Array<{ row: number; col: number }> // Conflicting queen positions
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rotation: number
  rotSpeed: number
  gravity: number
  opacity: number
  decay: number
}

const CONFIG = {
  MIN_N: 4,
  MAX_N: 10,
  DEFAULT_N: 8,
  DEFAULT_SPEED: 5,
  SPEED_DELAYS: {
    1: 2000,
    2: 1500,
    3: 1000,
    4: 700,
    5: 500,
    6: 350,
    7: 200,
    8: 120,
    9: 60,
    10: 20,
  } as Record<number, number>,
  FACTS_POOL: [
    '👑 The 8-Queens puzzle was first proposed by chess composer Max Bezzel in 1848.',
    '🤯 There are 92 distinct solutions to the 8-Queens problem!',
    '⚡ Backtracking is used in Sudoku solvers, maze generators, and pathfinding algorithms.',
    '🧠 The N-Queens problem grows exponentially — that\'s why pruning is essential.',
    '💡 N=4 has only 2 distinct solutions — try finding both!',
    '🚀 Backtracking is a form of depth-first search (DFS) through a decision tree.',
    '📐 For N=1, there\'s exactly 1 solution. For N=2 and N=3, there are zero!',
    '🏆 In 1874, Günther proposed a determinant-based approach to N-Queens.',
    '🌀 The search space for 8-Queens is 16.7 million — backtracking prunes most of it.',
    '🔬 N-Queens is NP-hard when generalized, but efficient heuristics exist for large N.',
    '♟️ The problem is related to placing non-attacking rooks and bishops too!',
    '🎯 Constraint propagation can reduce the search space dramatically.',
    '📊 For N=10, there are 724 distinct solutions.',
    '💻 Backtracking was popularized by Derrick Lehmer in the 1950s.',
    '🌟 The first complete analysis of 8-Queens was by Franz Nauck in 1850.',
    '🔄 Every N-Queens solution has at most 8 variants through rotation and reflection.',
    '⏱️ A modern computer solves 8-Queens in microseconds using backtracking.',
    '🧩 N-Queens is a classic constraint satisfaction problem (CSP).',
    '🎲 Random placement solves N-Queens faster for very large N (like N=1000)!',
    '📈 The number of solutions grows roughly exponentially: S(N) ≈ 0.143 × N!',
  ],
}

// ─── ALGORITHM ENGINE (Exact from NQueens_visualization) ─────────────────────
function isSafe(board: number[], row: number, col: number) {
  for (let i = 0; i < row; i++) {
    if (board[i] === -1) continue
    if (board[i] === col) return { safe: false, reason: 'column', conflictRow: i }
    if (Math.abs(board[i] - col) === Math.abs(i - row)) {
      return { safe: false, reason: 'diagonal', conflictRow: i }
    }
  }
  return { safe: true }
}

function isSafeSimple(board: number[], row: number, col: number, n: number) {
  for (let i = 0; i < n; i++) {
    if (i === row || board[i] === -1) continue
    if (board[i] === col) return false
    if (Math.abs(board[i] - col) === Math.abs(i - row)) return false
  }
  return true
}

function generateSteps(n: number) {
  const steps: any[] = []
  const board = new Array(n).fill(-1)

  function backtrack(row: number): boolean {
    if (row === n) {
      steps.push({ type: 'solution', board: [...board] })
      return true
    }

    steps.push({ type: 'enter-row', row, board: [...board] })

    for (let col = 0; col < n; col++) {
      steps.push({ type: 'try', row, col, board: [...board] })

      const check = isSafe(board, row, col)
      if (check.safe) {
        board[row] = col
        steps.push({ type: 'place', row, col, board: [...board] })

        if (backtrack(row + 1)) return true

        board[row] = -1
        steps.push({ type: 'backtrack', row, col, board: [...board] })
      } else {
        steps.push({
          type: 'reject',
          row,
          col,
          board: [...board],
          conflictRow: check.conflictRow,
          conflictReason: check.reason,
        })
      }
    }

    steps.push({ type: 'exhausted', row, board: [...board] })
    return false
  }

  backtrack(0)
  return steps
}

function computeHint(currentBoard: number[], n: number) {
  let targetRow = -1
  for (let r = 0; r < n; r++) {
    if (currentBoard[r] === -1) {
      targetRow = r
      break
    }
  }
  if (targetRow === -1) return null

  function canSolve(board: number[], row: number): boolean {
    if (row === n) return true
    if (board[row] !== -1) {
      for (let i = 0; i < n; i++) {
        if (i === row || board[i] === -1) continue
        if (board[i] === board[row]) return false
        if (Math.abs(board[i] - board[row]) === Math.abs(i - row)) return false
      }
      return canSolve(board, row + 1)
    }
    for (let col = 0; col < n; col++) {
      if (isSafeSimple(board, row, col, n)) {
        board[row] = col
        if (canSolve([...board], row + 1)) return true
        board[row] = -1
      }
    }
    return false
  }

  for (let col = 0; col < n; col++) {
    const tryBoard = [...currentBoard]
    if (isSafeSimple(tryBoard, targetRow, col, n)) {
      tryBoard[targetRow] = col
      if (canSolve([...tryBoard], targetRow + 1)) {
        return { row: targetRow, col }
      }
    }
  }

  return null
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function NQueens() {
  const [gameState, setGameState] = useState<GameState>({
    n: CONFIG.DEFAULT_N,
    board: new Array(CONFIG.DEFAULT_N).fill(-1),
    mode: 'manual',
    queensPlaced: 0,
    steps: [],
    currentStepIdx: 0,
    isPlaying: false,
    isPaused: false,
    speed: CONFIG.DEFAULT_SPEED,
    isSolved: false,
    totalSteps: 0,
    totalBacktracks: 0,
    hintCell: null,
    firstBacktrackSeen: false,
    firstConflictSeen: false,
    firstPlacementSeen: false,
    conflictingQueens: [],
  })

  const [messages, setMessages] = useState<Message[]>([])
  const currentFact = CONFIG.FACTS_POOL[0]
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const conflictCanvasRef = useRef<HTMLCanvasElement>(null)
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const confettiAnimIdRef = useRef<number | null>(null)

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const getColLetter = (col: number) => String.fromCharCode(65 + col)

  // ─── CONFETTI SYSTEM ───────────────────────────────────────
  const launchConfetti = useCallback((count: number = 150) => {
    if (!confettiCanvasRef.current) return
    const canvas = confettiCanvasRef.current
    const colors = ['#818cf8', '#6366f1', '#34d399', '#fbbf24', '#f87171']

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 4,
        w: 8 + Math.random() * 4,
        h: 8 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.3 + Math.random() * 0.15,
        opacity: 1,
        decay: 0.003 + Math.random() * 0.004,
      })
    }

    const animateConfetti = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0.01)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.99
        p.rotation += p.rotSpeed
        p.opacity -= p.decay

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        confettiAnimIdRef.current = requestAnimationFrame(animateConfetti)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animateConfetti()
  }, [])

  // ─── CONFLICT DRAWING ───────────────────────────────────────
  const drawConflictLine = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      if (!conflictCanvasRef.current) return
      const ctx = conflictCanvasRef.current.getContext('2d')
      if (!ctx) return

      const boardElement = document.querySelector('.board')
      if (!boardElement) return

      const cellSize = boardElement.getBoundingClientRect().width / gameState.n
      const x1 = fromCol * cellSize + cellSize / 2
      const y1 = fromRow * cellSize + cellSize / 2
      const x2 = toCol * cellSize + cellSize / 2
      const y2 = toRow * cellSize + cellSize / 2

      // Glow layer
      ctx.save()
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.15)'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()

      // Main dashed line
      ctx.save()
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Endpoints
      ;[
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ].forEach((p) => {
        ctx.save()
        ctx.fillStyle = 'rgba(248, 113, 113, 0.6)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    },
    [gameState.n],
  )

  const clearConflictCanvas = useCallback(() => {
    if (!conflictCanvasRef.current) return
    const ctx = conflictCanvasRef.current.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, conflictCanvasRef.current.width, conflictCanvasRef.current.height)
    }
  }, [])

  
  // Keep these for future use

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState.mode !== 'manual' || gameState.isPlaying) return

      const newBoard = [...gameState.board]

      if (newBoard[row] === col) {
        // Removing queen
        newBoard[row] = -1
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          queensPlaced: prev.queensPlaced - 1,
          hintCell: null,
          conflictingQueens: [],
        }))
        clearConflictCanvas()
        addMessage({
          type: 'system',
          text: `Removed queen from Row ${row + 1}, Col ${getColLetter(col)}.`,
        })
      } else {
        // Placing queen
        newBoard[row] = col
        const newQueensPlaced = newBoard.filter((c) => c !== -1).length

        // Find all conflicting queens
        const conflicting: Array<{ row: number; col: number }> = []
        for (let r = 0; r < gameState.n; r++) {
          if (newBoard[r] === -1 || r === row) continue
          if (newBoard[r] === col) {
            conflicting.push({ row: r, col: newBoard[r] })
          }
          if (Math.abs(newBoard[r] - col) === Math.abs(r - row)) {
            conflicting.push({ row: r, col: newBoard[r] })
          }
        }

        const isValid = newQueensPlaced === gameState.n && conflicting.length === 0

        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          queensPlaced: newQueensPlaced,
          isSolved: isValid,
          hintCell: null,
          conflictingQueens: conflicting,
        }))

        if (conflicting.length > 0) {
          // Show red lines
          clearConflictCanvas()
          for (const conflict of conflicting) {
            drawConflictLine(conflict.row, conflict.col, row, col)
          }

          const details = conflicting
            .map((c) => {
              const cColL = getColLetter(c.col)
              if (c.col === col) {
                return `Row ${c.row + 1} (same column)`
              } else {
                return `Row ${c.row + 1}, Col ${cColL} (diagonal)`
              }
            })
            .join('; ')

          addMessage({
            type: 'danger',
            text: `⚠️ <b>Conflict!</b> Red lines show which queens attack this position: ${details}`,
          })
        } else {
          clearConflictCanvas()
          addMessage({
            type: 'success',
            text: `✅ Queen placed at Row ${row + 1}, Col ${getColLetter(col)}. <span style="opacity:0.6">(${newQueensPlaced}/${gameState.n})</span>`,
          })
        }

        if (isValid) {
          // SHOW CELEBRATION!
          setTimeout(() => {
            launchConfetti(150)
          }, 200)

          addMessage({
            type: 'success',
            text: `🔥 <b>PERFECT!</b> You solved the ${gameState.n}-Queens puzzle! All queens placed safely!`,
          })
        }
      }
    },
    [gameState, drawConflictLine, clearConflictCanvas, launchConfetti, addMessage],
  )

  const handleAutoSolve = useCallback(() => {
    if (gameState.isPlaying) return

    setMessages([])
    clearConflictCanvas()
    const steps = generateSteps(gameState.n)
    const newBoard = new Array(gameState.n).fill(-1)

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      steps,
      currentStepIdx: 0,
      isPlaying: true,
      isSolved: false,
      queensPlaced: 0,
      totalSteps: 0,
      totalBacktracks: 0,
      conflictingQueens: [],
    }))

    addMessage({
      type: 'info',
      text: `🤖 <b>AI Solving ${gameState.n}-Queens...</b> Watch the backtracking algorithm solve this step by step!`,
    })

    let currentIdx = 0

    const playStep = () => {
      if (currentIdx < steps.length) {
        const step = steps[currentIdx]
        const stepMsgs: Message[] = []

        if (step.type === 'enter-row') {
          stepMsgs.push({
            type: 'info',
            text: `📍 <b>Checking Row ${step.row + 1}:</b> Scanning columns for a safe position...`,
          })
        } else if (step.type === 'try') {
          stepMsgs.push({
            type: 'warning',
            text: `🔍 Trying Row ${step.row + 1}, Column ${getColLetter(step.col)}...`,
          })
        } else if (step.type === 'place') {
          stepMsgs.push({
            type: 'success',
            text: `✅ <b>Valid!</b> Queen placed at Row ${step.row + 1}, Col ${getColLetter(step.col)}.`,
          })
        } else if (step.type === 'reject') {
          const conflictColL = step.board[step.conflictRow] !== -1 ? getColLetter(step.board[step.conflictRow]) : '?'
          if (step.conflictReason === 'column') {
            stepMsgs.push({
              type: 'warning',
              text: `❌ <b>Column conflict!</b> Column ${getColLetter(step.col)} has a queen at Row ${step.conflictRow + 1}. Trying next...`,
            })
          } else {
            stepMsgs.push({
              type: 'warning',
              text: `❌ <b>Diagonal conflict!</b> Would attack queen at Row ${step.conflictRow + 1}, Col ${conflictColL}. Trying next...`,
            })
          }
        } else if (step.type === 'backtrack') {
          stepMsgs.push({
            type: 'danger',
            text: `↩️ <b>Dead end!</b> Removing queen from Row ${step.row + 1}, Col ${getColLetter(step.col)} and backtracking...`,
          })
        } else if (step.type === 'exhausted') {
          stepMsgs.push({
            type: 'warning',
            text: `🚫 All columns in Row ${step.row + 1} failed. Backtracking further up...`,
          })
        } else if (step.type === 'solution') {
          stepMsgs.push({
            type: 'success',
            text: `🔥 <b>SOLUTION FOUND!</b> All ${gameState.n} queens placed successfully!`,
          })

          // Show celebration!
          setTimeout(() => {
            launchConfetti(150)
          }, 300)
        }

        setGameState((prev) => ({
          ...prev,
          board: step.board,
          currentStepIdx: currentIdx,
          queensPlaced: step.board.filter((c: number) => c !== -1).length,
        }))

        stepMsgs.forEach((msg) => addMessage(msg))

        currentIdx++
        const delay = CONFIG.SPEED_DELAYS[gameState.speed]
        playbackTimeoutRef.current = setTimeout(playStep, delay)
      } else {
        setGameState((prev) => ({
          ...prev,
          isPlaying: false,
          isSolved: true,
        }))
      }
    }

    playStep()
  }, [gameState, addMessage, clearConflictCanvas, launchConfetti])

  const handleHint = useCallback(() => {
    if (gameState.mode !== 'manual' || gameState.isPlaying) return

    const hint = computeHint(gameState.board, gameState.n)
    if (hint) {
      setGameState((prev) => ({ ...prev, hintCell: hint }))
      addMessage({
        type: 'hint',
        text: `💡 <b>Hint:</b> Try Row ${hint.row + 1}, Col ${getColLetter(hint.col)} — it leads to a valid solution. (This is just a suggestion!)`,
      })
    } else {
      addMessage({
        type: 'warning',
        text: `💡 <b>No valid hint available.</b> Your current board state may have conflicts or wrong placements. Try removing some queens and rearranging!`,
      })
    }
  }, [gameState, addMessage])

  const handleReset = useCallback(() => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current)
    }
    if (confettiAnimIdRef.current) {
      cancelAnimationFrame(confettiAnimIdRef.current)
    }
    clearConflictCanvas()
    particlesRef.current = []

    setGameState({
      n: gameState.n,
      board: new Array(gameState.n).fill(-1),
      mode: gameState.mode,
      queensPlaced: 0,
      steps: [],
      currentStepIdx: 0,
      isPlaying: false,
      isPaused: false,
      speed: gameState.speed,
      isSolved: false,
      totalSteps: 0,
      totalBacktracks: 0,
      hintCell: null,
      firstBacktrackSeen: false,
      firstConflictSeen: false,
      firstPlacementSeen: false,
      conflictingQueens: [],
    })
    setMessages([])
  }, [gameState, clearConflictCanvas])

  const handleBoardSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current)
    }
    if (confettiAnimIdRef.current) {
      cancelAnimationFrame(confettiAnimIdRef.current)
    }
    clearConflictCanvas()
    particlesRef.current = []

    const newN = parseInt(e.target.value)
    setGameState({
      n: newN,
      board: new Array(newN).fill(-1),
      mode: 'manual',
      queensPlaced: 0,
      steps: [],
      currentStepIdx: 0,
      isPlaying: false,
      isPaused: false,
      speed: CONFIG.DEFAULT_SPEED,
      isSolved: false,
      totalSteps: 0,
      totalBacktracks: 0,
      hintCell: null,
      firstBacktrackSeen: false,
      firstConflictSeen: false,
      firstPlacementSeen: false,
      conflictingQueens: [],
    })
    setMessages([])
  }

  const handleModeChange = (newMode: 'manual' | 'solve' | 'learn') => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current)
    }
    if (confettiAnimIdRef.current) {
      cancelAnimationFrame(confettiAnimIdRef.current)
    }
    clearConflictCanvas()
    particlesRef.current = []

    setGameState({
      n: gameState.n,
      board: new Array(gameState.n).fill(-1),
      mode: newMode,
      queensPlaced: 0,
      steps: [],
      currentStepIdx: 0,
      isPlaying: false,
      isPaused: false,
      speed: gameState.speed,
      isSolved: false,
      totalSteps: 0,
      totalBacktracks: 0,
      hintCell: null,
      firstBacktrackSeen: false,
      firstConflictSeen: false,
      firstPlacementSeen: false,
      conflictingQueens: [],
    })
    setMessages([])
  }

  useEffect(() => {
    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current)
      }
      if (confettiAnimIdRef.current) {
        cancelAnimationFrame(confettiAnimIdRef.current)
      }
    }
  }, [])

  // Setup canvas sizes
  useEffect(() => {
    const handleResize = () => {
      if (conflictCanvasRef.current) {
        const board = document.querySelector('.board')
        if (board) {
          const rect = board.getBoundingClientRect()
          conflictCanvasRef.current.width = rect.width
          conflictCanvasRef.current.height = rect.height
          conflictCanvasRef.current.style.left = rect.left + 'px'
          conflictCanvasRef.current.style.top = rect.top + 'px'
        }
      }

      if (confettiCanvasRef.current) {
        confettiCanvasRef.current.width = window.innerWidth
        confettiCanvasRef.current.height = window.innerHeight
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [gameState.n])

  // Update board element classes
  useEffect(() => {
    const board = document.querySelector('.board')
    if (!board) return

    if (gameState.isSolved) {
      board.classList.add('board-solved')
    } else {
      board.classList.remove('board-solved')
    }
  }, [gameState.isSolved])

  return (
    <div className="nqueens-container">
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>
      
      <canvas
        ref={confettiCanvasRef}
        className="confetti-canvas"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div className="nq-header">
        <div className="header-left">
          <div className="nq-logo">
            <div className="logo-icon">♛</div>
            <div className="logo-text">
              <h1>N-Queens</h1>
              <span>AI Learning System</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="mode-selector">
            {(['manual', 'solve', 'learn'] as const).map((m) => (
              <button
                key={m}
                className={`mode-btn ${gameState.mode === m ? 'active' : ''}`}
                onClick={() => handleModeChange(m)}
                disabled={gameState.isPlaying}
              >
                {m === 'manual' && '🎮'}
                {m === 'solve' && '🤖'}
                {m === 'learn' && '📚'}
                <span> {m.charAt(0).toUpperCase() + m.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="header-right">
          <select
            className="board-size-select"
            onChange={handleBoardSizeChange}
            value={gameState.n}
            disabled={gameState.isPlaying}
          >
            {[4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} × {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main */}
      <div className="nq-main">
        {/* Board Section */}
        <div className="board-section">
          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-icon">♛</span>
              <span className="stat-value">{gameState.queensPlaced}</span>
              <span className="stat-label">/ {gameState.n} Queens</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📍</span>
              <span className="stat-value">{gameState.currentStepIdx}</span>
              <span className="stat-label">Steps</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">↩️</span>
              <span className="stat-value">{gameState.totalBacktracks}</span>
              <span className="stat-label">Backtracks</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏳</span>
              <span className="stat-value">{gameState.isSolved ? '✓ Solved' : 'Ready'}</span>
            </div>
          </div>

          {/* Board Grid */}
          <div className="board-wrapper">
            <canvas
              ref={conflictCanvasRef}
              className="conflict-canvas"
              style={{
                position: 'absolute',
              }}
            />
            <div 
              className="board"
              style={{
                gridTemplateColumns: `repeat(${gameState.n}, minmax(40px, 1fr))`,
                gridTemplateRows: `repeat(${gameState.n}, minmax(40px, 1fr))`,
                maxWidth: `${Math.min(600, gameState.n * 60)}px`,
                maxHeight: `${Math.min(600, gameState.n * 60)}px`,
              }}
            >
              {Array.from({ length: gameState.n }).map((_, row) =>
                Array.from({ length: gameState.n }).map((_, col) => {
                  const hasConflict = gameState.conflictingQueens.some(c => c.row === row && c.col === gameState.board[row])
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`board-cell ${(row + col) % 2 === 0 ? 'light' : ''} ${
                        gameState.board[row] === col ? 'has-queen' : ''
                      } ${hasConflict ? 'conflict-cell' : ''} ${gameState.isSolved ? 'solution-cell' : ''}`}
                      onClick={() => handleCellClick(row, col)}
                      title={`Row ${row + 1}, Column ${getColLetter(col)}`}
                    >
                      {gameState.board[row] === col && (
                        <div className={`queen ${hasConflict ? 'conflicted' : ''} ${gameState.isSolved ? 'solved-queen' : ''}`}>
                          ♛
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="playback-controls">
            <div className="control-group-left">
              <button
                className="ctrl-btn primary"
                onClick={handleAutoSolve}
                disabled={gameState.isPlaying || gameState.isSolved || gameState.mode === 'manual'}
                title={gameState.mode === 'manual' ? 'Use AI Tutor or Learn mode to watch the algorithm' : ''}
              >
                ▶ {gameState.mode === 'manual' ? 'Solve (AI Tutor)' : 'Start'}
              </button>
              <button className="ctrl-btn" disabled={!gameState.isPlaying}>
                ⏸ Pause
              </button>
              <button className="ctrl-btn" disabled={!gameState.isPlaying}>
                ⏭ Step
              </button>
              <button className="ctrl-btn" onClick={handleHint} disabled={gameState.mode !== 'manual' || gameState.isPlaying}>
                💡 Hint
              </button>
              <button className="ctrl-btn danger" onClick={handleReset}>
                ↺ Reset
              </button>
            </div>
            <div className="control-group-right">
              <label>Speed</label>
              <input
                type="range"
                min="1"
                max="10"
                value={gameState.speed}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    speed: parseInt(e.target.value),
                  }))
                }
              />
              <span className="speed-value">{gameState.speed}x</span>
            </div>
          </div>
        </div>

        {/* Tutor Panel */}
        <div className="tutor-panel">
          <div className="tutor-header">
            <div className="ai-avatar">
              <div className="avatar-emoji">🤖</div>
            </div>
            <div className="tutor-title">
              <h2>AI Tutor</h2>
              <div className="tutor-status">Algorithm Guide</div>
            </div>
          </div>

          <div className="glass-card">
            <div className="algo-state">
              <div className="algo-state-header">📊 Algorithm State</div>
              <div className="algo-state-body">
                <div className="algo-row">
                  <span className="algo-key">Mode:</span>
                  <span className="algo-val">{gameState.mode}</span>
                </div>
                <div className="algo-row">
                  <span className="algo-key">Status:</span>
                  <span className="algo-val">{gameState.isPlaying ? 'Running...' : gameState.isSolved ? 'Solved!' : 'Ready'}</span>
                </div>
                <div className="algo-row">
                  <span className="algo-key">Board:</span>
                  <span className="algo-val">{gameState.n}×{gameState.n}</span>
                </div>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="glass-card">
              <div className="tutor-messages" style={{ maxHeight: '320px', overflowY: 'auto', lineHeight: '1.7', padding: '4px 0' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className="message-item" style={{ marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: msg.text }} />
                ))}
              </div>
            </div>
          )}

          <div className="glass-card">
            <div className="fact-card">
              <div className="fact-header">💡 Fun Fact</div>
              <p>{currentFact}</p>
            </div>
          </div>

          <div className="glass-card">
            <div className="code-snapshot">
              <div className="code-header">Code Snippet</div>
              <div className="code-block">
                <code>
                  if (isSafe(board, row, col)) {'{'}
                  <br />
                  {'  '}board[row] = col<br />
                  {'  '}backtrack(row + 1)
                  <br />
                  {'}'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
