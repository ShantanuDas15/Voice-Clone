from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import verify_firebase_token
from app.services.user_service import upsert_user_from_token
from app.schemas.user_schema import UserResponse

router = APIRouter()

@router.post("/sync", response_model=UserResponse)
async def sync_auth_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Syncs the Firebase user with the database.
    Creates a new user and usage stats if they don't exist.
    Updates mutable fields (email, display name) if they already exist.
    """
    user = await upsert_user_from_token(db, decoded_token)
    return user
