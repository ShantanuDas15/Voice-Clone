import uuid
import os
import shutil
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.voice_profile import VoiceProfile, VoiceProfileStatus
from app.services.audio.tasks import task_process_voice_profile
from app.services.audio.tts_engine import tts_engine
from app.schemas.voice_schema import VoiceResponse, SampleUploadResponse, VoiceListResponse
from typing import List

router = APIRouter()


@router.get("/", response_model=VoiceListResponse)
async def list_voices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all custom cloned voices for the user, plus ElevenLabs pre-made voices."""
    result = await db.execute(
        select(VoiceProfile).where(
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.deleted_at.is_(None)
        ).order_by(VoiceProfile.created_at.desc())
    )
    user_voices = result.scalars().all()

    engine_voices = []
    try:
        engine_voices = tts_engine.get_voices()
    except Exception as e:
        print(f"Failed to fetch ElevenLabs voices: {e}")

    return VoiceListResponse(
        user_voices=[
            VoiceResponse(
                id=str(v.id),
                name=v.name,
                description=v.description,
                status=v.status.value,
                external_voice_id=v.external_voice_id,
                sample_count=v.sample_count or 0,
                created_at=v.created_at,
            )
            for v in user_voices
        ],
        engine_voices=engine_voices
    )


@router.post("/", response_model=VoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_voice(
    name: str = Form(...),
    description: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a placeholder for a voice profile before uploading samples."""
    voice = VoiceProfile(
        user_id=current_user.id,
        name=name,
        description=description,
        status=VoiceProfileStatus.pending
    )
    db.add(voice)
    await db.commit()
    await db.refresh(voice)

    return VoiceResponse(
        id=str(voice.id),
        name=voice.name,
        description=voice.description,
        status=voice.status.value,
        external_voice_id=voice.external_voice_id,
        sample_count=voice.sample_count or 0,
        created_at=voice.created_at,
    )


@router.get("/{voice_id}", response_model=VoiceResponse)
async def get_voice(
    voice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific voice profile."""
    result = await db.execute(
        select(VoiceProfile).where(
            VoiceProfile.id == voice_id,
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.deleted_at.is_(None)
        )
    )
    voice = result.scalar_one_or_none()
    if not voice:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    return VoiceResponse(
        id=str(voice.id),
        name=voice.name,
        description=voice.description,
        status=voice.status.value,
        external_voice_id=voice.external_voice_id,
        sample_count=voice.sample_count or 0,
        created_at=voice.created_at,
    )


@router.delete("/{voice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice(
    voice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft deletes a voice profile."""
    from datetime import datetime, timezone
    result = await db.execute(
        select(VoiceProfile).where(
            VoiceProfile.id == voice_id,
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.deleted_at.is_(None)
        )
    )
    voice = result.scalar_one_or_none()
    if not voice:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    voice.deleted_at = datetime.now(timezone.utc)
    voice.status = VoiceProfileStatus.archived
    await db.commit()


@router.post("/{voice_id}/samples", response_model=SampleUploadResponse)
async def upload_samples(
    voice_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload audio samples and trigger the Celery task to clone the voice via ElevenLabs."""
    result = await db.execute(
        select(VoiceProfile).where(
            VoiceProfile.id == voice_id,
            VoiceProfile.user_id == current_user.id,
            VoiceProfile.deleted_at.is_(None)
        )
    )
    voice = result.scalar_one_or_none()

    if not voice:
        raise HTTPException(status_code=404, detail="Voice profile not found")

    if voice.status == VoiceProfileStatus.ready:
        raise HTTPException(status_code=400, detail="Voice profile is already trained")

    if voice.status == VoiceProfileStatus.processing:
        raise HTTPException(status_code=400, detail="Voice profile is currently being processed")

    # Validate file types
    ALLOWED_TYPES = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3", "audio/mp4", "audio/ogg"}
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{file.content_type}'. Allowed: MP3, WAV, OGG."
            )

    # Save uploaded files to temporary local storage for Celery worker
    file_paths = []
    tmp_dir = tempfile.gettempdir()
    try:
        for file in files:
            safe_filename = f"{uuid.uuid4()}_{file.filename}"
            tmp_path = os.path.join(tmp_dir, safe_filename)
            with open(tmp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(tmp_path)
    finally:
        for file in files:
            await file.close()

    # Update status and dispatch Celery task
    voice.status = VoiceProfileStatus.processing
    voice.sample_count = len(files)
    await db.commit()

    task_process_voice_profile.delay(str(voice.id), file_paths)

    return SampleUploadResponse(
        status="processing",
        message=f"Voice cloning started with {len(files)} sample(s). Check status via GET /voices/{voice_id}."
    )
