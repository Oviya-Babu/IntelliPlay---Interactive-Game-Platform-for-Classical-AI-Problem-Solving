

export interface NewGameRequest {
  difficulty: number
  mode: string
}

export interface MoveRequest {
  session_id: string
  move: number[]
}

export interface GameStateResponse {
  session_id: string
  board: string[]
  current_player: string
  winner: string | null
  is_terminal: boolean
  move_count: number
  ai_result?: unknown
}

// Phase 2 stub types for gameService
export interface ScorePayload {
  session_id: string;
  game: string;
  stars: number;
  score: number;
  time_ms: number;
}
export interface ScoreResponse {
  success: boolean;
  message: string;
}
export interface LeaderboardResponse {
  rankings: unknown[];
}
export interface EvaluateRequest {
  session_id: string;
  move: number[];
}
export interface EvaluateResponse {
  score: number;
  explanation: string;
}

// 8-Puzzle
export interface NewEightPuzzleResponse {
  session_id: string
  board: number[]
  optimal_moves: number
  blank_pos: number
}

export interface MoveEightPuzzleRequest {
  session_id: string
  tile_pos: number
}

export interface MoveEightPuzzleResponse {
  board: number[]
  blank_pos: number
  move_count: number
  is_solved: boolean
  optimal_moves: number
}

// Missionaries
export interface MissionariesStatePayload {
  m_left: number
  c_left: number
  boat_side: number
}

export interface NewMissionariesResponse {
  session_id: string
  state: MissionariesStatePayload
  optimal_moves: number
}

export interface MoveMissionariesRequest {
  session_id: string
  missionaries: number
  cannibals: number
}

export interface MoveMissionariesResponse {
  state: MissionariesStatePayload
  is_solved: boolean
  move_count: number
}

// N-Queens
export interface NQueensNewRequest {
  n?: number
}

export interface NQueensNewResponse {
  session_id: string
  board: number[]
  n: number
}

export interface NQueensMoveRequest {
  session_id: string
  row: number
  col: number
}

export interface NQueensMoveResponse {
  board: number[]
  conflicts: number[][]
  domains: Record<string, number[]>
  is_solved: boolean
}

// Cryptarithmetic
export interface CryptarithNewRequest {
  equation?: string
}

export interface CryptarithNewResponse {
  session_id: string
  equation: string
  letters: string[]
  leading_letters: string[]
  domains: Record<string, number[]>
}

export interface CryptarithAssignRequest {
  session_id: string
  letter: string
  digit: number
}

export interface CryptarithAssignResponse {
  assignment: Record<string, number>
  is_solved: boolean
  is_contradiction: boolean
}

export interface CryptarithSolveRequest {
  word1: string
  word2: string
  result: string
  mode?: string
  use_mrv?: boolean
}

export interface CryptarithSolveResponse {
  solution: Record<string, number> | null
  steps: Array<{
    step_id: number
    type: string
    letter: string
    digit: number
    assignment: Record<string, number>
    partial_sum: number
    domains: Record<string, number[]>
    msg: string
    depth: number
  }>
  metrics: {
    nodes_explored: number
    backtracks: number
    nodes_pruned: number
    max_depth: number
    time_ms: number
    mode: string
  }
  is_solvable: boolean
  error: string | null
}

export interface CryptarithValidateRequest {
  word1: string
  word2: string
  result: string
}

export interface CryptarithValidateResponse {
  is_valid: boolean
  is_solvable: boolean
  error: string | null
  unique_letters: number
  solution: Record<string, number> | null
}

export interface ApiSuccessResponse<T> {
  data: T
  status: number
}

export interface ApiErrorResponse {
  error: string
  status: number
}
