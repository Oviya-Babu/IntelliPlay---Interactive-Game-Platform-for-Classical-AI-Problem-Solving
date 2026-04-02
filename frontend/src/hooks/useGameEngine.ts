import { useState, useCallback } from 'react'
import type { Difficulty, GameMode, GameStatus } from '@/types/game.types'
import { gameService } from '@/services/gameService'

export function useGameEngine() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [board, setBoard] = useState<string[]>(Array(9).fill(''))
  const [status, setStatus] = useState<GameStatus>('idle')
  const [winner, setWinner] = useState<string | null>(null)
  const [moveCount, setMoveCount] = useState(0)

  const startGame = useCallback(async (difficulty: Difficulty, mode: GameMode) => {
    try {
      setStatus('playing')
      setWinner(null)
      setMoveCount(0)
      setBoard(Array(9).fill(''))
      
      const res = await gameService.newGame('tictactoe', { difficulty, mode })
      setSessionId(res.session_id)
      setBoard(res.board)
      setMoveCount(res.move_count)
      setWinner(res.winner)
      if (res.is_terminal) {
        setStatus('game_over')
      }
    } catch (e) {
      console.error('Failed to start game', e)
      setStatus('idle')
    }
  }, [])

  const makeMove = useCallback(async (pos: number) => {
    if (!sessionId || status === 'ai_thinking' || status === 'game_over' || board[pos] !== '') {
      return
    }
    
    // Optimistic update
    const newBoard = [...board]
    // Usually we would know who is current player, but assuming "X" for human in pvai for now.
    newBoard[pos] = 'X' 
    setBoard(newBoard)
    setStatus('ai_thinking')
    
    try {
      const res = await gameService.makeMove('tictactoe', { session_id: sessionId, move: [pos] })
      setBoard(res.board)
      setMoveCount(res.move_count)
      setWinner(res.winner)
      
      if (res.is_terminal) {
        setStatus('game_over')
      } else {
        setStatus('playing')
      }
    } catch (e) {
      console.error('Move failed', e)
      setBoard(board) // revert
      setStatus('playing')
    }
  }, [sessionId, status, board])

  const resetGame = useCallback(() => {
    setSessionId(null)
    setBoard(Array(9).fill(''))
    setStatus('idle')
    setWinner(null)
    setMoveCount(0)
  }, [])

  return {
    sessionId,
    board,
    status,
    winner,
    moveCount,
    startGame,
    makeMove,
    resetGame,
    setStatus // Expose in case component needs to override (e.g., ai thinking)
  }
}
