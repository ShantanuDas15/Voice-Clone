import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_get_user_stats(test_user_token_headers):
    # Mock the db session
    from app.main import app
    from app.db.database import get_db
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.api.dependencies import get_current_user
    import uuid
    from app.models.user import User
    
    mock_session = AsyncMock(spec=AsyncSession)
    
    # Mock the result of db.execute
    mock_result = MagicMock()
    mock_stats = MagicMock()
    mock_stats.total_voice_profiles = 2
    mock_stats.total_generations = 10
    mock_stats.chars_generated_this_month = 5000
    mock_result.scalar_one_or_none.return_value = mock_stats
    
    mock_session.execute.return_value = mock_result
    
    dummy_user = User(
        id=uuid.uuid4(),
        firebase_uid="dummy_firebase_uid",
        email="test@example.com",
        auth_provider="google"
    )
    
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[get_current_user] = lambda: dummy_user

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/users/stats", headers=test_user_token_headers)
        
    assert response.status_code == 200
    data = response.json()
    
    assert "voice_count" in data
    assert data["voice_count"] == 2
    assert "generation_count" in data
    assert data["generation_count"] == 10
    assert "chars_used_this_month" in data
    assert data["chars_used_this_month"] == 5000
    assert "chars_remaining" in data
    assert data["chars_remaining"] == 25000
    assert "monthly_limit" in data
    assert data["monthly_limit"] == 30000
    
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)
