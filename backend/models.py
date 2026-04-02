from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Float, Boolean, DateTime
from datetime import datetime, timezone
import uuid

class Base(DeclarativeBase):
    pass

class GameSession(Base):
    __tablename__ = "game_sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True,
        default=lambda: str(uuid.uuid4()))
    game: Mapped[str] = mapped_column(String)
    difficulty: Mapped[int] = mapped_column(Integer, default=5)
    mode: Mapped[str] = mapped_column(String, default="pvai")
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime,
        default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True)

class Score(Base):
    __tablename__ = "scores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True,
        autoincrement=True)
    session_id: Mapped[str] = mapped_column(String)
    player_name: Mapped[str] = mapped_column(String, default="Player")
    game: Mapped[str] = mapped_column(String)
    stars: Mapped[int] = mapped_column(Integer)
    score: Mapped[float] = mapped_column(Float)
    moves_used: Mapped[int] = mapped_column(Integer, default=0)
    optimal_moves: Mapped[int] = mapped_column(Integer, default=0)
    time_ms: Mapped[int] = mapped_column(Integer, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime,
        default=lambda: datetime.now(timezone.utc))
