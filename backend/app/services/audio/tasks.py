import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.core.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.generation import GenerationHistory, GenerationStatus
from app.models.voice_profile import VoiceProfile
from app.services.storage.r2_client import r2_storage
from app.services.audio.tts_engine import tts_engine

@celery_app.task(bind=True, max_retries=3)
def task_generate_speech(self, generation_id: str, text: str, voice_id: str):
    """
    Background task to generate speech via ElevenLabs and save it to R2.
    """
    db: Session = SessionLocal()
    gen_id_uuid = uuid.UUID(generation_id)
    
    generation: Optional[GenerationHistory] = db.query(GenerationHistory).filter(GenerationHistory.id == gen_id_uuid).first()
    
    if not generation:
        db.close()
        return "Generation record not found"

    try:
        # 1. Update status to processing
        generation.status = GenerationStatus.processing
        db.commit()
        
        # 2. Call ElevenLabs API
        audio_bytes = tts_engine.generate_speech(text=text, voice_id=voice_id)
        
        # 3. Upload to R2
        r2_path = f"generations/{generation.user_id}/{generation.id}.mp3"
        r2_storage.upload_file_bytes(audio_bytes, r2_path, content_type="audio/mpeg")
        
        # 4. Update database record
        generation.status = GenerationStatus.completed
        generation.output_r2_path = r2_path
        
        # Optional: We could parse the MP3 headers to get true duration, 
        # but for now we leave it null or estimate it.
        db.commit()
        
        return {"status": "success", "r2_path": r2_path}
        
    except Exception as exc:
        generation.status = GenerationStatus.failed
        generation.error_message = str(exc)
        db.commit()
        
        # Retry with exponential backoff if it's an API glitch
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
        
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def task_process_voice_profile(self, profile_id: str):
    """
    Background task to clone a voice using uploaded audio samples.
    (Placeholder until we add the form upload UI for voice samples)
    """
    pass
