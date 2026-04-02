from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.models import GameSession, Score

async def create_session(db: AsyncSession, game: str,
    difficulty: int, mode: str) -> GameSession:
    session = GameSession(game=game, difficulty=difficulty, mode=mode)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session(db: AsyncSession, 
    session_id: str) -> GameSession | None:
    result = await db.execute(
        select(GameSession).where(GameSession.id == session_id))
    return result.scalar_one_or_none()

async def complete_session(db: AsyncSession, session_id: str):
    from datetime import datetime, timezone
    session = await get_session(db, session_id)
    if session:
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        await db.commit()

async def save_score(db: AsyncSession, session_id: str,
    player_name: str, game: str, stars: int, score: float,
    moves_used: int, optimal_moves: int,
    time_ms: int, hints_used: int) -> Score:
    s = Score(session_id=session_id, player_name=player_name,
              game=game, stars=stars, score=score,
              moves_used=moves_used, optimal_moves=optimal_moves,
              time_ms=time_ms, hints_used=hints_used)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s

async def get_leaderboard(db: AsyncSession, game: str,
    limit: int = 10) -> list[Score]:
    result = await db.execute(
        select(Score)
        .where(Score.game == game)
        .order_by(desc(Score.score))
        .limit(limit))
    return list(result.scalars().all())

async def get_all_scores(db: AsyncSession) -> list[Score]:
    result = await db.execute(
        select(Score).order_by(desc(Score.created_at)).limit(100))
    return list(result.scalars().all())
