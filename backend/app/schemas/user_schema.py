from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.user import AuthProvider

class UsageStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    total_generations: int
    total_voice_profiles: int
    total_audio_uploads: int
    total_output_seconds: float
    storage_used_bytes: int
    generations_this_month: int
    last_reset_at: datetime

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    firebase_uid: str
    auth_provider: AuthProvider
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime

class UserWithStatsResponse(UserResponse):
    usage_stats: Optional[UsageStatsResponse] = None
