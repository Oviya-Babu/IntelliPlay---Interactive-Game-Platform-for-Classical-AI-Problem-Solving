"""
backend/algorithms/minimax.py
Pure minimax implementation.
"""
from dataclasses import dataclass
from typing import Any
from backend.games.tictactoe import TicTacToeState

SCORES = {"X": 10, "O": -10, "draw": 0}

@dataclass
class MinimaxResult:
    best_move: int | None
    score: int
    nodes_evaluated: int
    steps: list[dict[str, Any]]

def minimax(
    state: TicTacToeState,
    depth: int = 0,
    is_max: bool = True,
    nodes_counter: list[int] | None = None,
    steps: list[dict[str, Any]] | None = None,
    current_move: int | None = None,
) -> MinimaxResult:
    if nodes_counter is None:
        nodes_counter = [0]
    if steps is None:
        steps = []
        
    nodes_counter[0] += 1
    winner = state.winner()
    
    if winner is not None:
        raw = SCORES.get(winner, 0)
        adjusted = raw - depth if raw > 0 else (raw + depth if raw < 0 else 0)
        steps.append({
            "step_id": len(steps),
            "algorithm": "minimax",
            "action": "Terminal",
            "state": {"board": state.board, "current_player": state.current_player},
            "score": adjusted,
            "depth": depth,
            "pruned": False,
            "best_so_far": current_move,
            "explanation": f"Hmm, a terminal state. The game evaluates to a score of {adjusted} here. That's one possibility fully explored!",
        })
        return MinimaxResult(best_move=None, score=adjusted, nodes_evaluated=nodes_counter[0], steps=steps)

    moves = state.legal_moves()
    best_move = None
    best_score = float("-inf") if is_max else float("inf")

    for move in moves:
        child = state.apply_move(move)
        
        steps.append({
            "step_id": len(steps),
            "algorithm": "minimax",
            "action": "Evaluating",
            "state": {"board": child.board, "current_player": child.current_player},
            "score": 0,
            "depth": depth,
            "pruned": False,
            "best_so_far": best_move,
            "explanation": f"Hmm, what if I play position {move}? Let me think ahead {depth} moves... I'm imagining every possible response. Without alpha-beta, I have to check literally every single branch!",
        })
        
        result = minimax(child, depth + 1, not is_max, nodes_counter, steps, move)
        
        if is_max:
            if result.score > best_score:
                best_score = result.score
                best_move = move
        else:
            if result.score < best_score:
                best_score = result.score
                best_move = move

    if depth == 0 and best_move is not None:
        steps.append({
            "step_id": len(steps),
            "algorithm": "minimax",
            "action": "Best",
            "state": {"board": state.board, "current_player": state.current_player},
            "score": int(best_score),
            "depth": depth,
            "pruned": False,
            "best_so_far": best_move,
            "explanation": f"Got it! Position {best_move} is my pick. After grinding through {nodes_counter[0]} possible futures, this move gives me the optimal result. Minimax never guesses!",
        })

    return MinimaxResult(
        best_move=best_move,
        score=int(best_score),
        nodes_evaluated=nodes_counter[0],
        steps=steps,
    )
