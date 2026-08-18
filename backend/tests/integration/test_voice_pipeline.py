import os
import uuid
import tempfile
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
from app.models.voice_profile import VoiceProfile, VoiceProfileStatus

# We need a sync session for the Celery task
from sqlalchemy import event
from sqlite3 import Connection as SQLite3Connection

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        dbapi_connection.create_function("char_length", 1, lambda x: len(x) if x else 0, deterministic=True)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def sync_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@patch("app.services.audio.tasks.SessionLocal")
@patch("app.services.audio.tts_engine.ElevenLabsClient.add_voice")
def test_task_process_voice_profile_success(mock_add_voice, mock_session_local, sync_db):
    """Integration test for task_process_voice_profile successful run."""
    mock_session_local.return_value = sync_db
    mock_add_voice.return_value = "elevenlabs_voice_id_789"
    
    from app.services.audio.tasks import task_process_voice_profile

    # Create dummy voice profile
    profile_id = uuid.uuid4()
    profile = VoiceProfile(
        id=profile_id,
        user_id=uuid.uuid4(),
        name="Integration Voice",
        description="Test",
        status=VoiceProfileStatus.processing,
        sample_count=1
    )
    sync_db.add(profile)
    sync_db.commit()

    # Create dummy audio file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        file_path = f.name
        f.write(b"dummy audio data")

    # Run task directly
    result = task_process_voice_profile(str(profile_id), [file_path])
    
    assert result == {"status": "success", "voice_id": "elevenlabs_voice_id_789"}
    
    # Assert DB state transitioned
    updated_profile = sync_db.query(VoiceProfile).filter_by(id=profile_id).first()
    assert updated_profile.status == VoiceProfileStatus.ready
    assert updated_profile.external_voice_id == "elevenlabs_voice_id_789"

    # Assert file cleanup
    assert not os.path.exists(file_path)

@patch("app.services.audio.tasks.SessionLocal")
@patch("app.services.audio.tts_engine.ElevenLabsClient.add_voice")
def test_task_process_voice_profile_api_failure(mock_add_voice, mock_session_local, sync_db):
    """Integration test for task_process_voice_profile when API fails."""
    mock_session_local.return_value = sync_db
    mock_add_voice.side_effect = Exception("API failed")
    
    from app.services.audio.tasks import task_process_voice_profile

    # Create dummy voice profile
    profile_id = uuid.uuid4()
    profile = VoiceProfile(
        id=profile_id,
        user_id=uuid.uuid4(),
        name="Failed Voice",
        status=VoiceProfileStatus.processing
    )
    sync_db.add(profile)
    sync_db.commit()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        file_path = f.name

    # Mock task_process_voice_profile.retry to raise a specific exception
    with patch.object(task_process_voice_profile, "retry") as mock_retry:
        mock_retry.side_effect = Exception("Retry Triggered")
        
        with pytest.raises(Exception, match="Retry Triggered"):
            task_process_voice_profile(str(profile_id), [file_path])
        
        mock_retry.assert_called_once()
    
    updated_profile = sync_db.query(VoiceProfile).filter_by(id=profile_id).first()
    assert updated_profile.status == VoiceProfileStatus.failed
    
    # Files should still be cleaned up
    assert not os.path.exists(file_path)
