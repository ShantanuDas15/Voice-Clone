import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock
from app.models.voice_profile import VoiceProfile, VoiceProfileStatus
from app.models.generation import GenerationHistory, GenerationStatus
import uuid
import datetime

@pytest.mark.asyncio
async def test_get_voice_detail_and_generations(test_user_token_headers):
    # Setup dependency overrides
    from app.main import app
    from app.db.database import get_db
    from app.api.dependencies import get_current_user
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User
    
    mock_session = AsyncMock(spec=AsyncSession)
    
    dummy_user = User(
        id=uuid.uuid4(),
        firebase_uid="dummy_firebase_uid",
        email="test@example.com",
        auth_provider="google"
    )
    
    # Create fake voice profile
    fake_voice_id = uuid.uuid4()
    fake_voice = VoiceProfile(
        id=fake_voice_id,
        user_id=dummy_user.id,
        name="Test Voice",
        description="A test voice profile",
        status=VoiceProfileStatus.ready,
        external_voice_id="ext-voice-123",
        sample_count=2,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )

    # Create fake generation
    fake_gen = GenerationHistory(
        id=uuid.uuid4(),
        user_id=dummy_user.id,
        voice_profile_id=fake_voice_id,
        input_text="Testing generation",
        status=GenerationStatus.completed,
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    
    async def mock_execute(stmt):
        mock_result = MagicMock()
        # Very simple checking to distinguish which query was executed
        if "voice_profiles" in str(stmt):
            mock_result.scalar_one_or_none.return_value = fake_voice
        elif "generation_history" in str(stmt):
            mock_result.scalars.return_value.all.return_value = [fake_gen]
        return mock_result
        
    mock_session.execute.side_effect = mock_execute
    
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test GET /api/v1/voices/{voice_id}
        response_detail = await client.get(f"/api/v1/voices/{fake_voice_id}", headers=test_user_token_headers)
        assert response_detail.status_code == 200
        detail_data = response_detail.json()
        assert detail_data["name"] == "Test Voice"
        assert detail_data["status"] == "ready"
        
        # Test GET /api/v1/voices/{voice_id}/generations
        response_gens = await client.get(f"/api/v1/voices/{fake_voice_id}/generations", headers=test_user_token_headers)
        assert response_gens.status_code == 200
        gens_data = response_gens.json()
        assert len(gens_data) == 1
        assert gens_data[0]["text"] == "Testing generation"
        
        # Test DELETE /api/v1/voices/{voice_id}
        response_delete = await client.delete(f"/api/v1/voices/{fake_voice_id}", headers=test_user_token_headers)
        assert response_delete.status_code == 204
        
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)
