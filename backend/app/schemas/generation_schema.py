from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to synthesize")
    voice_id: str = Field(..., description="Voice ID — either a user voice profile UUID or an ElevenLabs voice ID")
    is_custom_voice: bool = Field(default=False, description="True if voice_id is a user voice profile UUID")


class GenerationResponse(BaseModel):
    id: str
    task_id: Optional[str] = None
    status: str


class GenerationListItem(BaseModel):
    id: str
    status: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerationDetailResponse(BaseModel):
    id: str
    status: str
    text: str
    created_at: datetime
    audio_url: Optional[str] = None
    error: Optional[str] = None

    model_config = {"from_attributes": True}
