from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.user_service import get_user_with_stats
from app.schemas.user_schema import UserWithStatsResponse

router = APIRouter()

@router.get("/me", response_model=UserWithStatsResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current logged in user profile and usage stats.
    Requires a valid Firebase Bearer token.
    """
    result = await get_user_with_stats(db, current_user.id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user, stats = result
    
    response_data = {**user.__dict__}
    if stats:
        response_data["usage_stats"] = stats
        
    return response_data
