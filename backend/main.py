from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import engine, Base
from backend.routes import game, sessions
from backend.routes.scores import router as scores_router
from backend.routes.chat import router as chat_router
from backend.routes.ai_tutor import router as ai_tutor_router
from backend.routes.explain_move import router as explain_move_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="IntelliPlay API",
    description="Backend for the IntelliPlay AI educational game platform.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(game.router,        prefix="/api/games",       tags=["games"])
app.include_router(sessions.router,    prefix="/api/sessions",    tags=["sessions"])
app.include_router(scores_router,      prefix="/api",             tags=["scores", "leaderboard"])
app.include_router(chat_router,        prefix="/api",             tags=["chat"])
app.include_router(ai_tutor_router,     prefix="/api",             tags=["ai_tutor"])
app.include_router(explain_move_router,  prefix="/api",             tags=["explain_move"])

# WebSocket routes live under /ws — include directly with no prefix
# (the ws routes are already defined with /ws/... path in game.py)
app.include_router(game.router, prefix="", tags=["websocket"], include_in_schema=False)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
