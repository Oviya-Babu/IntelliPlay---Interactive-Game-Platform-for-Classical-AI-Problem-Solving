// FRONTEND IMPLEMENTATION GUIDE FOR 8-PUZZLE TEACHING SYSTEM
// File: frontend/src/components/games/EightPuzzle.tsx

// ============================================
// STATE ADDITIONS (after current state vars)
// ============================================

// Add these state variables after the existing ones:
  const [bestMoves, setBestMoves] = useState<any[]>([])
  const [moveFeedback, setMoveFeedback] = useState<any>(null)
  const [showBestMoveHint, setShowBestMoveHint] = useState(false)

// ============================================
// NEW FUNCTIONS (add after handleTileClick)
// ============================================

  const loadBestMoves = useCallback(async () => {
    if (!sessionId) return
    try {
      const response = await fetch('/api/eightpuzzle/best-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
      const data = await response.json()
      setBestMoves(data.best_moves || [])
      console.log('[8-PUZZLE] Best moves loaded:', data.best_moves)
    } catch (e) {
      console.error('Failed to load best moves', e)
    }
  }, [sessionId])

  const rateMoveAndFeedback = useCallback(async (newBoard: number[]) => {
    if (!sessionId) return
    try {
      const response = await fetch('/api/eightpuzzle/rate-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, board: newBoard })
      })
      const feedback = await response.json()
      setMoveFeedback(feedback)
      console.log('[8-PUZZLE] Move feedback:', feedback)
      
      // Clear feedback after 3 seconds
      setTimeout(() => setMoveFeedback(null), 3000)
    } catch (e) {
      console.error('Failed to rate move', e)
    }
  }, [sessionId])

// ============================================
// UPDATE handleTileClick (add this after move succeeds)
// ============================================

  // After the line: setIsSolved(res.is_solved)
  // Add:
      await loadBestMoves()
      await rateMoveAndFeedback(res.board)

// ============================================
// UPDATE startGame (add this call)
// ============================================

  // After useGameStore.getState().startGame('eightpuzzle')
  // Add:
      await loadBestMoves()

// ============================================
// FEEDBACK DISPLAY (add to JSX after moves badge)
// ============================================

{moveFeedback && sessionId && !aiSolving && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`rounded-lg px-4 py-2 text-sm text-center ${
      moveFeedback.quality === 'optimal'
        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
        : moveFeedback.quality === 'good'
        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
        : 'bg-red-500/20 border border-red-500/50 text-red-300'
    }`}
  >
    <p className="font-semibold">{moveFeedback.feedback}</p>
  </motion.div>
)}

// ============================================
// BEST MOVE SUGGESTION (add to right panel)
// ============================================

{!aiSolving && bestMoves.length > 0 && !isSolved && (
  <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
    <p className="text-xs font-semibold text-white/70 mb-2">💡 BEST NEXT MOVE:</p>
    <div className="space-y-1">
      <p className="text-sm text-[var(--accent,#6c63ff)] font-semibold">
        {bestMoves[0].explanation}
      </p>
      <p className="text-xs text-white/60">
        f-cost: {bestMoves[0].f} (g={bestMoves[0].g} + h={bestMoves[0].h})
      </p>
    </div>
  </div>
)}

// ============================================
// COMPLETION CHECK (update in return/render)
// ============================================

// Change the solved display to:
{isSolved && (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    className="mt-2 rounded-xl bg-emerald-500 px-8 py-4 text-center text-xl font-bold text-white"
  >
    {board.join('') === '123456780' 
      ? `✓ SOLVED in ${moveCount} moves!`
      : `Board state: ${board.join('')}` }
  </motion.div>
)}

// ============================================
// GOAL STATE VALIDATION
// ============================================

// The component already validates with:
// const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0]
// Ensure strict equality check:
// is_solved = list(new_state.board) == GOAL_STATE

// ============================================
// SOLVABILITY CHECK (backend already handles)
// ============================================

// eight_puzzle.py already has:
// def is_solvable(self) -> bool:
//   """Check if board is solvable using inversion count parity."""
//   inversions = 0
//   tiles = [t for t in self.board if t != 0]
//   for i in range(len(tiles)):
//     for j in range(i + 1, len(tiles)):
//       if tiles[i] > tiles[j]:
//         inversions += 1
//   return inversions % 2 == 0

// ============================================
// KEY TEACHING FEATURES ENABLED:
// ============================================
// 1. Best move suggestion with heuristic score
// 2. Move quality feedback (optimal/good/suboptimal)
// 3. Explanation for why it's recommended
// 4. Step-by-step AI solving with explanations
// 5. Strict goal state validation
// 6. Solvability checking before starting
