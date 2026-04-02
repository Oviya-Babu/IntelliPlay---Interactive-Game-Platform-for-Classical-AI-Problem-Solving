from fastapi import APIRouter

router = APIRouter()


@router.get("/{session_id}")
async def get_session(session_id: str):
    return {"session_id": session_id}


@router.post("/")
async def create_session():
    return {"message": "create_session stub"}
