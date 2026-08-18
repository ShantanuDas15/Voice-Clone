from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.user_service import get_user_with_stats
from app.schemas.user_schema import UserWithStatsResponse, UserStatsResponse

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

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard metrics for the current user.
    """
    from sqlalchemy.future import select
    from app.models.usage_stats import UserUsageStats
    
    stats_result = await db.execute(
        select(UserUsageStats).where(UserUsageStats.user_id == current_user.id)
    )
    stats = stats_result.scalar_one_or_none()
    
    MONTHLY_CHAR_LIMIT = 30_000
    
    if stats:
        voice_count = stats.total_voice_profiles
        gen_count = stats.total_generations
        chars_used = stats.chars_generated_this_month or 0
    else:
        voice_count = 0
        gen_count = 0
        chars_used = 0
        
    chars_remaining = max(0, MONTHLY_CHAR_LIMIT - chars_used)
    
    return UserStatsResponse(
        voice_count=voice_count,
        generation_count=gen_count,
        chars_used_this_month=chars_used,
        chars_remaining=chars_remaining,
        monthly_limit=MONTHLY_CHAR_LIMIT
    )
