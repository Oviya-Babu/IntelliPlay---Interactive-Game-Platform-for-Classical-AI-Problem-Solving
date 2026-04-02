from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas.score import ScoreCreate, ScoreResponse, LeaderboardEntry
from backend.crud import save_score, get_leaderboard

router = APIRouter()

@router.post("/scores", response_model=ScoreResponse)
async def post_score(body: ScoreCreate,
    db: AsyncSession = Depends(get_db)):
    score = await save_score(db, **body.model_dump())
    leaderboard = await get_leaderboard(db, body.game)
    rank = next((i+1 for i, s in enumerate(leaderboard)
                 if s.id == score.id), None)
    result = ScoreResponse.model_validate(score)
    result.rank = rank
    return result

@router.get("/leaderboard/{game}")
async def get_game_leaderboard(game: str, limit: int = 10,
    db: AsyncSession = Depends(get_db)):
    scores = await get_leaderboard(db, game, limit)
    return [
        LeaderboardEntry(
            rank=i+1,
            player_name=s.player_name,
            game=s.game,
            stars=s.stars,
            score=s.score,
            moves_used=s.moves_used,
            optimal_moves=s.optimal_moves,
            time_ms=s.time_ms,
            created_at=s.created_at,
        )
        for i, s in enumerate(scores)
    ]
