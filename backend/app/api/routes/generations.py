import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_firebase_token
from app.models.user import User
from app.models.generation import GenerationHistory, GenerationStatus
from app.models.voice_profile import VoiceProfile
from app.services.audio.tasks import task_generate_speech

router = APIRouter()

async def get_current_user(token: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)) -> User:
    firebase_uid = token.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

class GenerateRequest(BaseModel):
    text: str
    voice_id: str
    is_custom_voice: bool = False

@router.post("/")
def generate_audio(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits a request to generate speech."""
    if not req.text or len(req.text) > 5000:
        raise HTTPException(status_code=400, detail="Text must be between 1 and 5000 characters.")

    external_voice_id = req.voice_id
    voice_profile_id = None

    if req.is_custom_voice:
        # Validate that the voice belongs to the user
        voice = db.query(VoiceProfile).filter(
            VoiceProfile.id == req.voice_id,
            VoiceProfile.user_id == current_user.id
        ).first()
        if not voice or not voice.external_voice_id:
            raise HTTPException(status_code=400, detail="Invalid custom voice profile.")
        
        external_voice_id = voice.external_voice_id
        voice_profile_id = voice.id

    # Create generation record
    gen = GenerationHistory(
        user_id=current_user.id,
        voice_profile_id=voice_profile_id,
        input_text=req.text,
        status=GenerationStatus.queued
    )
    db.add(gen)
    db.commit()
    db.refresh(gen)

    # Dispatch Celery Task
    task = task_generate_speech.delay(str(gen.id), req.text, external_voice_id)
    
    gen.celery_task_id = task.id
    db.commit()

    return {
        "id": str(gen.id),
        "task_id": task.id,
        "status": gen.status.value
    }

@router.get("/{gen_id}")
def get_generation(
    gen_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gets the status and R2 path of a generation."""
    gen = db.query(GenerationHistory).filter(
        GenerationHistory.id == gen_id,
        GenerationHistory.user_id == current_user.id
    ).first()

    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")

    response = {
        "id": str(gen.id),
        "status": gen.status.value,
        "text": gen.input_text,
        "created_at": gen.created_at
    }

    if gen.status == GenerationStatus.completed and gen.output_r2_path:
        from app.services.storage.r2_client import r2_storage
        try:
            url = r2_storage.get_presigned_url(gen.output_r2_path)
            response["audio_url"] = url
        except Exception as e:
            response["audio_url"] = None
            response["error"] = str(e)
            
    elif gen.status == GenerationStatus.failed:
        response["error"] = gen.error_message

    return response

@router.get("/")
def list_generations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    generations = db.query(GenerationHistory).filter(
        GenerationHistory.user_id == current_user.id
    ).order_by(GenerationHistory.created_at.desc()).limit(50).all()
    
    return [{
        "id": str(g.id),
        "status": g.status.value,
        "text": g.input_text[:50] + "..." if len(g.input_text) > 50 else g.input_text,
        "created_at": g.created_at
    } for g in generations]
