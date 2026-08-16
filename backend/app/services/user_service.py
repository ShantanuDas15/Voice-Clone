from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, AuthProvider
from app.models.usage_stats import UserUsageStats
from fastapi import HTTPException, status
from typing import Optional, Tuple

async def upsert_user_from_token(db: AsyncSession, decoded_token: dict) -> User:
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    display_name = decoded_token.get("name")
    avatar_url = decoded_token.get("picture")
    
    if not firebase_uid or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user:
        # Update mutable fields
        user.email = email
        user.display_name = display_name
        user.avatar_url = avatar_url
        user.is_email_verified = decoded_token.get("email_verified", False)
        await db.commit()
        await db.refresh(user)
        return user
    
    # Create new user
    provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
    auth_provider = AuthProvider.google if "google" in provider_id else AuthProvider.email
    
    user = User(
        firebase_uid=firebase_uid,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
        auth_provider=auth_provider,
        is_email_verified=decoded_token.get("email_verified", False),
        is_active=True
    )
    db.add(user)
    
    # Flush to generate user ID so we can create usage stats
    await db.flush()
    
    # Create associated usage stats
    usage_stats = UserUsageStats(user_id=user.id)
    db.add(usage_stats)
    
    await db.commit()
    await db.refresh(user)
    return user

async def get_user_with_stats(db: AsyncSession, user_id) -> Optional[Tuple[User, UserUsageStats]]:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        return None
        
    stats_result = await db.execute(select(UserUsageStats).where(UserUsageStats.user_id == user_id))
    stats = stats_result.scalar_one_or_none()
    
    return user, stats
