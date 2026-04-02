from fastapi import APIRouter
from pydantic import BaseModel
import os
import google.generativeai as genai

router = APIRouter()

class ChatRequest(BaseModel):
    game_id: str
    session_id: str
    question: str
    current_explanation: str = ""
    board_state: str = ""

class ChatResponse(BaseModel):
    answer: str
    agent_name: str

AGENT_NAMES = {
  "tictactoe": "AlphaBot",
  "eightpuzzle": "AStarley",
  "missionaries": "BFSean",
  "nqueens": "Cassandra",
  "cryptarith": "CipherX",
}

ALGORITHM_CONTEXT = {
  "tictactoe": "Minimax with Alpha-Beta Pruning for TicTacToe",
  "eightpuzzle": "A* Search with Manhattan distance heuristic for 8-Puzzle",
  "missionaries": "Breadth-First Search for Missionaries and Cannibals",
  "nqueens": "CSP Backtracking with Forward Checking for N-Queens",
  "cryptarith": "Constraint Propagation CSP for Cryptarithmetic",
}

def rule_based_answer(question: str, game_id: str, 
                       explanation: str) -> str:
    q = question.lower()
    agent = AGENT_NAMES.get(game_id, "AI")
    algo = ALGORITHM_CONTEXT.get(game_id, "this algorithm")
    
    if any(w in q for w in ["why", "reason", "explain"]):
        return (explanation if explanation 
                else f"I'm using {algo}. Ask me after I make a move!")
    
    if "minimax" in q:
        return ("Minimax is a search algorithm that looks ahead at all "
                "possible future moves, assuming both players play "
                "perfectly. It maximizes my score while minimizing yours!")
    
    if "alpha" in q or "beta" in q or "prune" in q:
        return ("Alpha-beta pruning skips branches I know can't improve "
                "my best move. Like stopping reading a menu when you "
                "already found something better than everything left!")
    
    if "what if" in q or "if i" in q:
        return ("Try it! Make that move and watch what I do. "
                "I'll narrate my entire thought process in real-time. "
                "The best way to learn is to experiment!")
    
    if any(w in q for w in ["best", "optimal", "winning"]):
        return (f"I always play optimally using {algo}. "
                "Every move I make is the mathematically best response "
                "to any situation. Can you find the one move that "
                "gives you the best chance?")
    
    if any(w in q for w in ["how", "work", "does"]):
        return (f"I use {algo}. Watch my explanation panel on the right "
                "— I narrate every step of my thinking as it happens!")
    
    return (f"Great question! I'm {agent}, your AI tutor for {algo}. "
            "Watch my thinking panel as I play — I explain every "
            "decision in plain English. Ask me anything specific!")

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    agent_name = AGENT_NAMES.get(body.game_id, "AI Tutor")

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            f"You are {agent_name}, an enthusiastic AI tutor teaching "
            f"{ALGORITHM_CONTEXT.get(body.game_id, 'classical AI')}. "
            f"Current board state: {body.board_state}. "
            f"Last explanation: {body.current_explanation}. "
            "Respond in exactly 2-3 sentences. Be specific, engaging, "
            "and use simple analogies. Never be generic. "
            "Reference actual values from the current game state when possible.\n"
            f"Question: {body.question}"
        )
        response = model.generate_content(prompt)
        answer = (response.text or "").strip()
        if not answer:
            raise ValueError("Empty Gemini response")
    except Exception:
        # Fallback: rule-based (works without API key)
        answer = rule_based_answer(
            body.question, body.game_id, body.current_explanation
        )
    
    return ChatResponse(answer=answer, agent_name=agent_name)
