from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class VoiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the voice profile")
    description: Optional[str] = Field(None, max_length=500)


class VoiceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    external_voice_id: Optional[str] = None
    sample_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class SampleUploadResponse(BaseModel):
    status: str
    message: str


class VoiceListResponse(BaseModel):
    user_voices: list[VoiceResponse]
    engine_voices: list[dict]
