export type GameId = 'tictactoe' | 'eight_puzzle' | 'missionaries' | 'nqueens' | 'cryptarithmetic'
export type GameMode = 'pvai' | 'aivai'
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type GameStatus = 'idle' | 'playing' | 'ai_thinking' | 'game_over' | 'won' | 'lost' | 'draw'

export interface TicTacToeState {
  board: string[]
  current_player: string
  winner: string | null
  is_terminal: boolean
  move_count: number
}

export interface EightPuzzleState {
  board: number[]
  blank_pos: number
  move_count: number
  is_solved: boolean
  optimal_moves: number
  session_id: string
}

export interface MissionariesGameState {
  m_left: number
  c_left: number
  boat_side: number
  move_count: number
  is_solved: boolean
  optimal_moves: number
  session_id: string
}

export interface NQueensState {
  board: number[]
  n: number
  conflicts: number[][]
  domains: Record<string, number[]>
  is_solved: boolean
  session_id: string
}

export interface CryptarithState {
  session_id: string
  equation: string
  letters: string[]
  leading_letters: string[]
  domains: Record<string, number[]>
  assignment: Record<string, number>
  is_solved: boolean
  is_contradiction: boolean
}

// Ensure PAR_TIME constants or other types still exported if needed across the app.
export const PAR_TIME_MS: Record<GameId, number> = {
  tictactoe: 60000,
  eight_puzzle: 300000,
  missionaries: 120000,
  nqueens: 180000,
  cryptarithmetic: 240000,
}
