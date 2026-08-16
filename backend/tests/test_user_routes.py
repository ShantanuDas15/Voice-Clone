import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import User, AuthProvider
from app.models.usage_stats import UserUsageStats
import uuid
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_auth_sync_new_user(mock_db_session):
    # Override FastAPI dependency
    from app.db.database import get_db
    from app.core.security import verify_firebase_token
    
    app.dependency_overrides[get_db] = lambda: mock_db_session
    app.dependency_overrides[verify_firebase_token] = lambda: {
        "uid": "test-uid-123",
        "email": "test@example.com",
        "name": "Test User",
        "picture": "http://example.com/pic.png",
        "firebase": {"sign_in_provider": "google.com"},
        "email_verified": True
    }
    
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
    
    async def mock_refresh(obj):
        if isinstance(obj, User):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
            obj.updated_at = datetime.now(timezone.utc)
    
    mock_db_session.refresh.side_effect = mock_refresh
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/auth/sync", headers={"Authorization": "Bearer fake-token"})
    
    if response.status_code != 200:
        print("Auth sync error:", response.json())
        
    assert response.status_code == 200
    data = response.json()
    assert data["firebase_uid"] == "test-uid-123"
    assert data["email"] == "test@example.com"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_users_me_success(mock_db_session):
    from app.db.database import get_db
    from app.core.security import verify_firebase_token
    
    app.dependency_overrides[get_db] = lambda: mock_db_session
    app.dependency_overrides[verify_firebase_token] = lambda: {
        "uid": "test-uid-123",
        "email": "test@example.com",
        "name": "Test User",
        "picture": "http://example.com/pic.png",
        "firebase": {"sign_in_provider": "google.com"},
        "email_verified": True
    }
    
    mock_user = User(
        id=uuid.uuid4(),
        firebase_uid="test-uid-123",
        email="test@example.com",
        display_name="Test User",
        is_active=True,
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        auth_provider=AuthProvider.google
    )
    
    mock_stats = UserUsageStats(
        user_id=mock_user.id,
        total_generations=5,
        total_voice_profiles=2,
        total_audio_uploads=10,
        total_output_seconds=15.5,
        storage_used_bytes=1024,
        generations_this_month=5,
        last_reset_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    # We mock scalar_one_or_none to return user then stats for the /me endpoint
    # wait, the /me endpoint calls get_current_user first (which executes select(User))
    # then it calls get_user_with_stats (which executes select(User), then select(Stats))
    # so we need 3 side effects: [mock_user, mock_user, mock_stats]
    mock_db_session.execute.return_value.scalar_one_or_none.side_effect = [mock_user, mock_user, mock_stats]
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/users/me", headers={"Authorization": "Bearer fake-token"})
    
    if response.status_code != 200:
        print("Users me error:", response.json())
        
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "usage_stats" in data
    assert data["usage_stats"]["total_generations"] == 5
    
    app.dependency_overrides.clear()
