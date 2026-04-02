from pydantic import BaseModel, Field
from datetime import datetime

class ScoreCreate(BaseModel):
    session_id: str
    player_name: str = "Player"
    game: str
    stars: int = Field(ge=0, le=3)
    score: float
    moves_used: int = 0
    optimal_moves: int = 0
    time_ms: int = 0
    hints_used: int = 0

class ScoreResponse(BaseModel):
    id: int
    session_id: str
    player_name: str
    game: str
    stars: int
    score: float
    moves_used: int
    optimal_moves: int
    time_ms: int
    created_at: datetime
    rank: int | None = None
    model_config = {"from_attributes": True}

class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    game: str
    stars: int
    score: float
    moves_used: int
    optimal_moves: int
    time_ms: int
    created_at: datetime
    model_config = {"from_attributes": True}
