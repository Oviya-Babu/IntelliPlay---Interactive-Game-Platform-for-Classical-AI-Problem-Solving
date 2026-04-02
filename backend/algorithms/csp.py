"""
backend/algorithms/csp.py
CSP Backtracking + Forward Checking for N-Queens.
"""
from dataclasses import dataclass
from typing import Any
from backend.games.nqueens import NQueensState, is_safe, get_domains


@dataclass
class CSPResult:
    solution: list[int]
    steps: list[dict[str, Any]]
    backtracks: int
    assignments_tried: int


def solve_nqueens(n: int = 8) -> CSPResult:
    """Solve N-Queens using backtracking with forward checking."""
    steps: list[dict[str, Any]] = []
    board = [-1] * n
    backtracks = [0]
    assignments_tried = [0]

    def forward_check(board: list[int], placed_row: int) -> dict[int, list[int]]:
        """After placing queen at placed_row, compute remaining domains."""
        domains: dict[int, list[int]] = {}
        for row in range(n):
            if board[row] != -1:
                continue
            safe_cols = [col for col in range(n) if is_safe(board, row, col)]
            domains[row] = safe_cols
        return domains

    def backtrack(row: int) -> bool:
        if row == n:
            return True

        domains = forward_check(board, row)
        available = domains.get(row, list(range(n)))
        # Filter to actually safe columns
        available = [col for col in available if is_safe(board, row, col)]

        for col in available:
            board[row] = col
            assignments_tried[0] += 1

            # Forward check after placement
            future_domains = forward_check(board, row)
            eliminated = 0
            next_row_remaining = 0
            for fr, fcols in future_domains.items():
                if fr > row:
                    original_count = n  # approximate
                    eliminated += max(0, original_count - len(fcols))
                    if fr == row + 1:
                        next_row_remaining = len(fcols)

            steps.append({
                "step_id": len(steps),
                "algorithm": "csp_backtracking",
                "action": "Assign",
                "state": {"board": list(board), "domains": {str(k): v for k, v in future_domains.items()}},
                "score": None,
                "depth": row,
                "pruned": False,
                "best_so_far": None,
                "explanation": (
                    f"Placing queen at row {row}, column {col}. Now for the clever part — forward checking! I'm scanning all future rows and eliminating columns that this queen attacks diagonally and vertically. Row {row+1} just lost some options. Fewer choices = less backtracking later. This is constraint propagation doing its magic!"
                ),
            })

            # Check if any future domain is empty -> must backtrack
            wipeout = any(len(fcols) == 0 for fr, fcols in future_domains.items() if fr > row)

            if wipeout:
                steps.append({
                    "step_id": len(steps),
                    "algorithm": "csp_backtracking",
                    "action": "Backtrack",
                    "state": {"board": list(board), "domains": {str(k): v for k, v in future_domains.items()}},
                    "score": None,
                    "depth": row,
                    "pruned": True,
                    "best_so_far": None,
                    "explanation": (
                        f"Dead end! Row {row + 1} has NO safe columns after all the forward checking eliminated everything. Time to backtrack — I'm removing the queen from row {row} column {col} and trying the next option. This is exactly how you'd solve Sudoku by hand. Backtracks so far: {backtracks[0] + 1}. Every backtrack teaches me something about this puzzle's structure!"
                    ),
                })
                board[row] = -1
                backtracks[0] += 1
                continue

            if backtrack(row + 1):
                return True

            # Backtrack
            steps.append({
                "step_id": len(steps),
                "algorithm": "csp_backtracking",
                "action": "Backtrack",
                "state": {"board": list(board), "domains": {}},
                "score": None,
                "depth": row,
                "pruned": True,
                "best_so_far": None,
                "explanation": (
                    f"Tracking back further! Deeper search hit a dead end, so I'm removing the queen from row {row} "
                    f"and trying the next column. Gotta be systematic! Backtracks so far: {backtracks[0] + 1}"
                ),
            })
            board[row] = -1
            backtracks[0] += 1

        return False

    backtrack(0)

    steps.append({
        "step_id": len(steps),
        "algorithm": "csp_backtracking",
        "action": "Solution",
        "state": {"board": list(board), "domains": {}},
        "score": None,
        "depth": n,
        "pruned": False,
        "best_so_far": None,
        "explanation": f"SOLVED! All {n} queens placed with zero conflicts! It took {backtracks[0]} backtracks and {assignments_tried[0]} attempts to find this arrangement. Fun fact: for 8 queens, there are exactly 92 valid solutions out of 4,426,165,368 possible arrangements. You just watched me find one!"
    })

    return CSPResult(
        solution=list(board),
        steps=steps,
        backtracks=backtracks[0],
        assignments_tried=assignments_tried[0],
    )
