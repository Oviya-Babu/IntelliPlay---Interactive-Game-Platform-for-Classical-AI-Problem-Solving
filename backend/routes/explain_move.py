"""
POST /api/explain-move
Gemini-powered AI tutor explanation for TicTacToe moves.
"""

import os
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ─── Position labels ───
POS_NAMES = [
    "top-left", "top-center", "top-right",
    "middle-left", "center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
]


class ExplainMoveRequest(BaseModel):
    board_state: list[str]   # 9-element list: "X", "O", or ""
    move: int                # index 0-8
    player: str              # "X" or "O"


class ExplainMoveResponse(BaseModel):
    explanation: str


# ─── Fallback explanations ───
def _fallback(board: list[str], move: int, player: str) -> str:
    pos = POS_NAMES[move] if 0 <= move < 9 else "an edge"

    # Center
    if move == 4:
        return (
            f"I chose the {pos} because it connects to the most winning lines. "
            "The center is the strongest opening or response in TicTacToe."
        )

    # Corner
    if move in (0, 2, 6, 8):
        return (
            f"I placed my mark at the {pos} corner. "
            "Corners create opportunities for double-threats that are hard to block."
        )

    # Edge
    return (
        f"I picked the {pos} to strengthen my position "
        "while making sure your best paths stay blocked."
    )


# ─── Gemini call ───
def _ask_gemini(board: list[str], move: int, player: str) -> Optional[str]:
    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        pos = POS_NAMES[move] if 0 <= move < 9 else str(move)

        # Build a visual board string
        rows = []
        for r in range(3):
            row_cells = []
            for c in range(3):
                idx = r * 3 + c
                val = board[idx] if board[idx] else "·"
                if idx == move:
                    val = f"[{player}]"  # highlight the new move
                row_cells.append(val.center(3))
            rows.append(" | ".join(row_cells))
        board_visual = "\n".join(rows)

        prompt = (
            "You are AlphaBot, a friendly AI tutor explaining TicTacToe moves to beginners.\n\n"
            f"Current board:\n{board_visual}\n\n"
            f"I ({player}) just played at position '{pos}' (index {move}).\n\n"
            "Explain why this is a good move in exactly 2 short, conversational sentences. "
            "Keep it simple, beginner-friendly, and encouraging. "
            "Do NOT use technical jargon like 'minimax' or 'game tree'."
        )

        response = model.generate_content(prompt)
        text = (response.text or "").strip()
        if text and len(text) < 500:
            return text
        return None
    except Exception:
        return None


@router.post("/explain-move", response_model=ExplainMoveResponse)
async def explain_move(req: ExplainMoveRequest):
    """Generate a beginner-friendly explanation of a TicTacToe move."""
    # Try Gemini first
    gemini_result = _ask_gemini(req.board_state, req.move, req.player)
    if gemini_result:
        return ExplainMoveResponse(explanation=gemini_result)

    # Fallback
    return ExplainMoveResponse(
        explanation=_fallback(req.board_state, req.move, req.player)
    )
