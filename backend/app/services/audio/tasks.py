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
        
        # 4. Update generation record
        generation.status = GenerationStatus.completed
        generation.output_r2_path = r2_path
        db.commit()

        # 5. Update usage stats
        from app.models.usage_stats import UserUsageStats
        stats = db.query(UserUsageStats).filter(UserUsageStats.user_id == generation.user_id).first()
        if stats:
            stats.chars_generated_this_month = (stats.chars_generated_this_month or 0) + len(text)
            stats.generations_this_month = (stats.generations_this_month or 0) + 1
            stats.total_generations = (stats.total_generations or 0) + 1
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

from app.models.voice_profile import VoiceProfile, VoiceProfileStatus
import os

@celery_app.task(bind=True, max_retries=3)
def task_process_voice_profile(self, profile_id: str, file_paths: list[str]):
    """
    Background task to clone a voice using uploaded audio samples.
    """
    db: Session = SessionLocal()
    prof_id_uuid = uuid.UUID(profile_id)
    
    profile: Optional[VoiceProfile] = db.query(VoiceProfile).filter(VoiceProfile.id == prof_id_uuid).first()
    
    if not profile:
        db.close()
        # Clean up files
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)
        return "Voice profile record not found"

    try:
        # Call ElevenLabs API to add the voice
        voice_id = tts_engine.add_voice(
            name=profile.name,
            description=profile.description or "",
            file_paths=file_paths
        )
        
        # Update database record
        profile.status = VoiceProfileStatus.ready
        profile.external_voice_id = voice_id
        db.commit()
        
        return {"status": "success", "voice_id": voice_id}
        
    except Exception as exc:
        profile.status = VoiceProfileStatus.failed
        db.commit()
        
        # Retry with exponential backoff if it's an API glitch
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
        
    finally:
        db.close()
        # Clean up local temporary files
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)
