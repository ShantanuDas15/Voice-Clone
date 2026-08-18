import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.generation import GenerationHistory, GenerationStatus
from app.models.voice_profile import VoiceProfile
from app.models.usage_stats import UserUsageStats
from app.services.audio.tasks import task_generate_speech
from app.schemas.generation_schema import (
    GenerateRequest,
    GenerationResponse,
    GenerationListItem,
    GenerationDetailResponse,
)

router = APIRouter()

# ElevenLabs Starter plan monthly character limit
MONTHLY_CHAR_LIMIT = 30_000


@router.post("/", response_model=GenerationResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_audio(
    req: GenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a text-to-speech generation request. Returns immediately with a task ID to poll."""

    # --- Quota Check ---
    stats_result = await db.execute(
        select(UserUsageStats).where(UserUsageStats.user_id == current_user.id)
    )
    stats = stats_result.scalar_one_or_none()
    if stats:
        chars_used = stats.chars_generated_this_month or 0
        if chars_used + len(req.text) > MONTHLY_CHAR_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Monthly character quota exceeded. Used: {chars_used}, Limit: {MONTHLY_CHAR_LIMIT}."
            )

    # --- Resolve voice ---
    external_voice_id = req.voice_id
    voice_profile_id = None

    if req.is_custom_voice:
        try:
            voice_uuid = uuid.UUID(req.voice_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid custom voice ID format.")

        voice_result = await db.execute(
            select(VoiceProfile).where(
                VoiceProfile.id == voice_uuid,
                VoiceProfile.user_id == current_user.id,
                VoiceProfile.deleted_at.is_(None)
            )
        )
        voice = voice_result.scalar_one_or_none()

        if not voice:
            raise HTTPException(status_code=404, detail="Custom voice profile not found.")
        if not voice.external_voice_id:
            raise HTTPException(status_code=400, detail="Custom voice is not ready yet. Please wait for cloning to complete.")

        external_voice_id = voice.external_voice_id
        voice_profile_id = voice.id

    # --- Create generation record ---
    gen = GenerationHistory(
        user_id=current_user.id,
        voice_profile_id=voice_profile_id,
        input_text=req.text,
        status=GenerationStatus.queued
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    # --- Dispatch Celery task ---
    task = task_generate_speech.delay(str(gen.id), req.text, external_voice_id)

    gen.celery_task_id = task.id
    await db.commit()

    return GenerationResponse(
        id=str(gen.id),
        task_id=task.id,
        status=gen.status.value
    )


@router.get("/", response_model=list[GenerationListItem])
async def list_generations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List the 50 most recent generation jobs for the current user."""
    result = await db.execute(
        select(GenerationHistory)
        .where(GenerationHistory.user_id == current_user.id)
        .order_by(GenerationHistory.created_at.desc())
        .limit(50)
    )
    generations = result.scalars().all()

    return [
        GenerationListItem(
            id=str(g.id),
            status=g.status.value,
            text=g.input_text[:80] + "..." if len(g.input_text) > 80 else g.input_text,
            created_at=g.created_at,
        )
        for g in generations
    ]


@router.get("/{gen_id}", response_model=GenerationDetailResponse)
async def get_generation(
    gen_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Poll the status of a specific generation. Returns audio URL when complete."""
    result = await db.execute(
        select(GenerationHistory).where(
            GenerationHistory.id == gen_id,
            GenerationHistory.user_id == current_user.id
        )
    )
    gen = result.scalar_one_or_none()

    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    response = GenerationDetailResponse(
        id=str(gen.id),
        status=gen.status.value,
        text=gen.input_text,
        created_at=gen.created_at,
    )

    if gen.status == GenerationStatus.completed and gen.output_r2_path:
        from app.services.storage.r2_client import r2_storage
        try:
            response.audio_url = r2_storage.get_presigned_url(gen.output_r2_path)
        except Exception as e:
            response.error = f"Could not generate audio URL: {str(e)}"

    elif gen.status == GenerationStatus.failed:
        response.error = gen.error_message

    return response
