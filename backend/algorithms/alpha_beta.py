"""
backend/algorithms/alpha_beta.py
Alpha-beta pruning minimax implementation.
Must evaluate fewer nodes than pure minimax.
"""
from typing import Any
from backend.games.tictactoe import TicTacToeState
from backend.algorithms.minimax import MinimaxResult, SCORES

def alpha_beta(
    state: TicTacToeState,
    depth: int = 0,
    is_max: bool = True,
    alpha: float = float("-inf"),
    beta: float = float("inf"),
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
            "algorithm": "alpha_beta",
            "action": "Terminal",
            "state": {"board": state.board, "current_player": state.current_player},
            "score": adjusted,
            "depth": depth,
            "alpha": alpha,
            "beta": beta,
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
        
        pruned = False
        action_name = "Evaluating"
        if beta <= alpha:
            pruned = True
            action_name = "Pruning"
            
        steps.append({
            "step_id": len(steps),
            "algorithm": "alpha_beta",
            "action": action_name,
            "state": {"board": child.board, "current_player": child.current_player},
            "score": int(best_score) if best_score not in (float('inf'), float('-inf')) else 0,
            "depth": depth,
            "alpha": alpha if alpha != float("-inf") else -99,
            "beta": beta if beta != float("inf") else 99,
            "pruned": pruned,
            "best_so_far": best_move,
            "explanation": f"Okay, let's think this through! If I play position {move}, I need to imagine every move you could make after that — and every move I'd make after THAT. I'm {depth} levels deep right now. My best guaranteed score so far is {alpha}. Anything I find below that? Total waste of time to explore!",
        })
        
        if pruned:
            break
            
        result = alpha_beta(child, depth + 1, not is_max, alpha, beta, nodes_counter, steps, move)
        
        if is_max:
            if result.score > best_score:
                best_score = result.score
                best_move = move
            alpha = max(alpha, best_score)
        else:
            if result.score < best_score:
                best_score = result.score
                best_move = move
            beta = min(beta, best_score)
            
        if beta <= alpha:
            steps.append({
                "step_id": len(steps),
                "algorithm": "alpha_beta",
                "action": "Pruning",
                "state": {"board": state.board, "current_player": state.current_player},
                "score": int(best_score),
                "depth": depth,
                "alpha": alpha,
                "beta": beta,
                "pruned": True,
                "best_so_far": best_move,
                "explanation": f"SNIP! I just pruned this entire branch! Here's the cool part — I already found a move scoring {alpha} earlier. This branch just returned {best_score}, which means even in the BEST case it can't beat what I already have. So why look further? That's alpha-beta pruning — like a chess grandmaster who stops analyzing a losing position the moment they see it's hopeless. Saved a bunch of nodes just now!",
            })
            break

    if depth == 0 and best_move is not None:
        steps.append({
            "step_id": len(steps),
            "algorithm": "alpha_beta",
            "action": "Best",
            "state": {"board": state.board, "current_player": state.current_player},
            "score": int(best_score) if best_score not in (float('inf'), float('-inf')) else 0,
            "depth": depth,
            "alpha": alpha,
            "beta": beta,
            "pruned": False,
            "best_so_far": best_move,
            "explanation": f"Alright, my verdict is in! After crunching through {nodes_counter[0]} possible game states, position {best_move} is the optimal play. Here's why: it maximizes my chance of winning. Score: {best_score} (positive = I'm winning, negative = you're winning, 0 = perfectly balanced). You might beat me... but you'll have to be perfect!",
        })

    return MinimaxResult(
        best_move=best_move,
        score=int(best_score) if best_score not in (float('inf'), float('-inf')) else 0,
        nodes_evaluated=nodes_counter[0],
        steps=steps,
    )
