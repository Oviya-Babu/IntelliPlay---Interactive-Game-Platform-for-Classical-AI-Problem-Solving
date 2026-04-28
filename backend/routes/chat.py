"""
backend/routes/chat.py
AI Chatbot — powered by Groq (llama-3.3-70b-versatile) with rule-based fallback.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import random
import logging
import asyncio
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Groq client ONCE at startup
groq_client = None
try:
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key:
        groq_client = Groq(api_key=api_key)
        logger.info("[CHAT] Groq client initialized successfully")
    else:
        logger.warning("[CHAT] GROQ_API_KEY not found, will use fallback only")
except Exception as e:
    logger.warning(f"[CHAT] Failed to initialize Groq client: {str(e)}")
    groq_client = None

# Rate limiting: 1 request per 2 seconds per session
session_last_request: dict[str, float] = {}
RATE_LIMIT_SECONDS = 2


# ─── REQUEST / RESPONSE ──────────────────────────────────────

class ChatRequest(BaseModel):
    game_id: str
    session_id: str
    question: str
    current_explanation: str = ""
    board_state: str = ""


class ChatResponse(BaseModel):
    answer: str
    agent_name: str


# ─── AGENT PERSONAS ──────────────────────────────────────────

AGENT_NAMES = {
    "tictactoe":   "AlphaBot",
    "eightpuzzle": "AStarley",
    "missionaries":"BFSean",
    "nqueens":     "Cassandra",
    "cryptarith":  "CipherX",
}

AGENT_PERSONALITIES = {
    "tictactoe":   "You are AlphaBot, a confident and competitive AI tutor specialising in Minimax search and Alpha-Beta pruning for Tic-Tac-Toe. You speak with precision and reference game-tree depth, node counts, and alpha/beta values when relevant.",
    "eightpuzzle": "You are AStarley, a methodical and precise AI tutor specialising in A* heuristic search with Manhattan distance for the 8-Puzzle. You always reference g(n), h(n), f(n) values and tile positions when answering.",
    "missionaries":"You are BFSean, a systematic and thorough AI tutor specialising in Breadth-First Search for the Missionaries and Cannibals problem. You explain BFS level-by-level exploration and state validity constraints.",
    "nqueens":     "You are Cassandra, a logical AI tutor specialising in CSP Backtracking for N-Queens. You reference row/column constraints, pruning, and backtracking decisions in your answers.",
    "cryptarith":  "You are CipherX, a clever AI tutor specialising in Constraint Propagation CSP for Cryptarithmetic puzzles. You reference letter-to-digit assignments, domain reduction, and pruning ratios in your answers.",
}

ALGORITHM_CONTEXT = {
    "tictactoe":   "Minimax search with Alpha-Beta pruning for Tic-Tac-Toe",
    "eightpuzzle": "A* Search with Manhattan distance heuristic for 8-Puzzle",
    "missionaries":"Breadth-First Search for Missionaries and Cannibals",
    "nqueens":     "CSP Backtracking with Forward Checking for N-Queens",
    "cryptarith":  "Constraint Propagation CSP for Cryptarithmetic",
}


# ─── RULE-BASED FALLBACK ────────────────────────────────────

_OPENERS = [
    "Great question!",
    "Interesting!",
    "Let me break that down —",
    "Good thinking!",
    "Here's what's happening:",
]

def rule_based_answer(question: str, game_id: str, explanation: str, board_state: str) -> str:
    q = question.lower()
    agent = AGENT_NAMES.get(game_id, "AI")
    algo = ALGORITHM_CONTEXT.get(game_id, "this algorithm")
    opener = random.choice(_OPENERS)

    if any(w in q for w in ["why", "reason", "explain"]) and explanation:
        return f"{opener} {explanation[:300]}{'...' if len(explanation) > 300 else ''}"

    if "manhattan" in q or "heuristic" in q or "distance" in q:
        return (f"{opener} Manhattan distance counts the horizontal + vertical moves each tile needs "
                f"to reach its goal position, ignoring other tiles. It never overestimates, making "
                f"it an admissible heuristic — so A* always finds the optimal solution!")

    if "minimax" in q:
        return (f"{opener} Minimax builds a complete game tree and picks moves that maximise my score "
                f"while assuming you'll minimise it. It guarantees optimal play for both sides!")

    if "alpha" in q or "beta" in q or "prune" in q:
        return (f"{opener} Alpha-beta pruning skips branches whose scores can't possibly improve the "
                f"current best move. It's like not finishing a book once you know the ending can't beat "
                f"the one you've already read — same result, far less work!")

    if "backtrack" in q:
        return (f"{opener} Backtracking means undoing the last decision and trying the next option. "
                f"Like retracing your steps in a maze — systematic, exhaustive, and guaranteed to find "
                f"a solution if one exists!")

    if any(w in q for w in ["best", "optimal", "winning"]):
        return (f"{opener} My {algo} guarantees the mathematically optimal result for every position. "
                f"{'Current state: ' + board_state[:80] if board_state else 'Watch the explanation panel!'}")

    if any(w in q for w in ["how", "work", "does"]):
        return (f"{opener} I use {algo}. Every step is explained in the AI panel — "
                f"watch it update in real-time as the algorithm explores states!")

    return (f"{opener} I'm {agent}, your AI tutor for {algo}. "
            f"Ask me about specific moves, algorithm decisions, or what the numbers mean!")


# ─── MAIN CHAT ENDPOINT ──────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest) -> ChatResponse:
    agent_name = AGENT_NAMES.get(body.game_id, "AI Tutor")
    personality = AGENT_PERSONALITIES.get(body.game_id, "You are a helpful AI tutor.")
    algo_context = ALGORITHM_CONTEXT.get(body.game_id, "classical AI")

    # Rate limiting check
    now = time.time()
    last_time = session_last_request.get(body.session_id, 0)
    if now - last_time < RATE_LIMIT_SECONDS:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait 2 seconds.")
    session_last_request[body.session_id] = now

    answer = None

    # ── Try Groq (primary) ──
    try:
        if not groq_client:
            raise ValueError("Groq client not initialized")

        system_prompt = (
            f"{personality}\n\n"
            f"IMPORTANT RULES:\n"
            f"- YOU ARE TALKING ABOUT {body.game_id.upper()} GAME ONLY. NEVER CONFUSE WITH OTHER GAMES.\n"
            f"- Answer in exactly 2-3 sentences. Be specific and educational.\n"
            f"- ALWAYS reference actual values from the game state provided (numbers, tiles, positions, letters, assignments).\n"
            f"- NEVER give a generic answer. Tailor every response to this exact game state.\n"
            f"- NEVER REPEAT THE SAME ANSWER. Every response must be unique and different.\n"
            f"- Do not repeat yourself across answers. Vary your explanation style, wording, and structure.\n"
            f"- If the user asks 'why', explain the algorithmic reason with the specific values shown.\n"
            f"- If the user asks 'how', walk through the algorithm step with the current context.\n"
            f"- FOR CRYPTARITHMETIC: Talk about letters, digits, constraints, domain reduction, pruning.\n"
            f"- FOR 8-PUZZLE: Talk about tiles, Manhattan distance, f(n), g(n), h(n) values, moves.\n"
        )

        user_message = (
            f"Game: {algo_context}\n"
            f"Current game/board state: {body.board_state or 'not yet available'}\n"
            f"Last algorithm step explanation: {body.current_explanation[:300] if body.current_explanation else 'none yet'}\n"
            f"User question: {body.question}"
        )

        def call_groq():
            return groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_message},
                ],
                max_tokens=300,
                temperature=0.85,
                top_p=0.92,
                frequency_penalty=0.7,
                presence_penalty=0.6,
                timeout=8
            )
        
        loop = asyncio.get_running_loop()
        resp = await asyncio.wait_for(
            loop.run_in_executor(None, call_groq),
            timeout=10
        )
        answer = (resp.choices[0].message.content or "").strip()
        if not answer:
            raise ValueError("Empty Groq response")

        logger.info(f"[CHAT] Groq answered for {body.game_id}")

    except Exception as e:
        logger.warning(f"[CHAT] Groq failed ({type(e).__name__}: {str(e)[:120]}), using rule-based fallback")
        answer = None

    # ── Rule-based fallback ──
    if not answer:
        answer = rule_based_answer(
            body.question, body.game_id, body.current_explanation, body.board_state
        )

    return ChatResponse(answer=answer, agent_name=agent_name)