import pytest
import uuid
from unittest.mock import patch, MagicMock
from app.services.audio.tasks import task_generate_speech
from app.models.usage_stats import UserUsageStats
from app.models.generation import GenerationHistory, GenerationStatus

@pytest.mark.asyncio
async def test_quota_exceeded_route(mock_db_session):
    # Mock the DB to return a UserUsageStats that exceeds the quota
    mock_stats = MagicMock()
    mock_stats.chars_generated_this_month = 30_000 # The limit is 30,000
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_stats
    mock_db_session.execute.return_value = mock_result
    
    # We also need to patch get_db to return our mock_db_session
    from app.api.dependencies import get_db, get_current_user
    from app.main import app
    from app.models.user import User
    
    dummy_user = User(
        id=uuid.uuid4(),
        firebase_uid="dummy_firebase_uid",
        email="test@example.com",
        auth_provider="google"
    )
    
    app.dependency_overrides[get_db] = lambda: mock_db_session
    app.dependency_overrides[get_current_user] = lambda: dummy_user

    req_data = {
        "text": "Hello world",
        "voice_id": "eleven-labs-voice-id",
        "is_custom_voice": False
    }

    from httpx import AsyncClient
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/v1/generations/", json=req_data)
    
    assert response.status_code == 429
    assert "Monthly character quota exceeded" in response.json()["detail"]
    
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


def test_task_generate_speech_increments_quota():
    with patch("app.services.audio.tasks.SessionLocal") as mock_session_local, \
         patch("app.services.audio.tasks.tts_engine") as mock_tts_engine, \
         patch("app.services.audio.tasks.r2_storage") as mock_r2_storage:
        
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        gen_id = uuid.uuid4()
        user_id = uuid.uuid4()
        
        mock_generation = MagicMock()
        mock_generation.id = gen_id
        mock_generation.user_id = user_id
        mock_generation.status = GenerationStatus.queued
        
        mock_stats = MagicMock()
        mock_stats.chars_generated_this_month = 100
        mock_stats.generations_this_month = 5
        mock_stats.total_generations = 10
        
        # Setup mock db query chain
        # 1st query is GenerationHistory, 2nd query is UserUsageStats
        def query_side_effect(model):
            mock_query = MagicMock()
            if model == GenerationHistory:
                mock_query.filter.return_value.first.return_value = mock_generation
            elif model == UserUsageStats:
                mock_query.filter.return_value.first.return_value = mock_stats
            return mock_query
            
        mock_session.query.side_effect = query_side_effect
        
        mock_tts_engine.generate_speech.return_value = b"audio_data"
        
        # Call the task
        task_generate_speech(str(gen_id), "Test text", "voice-123")
        
        # Check quota was incremented
        assert mock_stats.chars_generated_this_month == 100 + len("Test text")
        assert mock_stats.generations_this_month == 6
        assert mock_stats.total_generations == 11
        
        # Check commits
        assert mock_session.commit.call_count == 3  # status update, output update, stats update
