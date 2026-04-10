import { useParams, useNavigate } from 'react-router-dom'
import TicTacToe from '@/components/games/TicTacToe'
import EightPuzzleNew from '@/components/games/EightPuzzleNew'
import MissionariesGame from '@/components/games/missionaries/MissionariesGame'
import NQueensGame from '@/components/games/nqueens/NQueensGame'
import Cryptarithmetic from '@/components/games/Cryptarithmetic'

/* Back button shown on non-TicTacToe games (TicTacToe has its own full layout) */
function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="fixed top-[76px] left-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                 bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-gray-400
                 hover:bg-white/[0.10] hover:text-white transition-all duration-200 backdrop-blur-sm"
    >
      ← Back
    </button>
  )
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()

  const shellClass =
    'w-full min-h-[calc(100dvh-60px)] bg-[var(--bg-base,#08080f)] text-[var(--text-primary)] overflow-x-hidden'

  // TicTacToe manages its own full layout (with back in its own panel structure)
  if (!gameId || gameId === 'tictactoe') {
    return <TicTacToe />
  }

  // NQueens manages its own full-viewport layout
  if (gameId === 'nqueens') {
    return <NQueensGame />
  }

  return (
    <>
      <BackButton />
      <div className={shellClass}>
        {gameId === 'eightpuzzle' && <EightPuzzleNew />}
        {gameId === 'missionaries' && <MissionariesGame />}
        {gameId === 'cryptarith' && <Cryptarithmetic />}
      </div>
    </>
  )
}
