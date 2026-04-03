"""
backend/routes/game.py
API and WebSocket routes for all games.
"""
import uuid
import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from backend.schemas.game import (
    NewGameRequest, MoveRequest, GameStateResponse,
    NewEightPuzzleResponse, MoveEightPuzzleRequest, MoveEightPuzzleResponse,
    MissionariesStateModel, NewMissionariesResponse, MoveMissionariesRequest, MoveMissionariesResponse,
    NQueensNewRequest, NQueensNewResponse, NQueensMoveRequest, NQueensMoveResponse,
    CryptarithNewRequest, CryptarithNewResponse, CryptarithAssignRequest, CryptarithAssignResponse,
    CryptarithSolveRequest, CryptarithSolveResponse,
    CryptarithValidateRequest, CryptarithValidateResponse,
)
from backend.games.tictactoe import TicTacToeState
from backend.games.eight_puzzle import EightPuzzleState, GOAL_STATE
from backend.games.missionaries import MissionariesState
from backend.games.nqueens import NQueensState, is_safe, get_conflicts, get_domains
from backend.agents.game_agent import TicTacToeAgent
from backend.agents.search_agent import SearchAgent
from backend.agents.csp_agent import CSPAgent
from backend.algorithms.astar import astar
from backend.algorithms.bfs import bfs
from backend.algorithms.csp import solve_nqueens
from backend.algorithms.cryptarith_solver import solve_to_stepdicts, parse_puzzle, solve_cryptarithm\nfrom backend.algorithms.astar_teaching import get_best_moves, rate_user_move

router = APIRouter()

sessions: dict[str, dict] = {}

# ==================== TICTACTOE ====================
@router.post("/tictactoe/new", response_model=GameStateResponse)
async def create_new_game(req: NewGameRequest):
    session_id = str(uuid.uuid4())
    state = TicTacToeState.initial()
    sessions[session_id] = {
        "game": "tictactoe",
        "state": state,
        "difficulty": req.difficulty,
        "mode": req.mode,
        "move_count": 0
    }
    return GameStateResponse(
        session_id=session_id,
        board=state.board,
        current_player=state.current_player,
        winner=state.winner(),
        is_terminal=state.is_terminal(),
        move_count=0
    )

@router.post("/tictactoe/move")
async def make_move_tictactoe(req: MoveRequest):
    session = sessions.get(req.session_id)
    if not session or session.get("game") != "tictactoe":
        raise HTTPException(status_code=404, detail="Session not found")
    state: TicTacToeState = session["state"]
    move = req.move[0] if req.move else None
    if move is None or move not in state.legal_moves():
        raise HTTPException(status_code=400, detail="Invalid move")
    try:
        new_state = state.apply_move(move)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    session["state"] = new_state
    session["move_count"] += 1
    response_data = {
        "session_id": req.session_id,
        "board": new_state.board,
        "current_player": new_state.current_player,
        "winner": new_state.winner(),
        "is_terminal": new_state.is_terminal(),
        "move_count": session["move_count"]
    }
    if not new_state.is_terminal() and session["mode"] == "pvai" and new_state.current_player == "O":
        agent = TicTacToeAgent()
        result = agent.get_best_move(new_state)
        if result.best_move is not None:
            new_state = new_state.apply_move(result.best_move)
            session["state"] = new_state
            session["move_count"] += 1
            response_data.update({
                "board": new_state.board,
                "current_player": new_state.current_player,
                "winner": new_state.winner(),
                "is_terminal": new_state.is_terminal(),
                "move_count": session["move_count"]
            })
            session["latest_ai_steps"] = result.steps
            session["latest_ai_best_move"] = result.best_move
    return response_data

