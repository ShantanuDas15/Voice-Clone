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
