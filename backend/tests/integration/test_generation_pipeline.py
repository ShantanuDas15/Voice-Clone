import uuid
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import event
from sqlite3 import Connection as SQLite3Connection
from app.db.base import Base
from app.models.generation import GenerationHistory, GenerationStatus
from app.models.usage_stats import UserUsageStats
from app.models.user import User
from app.models.voice_profile import VoiceProfile

# Setup test DB sync session
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, SQLite3Connection):
        dbapi_connection.create_function("char_length", 1, lambda x: len(x) if x else 0, deterministic=True)
        dbapi_connection.create_function("date_trunc", 2, lambda precision, dt: "2026-08-01 00:00:00", deterministic=True)
        dbapi_connection.create_function("NOW", 0, lambda: "2026-08-18 00:00:00", deterministic=True)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def sync_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@patch("app.services.audio.tasks.SessionLocal")
@patch("app.services.audio.tts_engine.ElevenLabsClient.generate_speech")
@patch("app.services.audio.tasks.r2_storage.upload_file_bytes")
def test_task_generate_speech_success(mock_r2_upload, mock_generate_speech, mock_session_local, sync_db):
    """Integration test for successful TTS generation pipeline."""
    mock_session_local.return_value = sync_db
    mock_generate_speech.return_value = b"audio_bytes"
    
    from app.services.audio.tasks import task_generate_speech

    # Create dummy user and usage stats
    user_id = uuid.uuid4()
    user = User(id=user_id, firebase_uid="test_uid_1", email="test@example.com", auth_provider="google")
    sync_db.add(user)
    
    stats = UserUsageStats(user_id=user_id, chars_generated_this_month=100, generations_this_month=1, total_generations=1)
    sync_db.add(stats)

    # Create dummy generation history
    gen_id = uuid.uuid4()
    generation = GenerationHistory(
        id=gen_id,
        user_id=user_id,
        input_text="Hello world",
        status=GenerationStatus.queued
    )
    sync_db.add(generation)
    sync_db.commit()

    # Call task
    result = task_generate_speech(str(gen_id), "Hello world", "voice_abc")
    
    # Assert successful result
    r2_expected_path = f"generations/{user_id}/{gen_id}.mp3"
    assert result == {"status": "success", "r2_path": r2_expected_path}

    # Assert mocks
    mock_generate_speech.assert_called_once_with(text="Hello world", voice_id="voice_abc")
    mock_r2_upload.assert_called_once_with(b"audio_bytes", r2_expected_path, content_type="audio/mpeg")

    # Assert DB state
    updated_gen = sync_db.query(GenerationHistory).filter_by(id=gen_id).first()
    assert updated_gen.status == GenerationStatus.completed
    assert updated_gen.output_r2_path == r2_expected_path

    # Assert UsageStats updated
    updated_stats = sync_db.query(UserUsageStats).filter_by(user_id=user_id).first()
    assert updated_stats.chars_generated_this_month == 100 + len("Hello world")
    assert updated_stats.generations_this_month == 2
    assert updated_stats.total_generations == 2

@patch("app.services.audio.tasks.SessionLocal")
@patch("app.services.audio.tts_engine.ElevenLabsClient.generate_speech")
def test_task_generate_speech_api_failure(mock_generate_speech, mock_session_local, sync_db):
    """Integration test for API failure during TTS generation."""
    mock_session_local.return_value = sync_db
    mock_generate_speech.side_effect = Exception("TTS API failed")
    
    from app.services.audio.tasks import task_generate_speech

    user_id = uuid.uuid4()
    user = User(id=user_id, firebase_uid="test_uid_2", email="test2@example.com", auth_provider="google")
    sync_db.add(user)

    gen_id = uuid.uuid4()
    generation = GenerationHistory(
        id=gen_id,
        user_id=user_id,
        input_text="Failing text",
        status=GenerationStatus.queued
    )
    sync_db.add(generation)
    sync_db.commit()

    with patch.object(task_generate_speech, "retry") as mock_retry:
        mock_retry.side_effect = Exception("Retry Triggered")
        
        with pytest.raises(Exception, match="Retry Triggered"):
            task_generate_speech(str(gen_id), "Failing text", "voice_xyz")
        
        mock_retry.assert_called_once()
    
    updated_gen = sync_db.query(GenerationHistory).filter_by(id=gen_id).first()
    assert updated_gen.status == GenerationStatus.failed
    assert updated_gen.error_message == "TTS API failed"
