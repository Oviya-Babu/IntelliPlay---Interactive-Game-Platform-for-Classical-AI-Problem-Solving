"""
backend/games/eight_puzzle.py
8-Puzzle game state representation.
"""
from __future__ import annotations
from dataclasses import dataclass
import random

GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]

@dataclass(frozen=True)
class EightPuzzleState:
    board: tuple[int, ...]  # using tuple so it's hashable for sets

    @classmethod
    def initial(cls) -> "EightPuzzleState":
        # Generate random solvable board
        while True:
            board = list(range(9))
            random.shuffle(board)
            state = cls(board=tuple(board))
            if state.is_solvable() and state.board != tuple(GOAL_STATE):
                return state

    def is_solvable(self) -> bool:
        """Check if board is solvable using inversion count parity.
           Goal has 0 inversions (even), so solvable boards must have even inversions.
        """
        inversions = 0
        tiles = [t for t in self.board if t != 0]
        for i in range(len(tiles)):
            for j in range(i + 1, len(tiles)):
                if tiles[i] > tiles[j]:
                    inversions += 1
        return inversions % 2 == 0

    def get_neighbors(self) -> list[tuple["EightPuzzleState", str]]:
        blank_idx = self.board.index(0)
        row, col = divmod(blank_idx, 3)
        neighbors = []
        
        # Move blank up -> tile down
        if row > 0:
            new_board = list(self.board)
            new_board[blank_idx], new_board[blank_idx - 3] = new_board[blank_idx - 3], new_board[blank_idx]
            neighbors.append((EightPuzzleState(tuple(new_board)), "down")) # Tile moved down
            
        # Move blank down -> tile up
        if row < 2:
            new_board = list(self.board)
            new_board[blank_idx], new_board[blank_idx + 3] = new_board[blank_idx + 3], new_board[blank_idx]
            neighbors.append((EightPuzzleState(tuple(new_board)), "up")) # Tile moved up
            
        # Move blank left -> tile right
        if col > 0:
            new_board = list(self.board)
            new_board[blank_idx], new_board[blank_idx - 1] = new_board[blank_idx - 1], new_board[blank_idx]
            neighbors.append((EightPuzzleState(tuple(new_board)), "right")) # Tile moved right
            
        # Move blank right -> tile left
        if col < 2:
            new_board = list(self.board)
            new_board[blank_idx], new_board[blank_idx + 1] = new_board[blank_idx + 1], new_board[blank_idx]
            neighbors.append((EightPuzzleState(tuple(new_board)), "left")) # Tile moved left
            
        return neighbors

    def manhattan_distance(self, goal: tuple[int, ...] = tuple(GOAL_STATE)) -> int:
        distance = 0
        for i, val in enumerate(self.board):
            if val == 0:
                continue
            goal_idx = goal.index(val)
            curr_row, curr_col = divmod(i, 3)
            goal_row, goal_col = divmod(goal_idx, 3)
            distance += abs(curr_row - goal_row) + abs(curr_col - goal_col)
        return distance
