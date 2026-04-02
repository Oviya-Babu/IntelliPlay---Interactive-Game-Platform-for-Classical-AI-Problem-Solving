from fastapi import APIRouter

router = APIRouter()


@router.get("/{game}")
async def get_leaderboard(game: str, limit: int = 10):
    return {"game": game, "entries": []}
