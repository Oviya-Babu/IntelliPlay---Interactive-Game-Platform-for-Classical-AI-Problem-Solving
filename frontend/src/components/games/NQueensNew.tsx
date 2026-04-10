import React, { useState, useRef, useCallback, useEffect } from 'react'
import './NQueensNew.css'

function isSafe(board: number[], row: number, col: number): boolean {
  for (let i = 0; i < row; i++) {
    if (board[i] === -1) continue
    if (board[i] === col) return false
    if (Math.abs(board[i] - col) === Math.abs(i - row)) return false
  }
  return true
}

function isSafeComplete(board: number[], row: number, col: number, n: number): boolean {
  for (let i = 0; i < n; i++) {
    if (i === row || board[i] === -1) continue
    if (board[i] === col) return false
    if (Math.abs(board[i] - col) === Math.abs(i - row)) return false
  }
  return true
}

function generateSolutionSteps(n: number) {
  const steps: any[] = []
  const board = new Array(n).fill(-1)

  function backtrack(row: number): boolean {
    if (row === n) {
      steps.push({ type: 'solution', board: [...board], msg: `✅ SOLVED!` })
      return true
    }

    for (let col = 0; col < n; col++) {
      if (isSafe(board, row, col)) {
        board[row] = col
        steps.push({ type: 'place', row, col, board: [...board], msg: `Placing at Row ${row + 1}` })

        if (backtrack(row + 1)) return true

        board[row] = -1
        steps.push({ type: 'backtrack', row, col, board: [...board], msg: `Backtracking from Row ${row + 1}` })
      }
    }
    return false
  }

  backtrack(0)
  return steps
}

