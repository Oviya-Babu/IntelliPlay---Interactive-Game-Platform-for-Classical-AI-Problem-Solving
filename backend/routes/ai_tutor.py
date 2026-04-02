import os

from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter()

class ExplainRequest(BaseModel):
    boardState: list
    move: int
    level: int

def generate_explanation(game: str, move: int, context: dict) -> str:
    prompt = (
        f"Explain in simple terms why this move is good in {game}.\n"
        f"Move: {move}.\n"
        "Keep it short and beginner-friendly."
    )
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = (response.text or "").strip()
        if text:
            return text
        raise ValueError("Empty Gemini response")
    except Exception:
        if move == 4:
            return "I picked the center because it gives the most chances to create a winning line."
        if move in (0, 2, 6, 8):
            return "I picked a corner because corners can help create two threats at once."
        return "I picked this move to improve my position while blocking your best options."

@router.post("/ai/explain")
async def explain_move(req: ExplainRequest):
    explanation = generate_explanation(
        game="TicTacToe",
        move=req.move,
        context={"boardState": req.boardState, "level": req.level},
    )
    return {"explanation": explanation}
