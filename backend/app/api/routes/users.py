from fastapi import APIRouter, Depends
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Get current logged in user profile.
    Requires a valid Firebase Bearer token.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_email_verified": current_user.is_email_verified,
        "auth_provider": current_user.auth_provider.value
    }
