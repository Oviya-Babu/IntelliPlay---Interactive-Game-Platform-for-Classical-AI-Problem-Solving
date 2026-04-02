/* ══════════════════════════════════════════
   gameService.ts — Game API calls
   ══════════════════════════════════════════ */

import { get, post } from './api'
import type {
  NewGameRequest,
  GameStateResponse,
  MoveRequest,
  ScorePayload,
  ScoreResponse,
  LeaderboardResponse,
  EvaluateRequest,
  EvaluateResponse,
  NewEightPuzzleResponse,
  MoveEightPuzzleRequest,
  MoveEightPuzzleResponse,
  NewMissionariesResponse,
  MoveMissionariesRequest,
  MoveMissionariesResponse,
  NQueensNewRequest,
  NQueensNewResponse,
  NQueensMoveRequest,
  NQueensMoveResponse,
  CryptarithNewRequest,
  CryptarithNewResponse,
  CryptarithAssignRequest,
  CryptarithAssignResponse,
  CryptarithSolveRequest,
  CryptarithSolveResponse,
  CryptarithValidateRequest,
  CryptarithValidateResponse,
} from '@/types/api.types'
import type { GameId } from '@/types/game.types'

export const gameService = {
  /** Start a new game session */
  newGame: (game: GameId, req: NewGameRequest) =>
    post<GameStateResponse, NewGameRequest>(`/games/${game}/new`, req),

  /** Make a player move */
  makeMove: (game: GameId, req: MoveRequest) =>
    post<GameStateResponse, MoveRequest>(`/games/${game}/move`, req),

  /** Evaluate a hypothetical move (WhatIf simulator) */
  evaluateMove: (game: GameId, req: EvaluateRequest) =>
    post<EvaluateResponse, EvaluateRequest>(`/games/${game}/evaluate`, req),

  /** Submit a completed game score */
  submitScore: (payload: ScorePayload) =>
    post<ScoreResponse, ScorePayload>('/scores', payload),

  /** Fetch top-10 leaderboard for a game */
  getLeaderboard: (game: GameId, limit = 10) =>
    get<LeaderboardResponse>(`/leaderboard/${game}?limit=${limit}`),

  // ── 8-Puzzle ──
  newEightPuzzle: () =>
    post<NewEightPuzzleResponse, Record<string, never>>('/games/eightpuzzle/new', {}),

  moveEightPuzzle: (req: MoveEightPuzzleRequest) =>
    post<MoveEightPuzzleResponse, MoveEightPuzzleRequest>('/games/eightpuzzle/move', req),

  // ── Missionaries ──
  newMissionaries: () =>
    post<NewMissionariesResponse, Record<string, never>>('/games/missionaries/new', {}),

  moveMissionaries: (req: MoveMissionariesRequest) =>
    post<MoveMissionariesResponse, MoveMissionariesRequest>('/games/missionaries/move', req),

  // -- N-Queens --
  newNQueens: (n?: number) =>
    post<NQueensNewResponse, NQueensNewRequest>('/games/nqueens/new', { n: n ?? 8 }),

  moveNQueens: (req: NQueensMoveRequest) =>
    post<NQueensMoveResponse, NQueensMoveRequest>('/games/nqueens/move', req),

  // -- Cryptarithmetic --
  newCryptarith: (equation?: string) =>
    post<CryptarithNewResponse, CryptarithNewRequest>('/games/cryptarith/new', { equation }),

  assignCryptarith: (req: CryptarithAssignRequest) =>
    post<CryptarithAssignResponse, CryptarithAssignRequest>('/games/cryptarith/assign', req),

  solveCryptarith: (req: CryptarithSolveRequest) =>
    post<CryptarithSolveResponse, CryptarithSolveRequest>('/games/cryptarith/solve', req),

  validateCryptarith: (req: CryptarithValidateRequest) =>
    post<CryptarithValidateResponse, CryptarithValidateRequest>('/games/cryptarith/validate', req),
}
