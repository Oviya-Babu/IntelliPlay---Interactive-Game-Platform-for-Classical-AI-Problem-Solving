"""
backend/schemas/game.py
Pydantic v2 schemas for game API endpoints.
"""
from pydantic import BaseModel

# TicTacToe
class NewGameRequest(BaseModel):
    difficulty: int
    mode: str

class MoveRequest(BaseModel):
    session_id: str
    move: list[int]

class GameStateResponse(BaseModel):
    session_id: str
    board: list[str]
    current_player: str
    winner: str | None
    is_terminal: bool
    move_count: int

# 8-Puzzle
class NewEightPuzzleResponse(BaseModel):
    session_id: str
    board: list[int]
    optimal_moves: int
    blank_pos: int

class MoveEightPuzzleRequest(BaseModel):
    session_id: str
    tile_pos: int

class MoveEightPuzzleResponse(BaseModel):
    board: list[int]
    blank_pos: int
    move_count: int
    is_solved: bool
    optimal_moves: int

# Missionaries
class MissionariesStateModel(BaseModel):
    m_left: int
    c_left: int
    boat_side: int

class NewMissionariesResponse(BaseModel):
    session_id: str
    state: MissionariesStateModel
    optimal_moves: int

class MoveMissionariesRequest(BaseModel):
    session_id: str
    missionaries: int
    cannibals: int

class MoveMissionariesResponse(BaseModel):
    state: MissionariesStateModel
    is_solved: bool
    move_count: int

# N-Queens
class NQueensNewRequest(BaseModel):
    n: int = 8

class NQueensNewResponse(BaseModel):
    session_id: str
    board: list[int]
    n: int

class NQueensMoveRequest(BaseModel):
    session_id: str
    row: int
    col: int

class NQueensMoveResponse(BaseModel):
    board: list[int]
    conflicts: list[list[int]]
    domains: dict[str, list[int]]
    is_solved: bool

# Cryptarithmetic
class CryptarithNewRequest(BaseModel):
    equation: str = "SEND + MORE = MONEY"

class CryptarithNewResponse(BaseModel):
    session_id: str
    equation: str
    letters: list[str]
    leading_letters: list[str]
    domains: dict[str, list[int]]

class CryptarithAssignRequest(BaseModel):
    session_id: str
    letter: str
    digit: int

class CryptarithAssignResponse(BaseModel):
    assignment: dict[str, int]
    is_solved: bool
    is_contradiction: bool


class CryptarithSolveRequest(BaseModel):
    word1: str
    word2: str
    result: str
    mode: str = "full_csp"  # brute_force | backtrack | forward_checking | full_csp
    use_mrv: bool = True


class CryptarithSolveResponse(BaseModel):
    solution: dict[str, int] | None
    steps: list[dict]
    metrics: dict
    is_solvable: bool
    error: str | None = None


class CryptarithValidateRequest(BaseModel):
    word1: str
    word2: str
    result: str


class CryptarithValidateResponse(BaseModel):
    is_valid: bool
    is_solvable: bool
    error: str | None = None
    unique_letters: int = 0
    solution: dict[str, int] | None = None