export default function NQueensNew() {
  const [n, setN] = useState(8)
  const [board, setBoard] = useState(new Array(8).fill(-1))
  const [mode, setMode] = useState<'manual' | 'solve'>('manual')
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(5)
  const [message, setMessage] = useState('')
  const [isSolved, setIsSolved] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const queensPlaced = board.filter((c) => c !== -1).length

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (mode !== 'manual' || isPlaying) return

      let newBoard = [...board]

      // Toggle queen
      if (newBoard[row] === col) {
        newBoard[row] = -1
        setMessage(`Removed from Row ${row + 1}`)
      } else {
        if (newBoard[row] !== -1) {
          newBoard[newBoard[row]] = -1 // Clear the row
        }

        if (isSafeComplete(newBoard, row, col, n)) {
          newBoard[row] = col
          setMessage(`✅ Placed at Row ${row + 1}  ${isSafeComplete(newBoard, row, col, n) ? ' (Valid: no conflicts)' : ''}`)

          const allPlaced = newBoard.filter((c) => c !== -1).length === n
          if (allPlaced) {
            setIsSolved(true)
            setMessage(`🎉 ALL QUEENS PLACED! Perfect solution!`)
          }
        } else {
          setMessage(`❌ CONFLICT! Can't place there.`)
          return
        }
      }

      setBoard(newBoard)
      setIsSolved(false)
    },
    [board, n, mode, isPlaying],
  )

  const handleSolve = useCallback(() => {
    if (isPlaying) return

    setMessage('🤖 AI is solving using backtracking...')
    setIsPlaying(true)
    setIsSolved(false)
    const steps = generateSolutionSteps(n)

    let idx = 0
    const speeds = [2000, 1500, 1000, 700, 500, 350, 200, 120, 60, 20]
    const delay = speeds[speed - 1]

    const playStep = () => {
      if (idx >= steps.length) {
        setIsPlaying(false)
        setIsSolved(true)
        return
      }

      const step = steps[idx]
      setBoard(step.board)
      setMessage(step.msg)

      idx++
      timerRef.current = setTimeout(playStep, delay)
    }

    playStep()
  }, [n, isPlaying, speed])

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setBoard(new Array(n).fill(-1))
    setIsPlaying(false)
    setIsSolved(false)
    setMessage('')
  }

  const handleBoardSizeChange = (newN: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setN(newN)
    setBoard(new Array(newN).fill(-1))
    setIsPlaying(false)
    setIsSolved(false)
    setMessage('')
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="nq-container">
      {/* HEADER */}
      <header className="nq-header">
        <div className="header-content">
          <h1>♛ N-Queens AI Learning</h1>

          <div className="header-controls">
            <div className="mode-buttons">
              {(['manual', 'solve'] as const).map((m) => (
                <button
                  key={m}
                  className={`mode-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => {
                    handleReset()
                    setMode(m)
                  }}
                  disabled={isPlaying}
                >
                  {m === 'manual' ? '🎮 Manual' : '🤖 Solve'}
                </button>
              ))}
            </div>

            <select className="size-select" value={n} onChange={(e) => handleBoardSizeChange(parseInt(e.target.value))} disabled={isPlaying}>
              {Array.from({ length: 7 }, (_, i) => 4 + i).map((num) => (
                <option key={num} value={num}>
                  {num} × {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="nq-main">
        {/* LEFT: GAME BOARD */}
        <div className="game-area">
          <div className="board-info">
            <div className="info-item">
              <span className="label">Queens:</span>
              <span className="value">{queensPlaced}/{n}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{isSolved ? '✓ SOLVED' : 'Playing'}</span>
            </div>
          </div>

          <div className="board-container">
            <div className="board" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {Array.from({ length: n }).map((_, row) =>
                Array.from({ length: n }).map((_, col) => {
                  const hasQueen = board[row] === col

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`board-cell ${(row + col) % 2 === 0 ? 'light' : 'dark'} ${hasQueen ? 'has-queen' : ''} ${
                        isSolved && hasQueen ? 'solved' : ''
                      }`}
                      onClick={() => handleCellClick(row, col)}
                    >
                      {hasQueen && <span className="queen">♛</span>}
                    </div>
                  )
                }),
              )}
            </div>
          </div>

          <div className="feedback">
            {mode === 'manual' ? (
              <span className="feedback-text">{message || '👆 Click to place queens - no conflicts allowed!'}</span>
            ) : (
              <span className="feedback-text">{message || '🤖 Watch the AI solve it!'}</span>
            )}
          </div>

          <div className="controls">
            {mode === 'solve' ? (
              <>
                <button className="btn btn-primary" onClick={handleSolve} disabled={isPlaying}>
                  ▶ Solve
                </button>
                <div className="speed-group">
                  <label>Speed:</label>
                  <input type="range" min="1" max="10" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} disabled={isPlaying} />
                  <span>{speed}x</span>
                </div>
              </>
            ) : (
              <button className="btn btn-success" onClick={handleReset} disabled={isPlaying}>
                🔄 New Game
              </button>
            )}

            <button className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* RIGHT: INSTRUCTIONS */}
        <aside className="info-panel">
          <h2>📚 How to Play</h2>

          {mode === 'manual' ? (
            <div className="instructions">
              <div className="instruction-item">
                <strong>Goal:</strong> Place {n} queens on the board so none attack each other
              </div>
              <div className="instruction-item">
                <strong>Rules:</strong>
                <ul>
                  <li>No two queens in same column</li>
                  <li>No two queens in same row</li>
                  <li>No two queens in same diagonal</li>
                </ul>
              </div>
              <div className="instruction-item">
                <strong>How:</strong> Click a cell to place a queen. Click again to remove it.
              </div>
              <div className="instruction-item">
                <strong>Hint:</strong> Each row must have exactly one queen.
              </div>
            </div>
          ) : (
            <div className="instructions">
              <div className="instruction-item">
                <strong>Algorithm:</strong> Backtracking
              </div>
              <div className="instruction-item">
                <strong>How it works:</strong>
                <ol>
                  <li>Try each column in current row</li>
                  <li>Check if move is safe (no conflicts)</li>
                  <li>If safe, place queen and move to next row</li>
                  <li>If stuck, backtrack and try next column</li>
                  <li>Repeat until solution found</li>
                </ol>
              </div>
              <div className="instruction-item">
                <strong>Your task:</strong> Watch and learn how backtracking solves this problem!
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
