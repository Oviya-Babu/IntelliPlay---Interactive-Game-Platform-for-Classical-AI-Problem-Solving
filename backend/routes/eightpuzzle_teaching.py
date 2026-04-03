# New routes for 8-puzzle teaching
@router.post("/eightpuzzle/best-moves")
async def get_eightpuzzle_best_moves(req: dict):
    """Returns best next moves and their heuristic scores for teaching."""
    session_id = req.get("session_id")
    session = sessions.get(session_id)
    if not session or session.get("game") != "eightpuzzle":
        raise HTTPException(status_code=404, detail="Session not found")
    
    state: EightPuzzleState = session["state"]
    best_moves = get_best_moves(state)
    
    return {
        "best_moves": best_moves,
        "current_board": list(state.board),
        "current_h": state.manhattan_distance()
    }


@router.post("/eightpuzzle/rate-move")
async def rate_eightpuzzle_move(req: dict):
    """Rates a user's move against optimal moves."""
    session_id = req.get("session_id")
    user_board = req.get("board")
    
    session = sessions.get(session_id)
    if not session or session.get("game") != "eightpuzzle":
        raise HTTPException(status_code=404, detail="Session not found")
    
    state: EightPuzzleState = session["state"]
    feedback = rate_user_move(state, user_board)
    
    return feedback
