import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.models.user import User

@pytest.fixture
def mock_verify_firebase_token():
    with patch("app.core.security.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {
            "uid": "test-uid-123",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "http://example.com/pic.png",
            "firebase": {"sign_in_provider": "google.com"},
            "email_verified": True
        }
        yield mock_verify

@pytest.fixture
def mock_db_session():
    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    # Mock the execute/scalar_one_or_none behavior
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # Simulates user not found initially
    mock_session.execute.return_value = mock_result
    return mock_session

@pytest.fixture
def test_user_token_headers():
    return {"Authorization": "Bearer fake_test_token"}

@pytest.fixture
async def async_client():
    from httpx import AsyncClient
    from app.main import app
    
    # Needs a mock DB and current user override to actually work end-to-end,
    # or just mocking the get_current_user dependency.
    from app.api.dependencies import get_current_user
    import uuid
    from app.models.user import User
    
    dummy_user = User(
        id=uuid.uuid4(),
        firebase_uid="dummy_firebase_uid",
        email="test@example.com",
        auth_provider="google"
    )
    
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
        
    app.dependency_overrides.clear()

