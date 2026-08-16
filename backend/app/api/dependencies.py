from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.core.security import verify_firebase_token
from app.models.user import User, AuthProvider

async def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    display_name = decoded_token.get("name")
    avatar_url = decoded_token.get("picture")
    
    if not firebase_uid or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Fetch user from DB
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create user if they don't exist yet (first login)
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        auth_provider = AuthProvider.google if "google" in provider_id else AuthProvider.email
        
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            auth_provider=auth_provider,
            is_email_verified=decoded_token.get("email_verified", False)
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    if user.is_active is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")
        
    return user
