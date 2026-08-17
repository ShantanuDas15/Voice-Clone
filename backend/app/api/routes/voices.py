import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_firebase_token
from app.models.user import User
from app.models.voice_profile import VoiceProfile, VoiceProfileStatus
from app.services.audio.tasks import task_process_voice_profile
from app.services.audio.tts_engine import tts_engine
from typing import List

router = APIRouter()

async def get_current_user(token: dict = Depends(verify_firebase_token), db: Session = Depends(get_db)) -> User:
    firebase_uid = token.get("uid")
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/")
def list_voices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all custom cloned voices for the user, and optionally pre-made engine voices."""
    user_voices = db.query(VoiceProfile).filter(VoiceProfile.user_id == current_user.id).all()
    
    # We can also fetch ElevenLabs pre-made voices here to merge them
    engine_voices = []
    try:
        engine_voices = tts_engine.get_voices()
    except Exception as e:
        print(f"Failed to fetch engine voices: {e}")
        
    return {
        "user_voices": [
            {
                "id": str(v.id),
                "name": v.name,
                "status": v.status.value,
                "external_voice_id": v.external_voice_id
            } for v in user_voices
        ],
        "engine_voices": engine_voices
    }

@router.post("/")
def create_voice(
    name: str = Form(...),
    description: str = Form(None),
    db: Session = Depends(get_db), 
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
    db.commit()
    db.refresh(voice)
    return {"id": str(voice.id), "name": voice.name, "status": voice.status.value}

@router.post("/{voice_id}/samples")
async def upload_samples(
    voice_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload audio samples and trigger the celery task to clone the voice."""
    voice = db.query(VoiceProfile).filter(
        VoiceProfile.id == voice_id, 
        VoiceProfile.user_id == current_user.id
    ).first()
    
    if not voice:
        raise HTTPException(status_code=404, detail="Voice profile not found")
        
    if voice.status == VoiceProfileStatus.ready:
        raise HTTPException(status_code=400, detail="Voice profile is already trained")

    # In a full implementation, we'd save these files to R2 here, 
    # then pass the R2 keys to the Celery task.
    # For MVP, we can trigger the Celery task (which needs to be fully fleshed out to hit ElevenLabs)
    
    voice.status = VoiceProfileStatus.processing
    db.commit()
    
    task_process_voice_profile.delay(str(voice.id))
    
    return {"status": "processing", "message": "Voice is being cloned in the background"}
