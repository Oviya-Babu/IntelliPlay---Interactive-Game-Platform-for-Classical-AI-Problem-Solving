"""
backend/games/nqueens.py
N-Queens game state and utility functions.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class NQueensState:
    board: list[int]   # length N, -1=empty, 0..N-1=queen column
    n: int

    @classmethod
    def initial(cls, n: int = 8) -> "NQueensState":
        return cls(board=[-1] * n, n=n)


def is_safe(board: list[int], row: int, col: int) -> bool:
    """Check if placing a queen at (row, col) is safe given queens in rows 0..row-1."""
    for r in range(row):
        if board[r] == -1:
            continue
        if board[r] == col:
            return False
        if abs(board[r] - col) == abs(r - row):
            return False
    return True


def get_conflicts(board: list[int]) -> list[tuple[int, int]]:
    """Return all (row_a, row_b) pairs of queens currently attacking each other."""
    conflicts = []
    placed = [(r, c) for r, c in enumerate(board) if c != -1]
    for i in range(len(placed)):
        for j in range(i + 1, len(placed)):
            r1, c1 = placed[i]
            r2, c2 = placed[j]
            if c1 == c2 or abs(c1 - c2) == abs(r1 - r2):
                conflicts.append((r1, r2))
    return conflicts


def get_domains(board: list[int], n: int) -> dict[int, list[int]]:
    """For each unfilled row, return the list of still-safe columns."""
    domains: dict[int, list[int]] = {}
    for row in range(n):
        if board[row] != -1:
            continue
        safe_cols = [col for col in range(n) if is_safe(board, row, col)]
        domains[row] = safe_cols
    return domains
