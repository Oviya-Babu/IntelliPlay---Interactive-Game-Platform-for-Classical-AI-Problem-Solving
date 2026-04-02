"""
backend/games/tictactoe.py
TicTacToe game state representation.
"""
from __future__ import annotations
from dataclasses import dataclass

WIN_LINES = [
    (0, 1, 2), (3, 4, 5), (6, 7, 8),  # rows
    (0, 3, 6), (1, 4, 7), (2, 5, 8),  # cols
    (0, 4, 8), (2, 4, 6),             # diags
]

@dataclass(frozen=True)
class TicTacToeState:
    board: list[str]  # length 9; '' | 'X' | 'O'
    current_player: str

    @classmethod
    def initial(cls, first_player: str = "X") -> "TicTacToeState":
        return cls(board=[""] * 9, current_player=first_player)

    def legal_moves(self) -> list[int]:
        if self.is_terminal():
            return []
        return [i for i, cell in enumerate(self.board) if cell == ""]

    def apply_move(self, pos: int) -> "TicTacToeState":
        if self.board[pos] != "":
            raise ValueError(f"Cell {pos} is already occupied.")
        new_board = list(self.board)
        new_board[pos] = self.current_player
        next_player = "O" if self.current_player == "X" else "X"
        return TicTacToeState(board=new_board, current_player=next_player)

    def winner(self) -> str | None:
        """Returns 'X', 'O', 'draw', or None."""
        for a, b, c in WIN_LINES:
            if self.board[a] and self.board[a] == self.board[b] == self.board[c]:
                return self.board[a]
        if all(cell != "" for cell in self.board):
            return "draw"
        return None

    def is_terminal(self) -> bool:
        return self.winner() is not None