@router.websocket("/ws/tictactoe/{session_id}")
async def websocket_tictactoe(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session or session.get("game") != "tictactoe":
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return
    state: TicTacToeState = session["state"]
    
    if session["mode"] == "aivai":
        agent = TicTacToeAgent()
        while not state.is_terminal():
            result = agent.get_best_move(state)
            await agent.stream_steps(websocket, result.steps, delay_ms=500)
            if result.best_move is not None:
                state = state.apply_move(result.best_move)
                session["state"] = state
            else:
                break
        await websocket.send_json({"type": "done", "best_move": None, "total_steps": 0})
        await websocket.close()
        return

    steps_to_stream = session.get("latest_ai_steps", [])
    best_move = session.get("latest_ai_best_move", None)
    if not steps_to_stream and not state.is_terminal() and session["mode"] == "pvai" and state.current_player == "O":
        agent = TicTacToeAgent()
        result = agent.get_best_move(state)
        steps_to_stream = result.steps
        best_move = result.best_move
    if steps_to_stream:
        agent = TicTacToeAgent()
        await agent.stream_steps(websocket, steps_to_stream, delay_ms=500)
        await websocket.send_json({"type": "done", "best_move": best_move, "total_steps": len(steps_to_stream)})
    else:
        await websocket.send_json({"type": "done", "best_move": None, "total_steps": 0})
    await websocket.close()


# ==================== EIGHT PUZZLE ====================
@router.post("/eightpuzzle/new", response_model=NewEightPuzzleResponse)
async def create_new_eightpuzzle():
    session_id = str(uuid.uuid4())
    state = EightPuzzleState.initial()
    result = astar(state)
    sessions[session_id] = {
        "game": "eightpuzzle",
        "state": state,
        "move_count": 0,
        "optimal_moves": result.optimal_length,
        "ai_steps": result.steps
    }
    return NewEightPuzzleResponse(
        session_id=session_id,
        board=list(state.board),
        optimal_moves=result.optimal_length,
        blank_pos=state.board.index(0)
    )

@router.post("/eightpuzzle/move", response_model=MoveEightPuzzleResponse)
async def make_move_eightpuzzle(req: MoveEightPuzzleRequest):
    session = sessions.get(req.session_id)
    if not session or session.get("game") != "eightpuzzle":
        raise HTTPException(status_code=404, detail="Session not found")
    state: EightPuzzleState = session["state"]
    blank_idx = state.board.index(0)
    target_idx = req.tile_pos
    row_b, col_b = divmod(blank_idx, 3)
    row_t, col_t = divmod(target_idx, 3)
    if abs(row_b - row_t) + abs(col_b - col_t) != 1:
        raise HTTPException(status_code=400, detail="Tile is not adjacent to blank")
    new_board = list(state.board)
    new_board[blank_idx], new_board[target_idx] = new_board[target_idx], new_board[blank_idx]
    new_state = EightPuzzleState(tuple(new_board))
    session["state"] = new_state
    session["move_count"] += 1
    is_solved = list(new_state.board) == GOAL_STATE
    return MoveEightPuzzleResponse(
        board=list(new_state.board),
        blank_pos=target_idx,
        move_count=session["move_count"],
        is_solved=is_solved,
        optimal_moves=session["optimal_moves"]
    )

@router.websocket("/ws/eightpuzzle/{session_id}")
async def websocket_eightpuzzle(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session or session.get("game") != "eightpuzzle":
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return
    steps_to_stream = session.get("ai_steps", [])
    if steps_to_stream:
        agent = SearchAgent()
        await agent.stream_steps(websocket, steps_to_stream, delay_ms=200)
    await websocket.send_json({"type": "done", "best_move": None, "total_steps": len(steps_to_stream)})
    await websocket.close()


# ==================== EIGHTPUZZLE TEACHING ====================
@router.post("/eightpuzzle/best-moves")
async def get_eightpuzzle_best_moves(req: dict):
    session_id = req.get("session_id")
    session = sessions.get(session_id)
    if not session or session.get("game") != "eightpuzzle":
        raise HTTPException(status_code=404, detail="Session not found")
    
    current_state = session.get("state")
    if not current_state:
        raise HTTPException(status_code=400, detail="Invalid game state")
    
    best_moves = get_best_moves(current_state, tuple(GOAL_STATE))
    return {"best_moves": best_moves}


@router.post("/eightpuzzle/rate-move")
async def rate_eightpuzzle_move(req: dict):
    session_id = req.get("session_id")
    user_board = req.get("board", [])
    session = sessions.get(session_id)
    if not session or session.get("game") != "eightpuzzle":
        raise HTTPException(status_code=404, detail="Session not found")
    
    current_state = session.get("state")
    if not current_state:
        raise HTTPException(status_code=400, detail="Invalid game state")
    
    feedback = rate_user_move(current_state, user_board)
    return feedback


# ==================== MISSIONARIES ====================
@router.post("/missionaries/new", response_model=NewMissionariesResponse)
async def create_new_missionaries():
    session_id = str(uuid.uuid4())
    state = MissionariesState.initial()
    result = bfs(state)
    optimal_moves = len(result.path) - 1 if result.path else 0
    sessions[session_id] = {
        "game": "missionaries",
        "state": state,
        "move_count": 0,
        "optimal_moves": optimal_moves,
        "ai_steps": result.steps
    }
    state_model = MissionariesStateModel(m_left=state.m_left, c_left=state.c_left, boat_side=state.boat_side)
    return NewMissionariesResponse(
        session_id=session_id,
        state=state_model,
        optimal_moves=optimal_moves
    )

@router.post("/missionaries/move", response_model=MoveMissionariesResponse)
async def make_move_missionaries(req: MoveMissionariesRequest):
    session = sessions.get(req.session_id)
    if not session or session.get("game") != "missionaries":
        raise HTTPException(status_code=404, detail="Session not found")
    state: MissionariesState = session["state"]
    m = req.missionaries
    c = req.cannibals
    valid_actions = state.get_valid_actions()
    if (m, c) not in valid_actions:
        raise HTTPException(status_code=422, detail="Invalid move. Cannot move these quantities.")
    new_state = state.apply_action(m, c)
    if not new_state.is_valid():
        raise HTTPException(status_code=422, detail="Invalid move. Cannibals eat missionaries.")
    session["state"] = new_state
    session["move_count"] += 1
    state_model = MissionariesStateModel(m_left=new_state.m_left, c_left=new_state.c_left, boat_side=new_state.boat_side)
    return MoveMissionariesResponse(
        state=state_model,
        is_solved=new_state.is_goal(),
        move_count=session["move_count"]
    )

@router.websocket("/ws/missionaries/{session_id}")
async def websocket_missionaries(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session or session.get("game") != "missionaries":
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return
    steps_to_stream = session.get("ai_steps", [])
    if steps_to_stream:
        agent = SearchAgent()
        await agent.stream_steps(websocket, steps_to_stream, delay_ms=200)
    await websocket.send_json({"type": "done", "best_move": None, "total_steps": len(steps_to_stream)})
    await websocket.close()


# ==================== N-QUEENS ====================
@router.post("/nqueens/new", response_model=NQueensNewResponse)
async def create_new_nqueens(req: NQueensNewRequest):
    session_id = str(uuid.uuid4())
    n = req.n
    state = NQueensState.initial(n)

    # Pre-solve for AI stream
    result = solve_nqueens(n)

    sessions[session_id] = {
        "game": "nqueens",
        "state": state,
        "n": n,
        "ai_steps": result.steps,
        "ai_solution": result.solution,
    }

    return NQueensNewResponse(
        session_id=session_id,
        board=state.board,
        n=n
    )

@router.post("/nqueens/move", response_model=NQueensMoveResponse)
async def make_move_nqueens(req: NQueensMoveRequest):
    session = sessions.get(req.session_id)
    if not session or session.get("game") != "nqueens":
        raise HTTPException(status_code=404, detail="Session not found")
    state: NQueensState = session["state"]
    n = state.n
    row, col = req.row, req.col

    if row < 0 or row >= n or col < 0 or col >= n:
        raise HTTPException(status_code=400, detail="Row or column out of bounds")
    if not is_safe(state.board, row, col):
        raise HTTPException(status_code=422, detail="Not safe: queen would be under attack")

    state.board[row] = col
    conflicts = get_conflicts(state.board)
    domains = get_domains(state.board, n)
    placed_count = sum(1 for c in state.board if c != -1)
    is_solved = placed_count == n and len(conflicts) == 0

    return NQueensMoveResponse(
        board=state.board,
        conflicts=[[r1, r2] for r1, r2 in conflicts],
        domains={str(k): v for k, v in domains.items()},
        is_solved=is_solved,
    )

@router.websocket("/ws/nqueens/{session_id}")
async def websocket_nqueens(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session or session.get("game") != "nqueens":
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return
    steps_to_stream = session.get("ai_steps", [])
    if steps_to_stream:
        agent = CSPAgent()
        await agent.stream_steps(websocket, steps_to_stream, delay_ms=200)
    await websocket.send_json({"type": "done", "best_move": None, "total_steps": len(steps_to_stream)})
    await websocket.close()


# ==================== CRYPTARITHMETIC ====================
@router.post("/cryptarith/new", response_model=CryptarithNewResponse)
async def create_new_cryptarith(req: CryptarithNewRequest):
    session_id = str(uuid.uuid4())
    equation = req.equation.upper()

    # Parse to get letters and leading letters
    parts = equation.replace("=", "+").split("+")
    words_list = [p.strip() for p in parts]
    if len(words_list) != 3:
        raise HTTPException(status_code=400, detail="Equation must have format: WORD1 + WORD2 = RESULT")

    # parse_puzzle returns (words, unique_letters_list, leading_letters_set)
    _, letters_list, leading_set = parse_puzzle(words_list[0], words_list[1], words_list[2])

    # Build initial domains
    domains: dict[str, list[int]] = {}
    for letter in letters_list:
        if letter in leading_set:
            domains[letter] = list(range(1, 10))
        else:
            domains[letter] = list(range(0, 10))

    # Pre-solve for AI stream
    result = solve_to_stepdicts(equation)

    sessions[session_id] = {
        "game": "cryptarith",
        "equation": equation,
        "letters": letters_list,
        "leading": list(leading_set),
        "assignment": {},
        "ai_steps": result.steps,
        "ai_solution": result.solution,
    }

    return CryptarithNewResponse(
        session_id=session_id,
        equation=equation,
        letters=letters_list,
        leading_letters=list(leading_set),
        domains=domains
    )

@router.post("/cryptarith/assign")
async def assign_cryptarith(req: CryptarithAssignRequest):
    session = sessions.get(req.session_id)
    if not session or session.get("game") != "cryptarith":
        raise HTTPException(status_code=404, detail="Session not found")

    assignment: dict[str, int] = session["assignment"]
    letter = req.letter.upper()
    digit = req.digit

    # Check if digit already assigned to another letter
    for existing_letter, existing_digit in assignment.items():
        if existing_digit == digit and existing_letter != letter:
            raise HTTPException(
                status_code=422,
                detail=f"Digit {digit} is already assigned to letter '{existing_letter}'"
            )

    assignment[letter] = digit

    # Check if solved
    ai_solution = session.get("ai_solution", {})
    is_solved = len(assignment) == len(session["letters"]) and all(
        assignment.get(l) == ai_solution.get(l) for l in session["letters"]
    )

    # Check for contradiction: if all letters assigned but not solved
    is_contradiction = len(assignment) == len(session["letters"]) and not is_solved

    return {
        "assignment": assignment,
        "is_solved": is_solved,
        "is_contradiction": is_contradiction,
    }


@router.post("/cryptarith/solve", response_model=CryptarithSolveResponse)
async def solve_cryptarith_puzzle(req: CryptarithSolveRequest):
    """Solve a cryptarithmetic puzzle with configurable mode and MRV toggle."""
    try:
        result = solve_cryptarithm(
            word1=req.word1.upper(),
            word2=req.word2.upper(),
            result_word=req.result.upper(),
            mode=req.mode,
            use_mrv=req.use_mrv,
        )
        return CryptarithSolveResponse(
            solution=result.solution,
            steps=result.steps,
            metrics={
                "nodes_explored": result.metrics.nodes_explored,
                "backtracks": result.metrics.backtracks,
                "nodes_pruned": result.metrics.nodes_pruned,
                "max_depth": result.metrics.max_depth,
                "time_ms": result.metrics.time_ms,
                "mode": result.metrics.mode,
            },
            is_solvable=result.is_solvable,
            error=result.error,
        )
    except Exception as e:
        return CryptarithSolveResponse(
            solution=None,
            steps=[],
            metrics={"nodes_explored": 0, "backtracks": 0, "nodes_pruned": 0, "max_depth": 0, "time_ms": 0, "mode": req.mode},
            is_solvable=False,
            error=str(e),
        )


@router.post("/cryptarith/validate", response_model=CryptarithValidateResponse)
async def validate_cryptarith_puzzle(req: CryptarithValidateRequest):
    """Validate if a custom puzzle is solvable."""
    try:
        words, unique_letters, leading = parse_puzzle(req.word1.upper(), req.word2.upper(), req.result.upper())
        result = solve_cryptarithm(
            word1=req.word1.upper(),
            word2=req.word2.upper(),
            result_word=req.result.upper(),
            mode="full_csp",
            use_mrv=True,
            max_trace=0,
        )
        return CryptarithValidateResponse(
            is_valid=True,
            is_solvable=result.is_solvable,
            unique_letters=len(unique_letters),
            solution=result.solution,
        )
    except ValueError as e:
        return CryptarithValidateResponse(
            is_valid=False,
            is_solvable=False,
            error=str(e),
        )


@router.websocket("/ws/cryptarith/{session_id}")
async def websocket_cryptarith(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = sessions.get(session_id)
    if not session or session.get("game") != "cryptarith":
        await websocket.send_json({"type": "error", "message": "Session not found"})
        await websocket.close()
        return
    steps_to_stream = session.get("ai_steps", [])
    if steps_to_stream:
        agent = CSPAgent()
        await agent.stream_steps(websocket, steps_to_stream, delay_ms=200)
    await websocket.send_json({"type": "done", "best_move": None, "total_steps": len(steps_to_stream)})
    await websocket.close()
