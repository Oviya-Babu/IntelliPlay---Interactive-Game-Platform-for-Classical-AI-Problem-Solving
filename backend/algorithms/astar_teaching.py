"""
backend/algorithms/astar_teaching.py
Best move computation for teaching 8-Puzzle interactively.
"""
from typing import Any
from backend.games.eight_puzzle import EightPuzzleState, GOAL_STATE


def get_best_moves(current: EightPuzzleState, goal_state: tuple[int, ...] = tuple(GOAL_STATE)) -> list[dict[str, Any]]:
    """Generate all valid moves sorted by A* heuristic (best first).
    
    Returns list of moves with f=g+h scores.
    Used for teaching the user the optimal next moves.
    """
    best_moves = []
    
    # Get all valid neighbors from current state
    for neighbor_state, direction in current.get_neighbors():
        g = 1  # One move away
        h = neighbor_state.manhattan_distance(goal_state)  # Heuristic to goal
        f = g + h  # Total estimated cost
        
        # Find which tile was moved
        blank_new = neighbor_state.board.index(0)
        moved_tile = current.board[blank_new]
        
        best_moves.append({
            "board": list(neighbor_state.board),
            "moved_tile": moved_tile,
            "direction": direction,
            "g": g,
            "h": h,
            "f": f,
            "explanation": f"Move tile {moved_tile} {direction}. This puts us {h} moves away from goal."
        })
    
    # Sort by f (best first)
    best_moves.sort(key=lambda x: x["f"])
    return best_moves


def rate_user_move(current: EightPuzzleState, user_board: list[int], goal_state: tuple[int, ...] = tuple(GOAL_STATE)) -> dict[str, Any]:
    """Rate a user's move against the optimal move.
    
    Returns feedback on whether the move is optimal, good, or suboptimal.
    """
    best_moves = get_best_moves(current, goal_state)
    
    if not best_moves:
        return {"quality": "invalid", "feedback": "No valid moves available"}
    
    # Check if user's board matches any best move
    best_board = best_moves[0]["board"]  # First is best
    user_board_tuple = tuple(user_board)
    best_boards_tuples = [tuple(m["board"]) for m in best_moves]
    
    if user_board_tuple == tuple(best_board):
        # Optimal move
        return {
            "quality": "optimal",
            "feedback": f"✅ Perfect! This is the optimal move (f={best_moves[0]['f']}).",
            "best_move": best_moves[0]
        }
    elif user_board_tuple in best_boards_tuples:
        # Good move but not best
        idx = best_boards_tuples.index(user_board_tuple)
        moved_tile = best_moves[idx]["moved_tile"]
        return {
            "quality": "good",
            "feedback": f"👍 Good move! Moving tile {moved_tile} is reasonable, but not optimal. Best move is: {best_moves[0]['explanation']}",
            "best_move": best_moves[0]
        }
    else:
        # Suboptimal move
        return {
            "quality": "suboptimal",
            "feedback": f"⚠️ This move may take longer to solve. Suggestion: {best_moves[0]['explanation']}",
            "best_move": best_moves[0]
        }
