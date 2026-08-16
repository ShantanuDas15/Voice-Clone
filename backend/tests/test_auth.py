import pytest
from fastapi import HTTPException
from app.api.dependencies import get_current_user
from app.models.user import AuthProvider

@pytest.mark.asyncio
async def test_get_current_user_creates_new_user(mock_verify_firebase_token, mock_db_session):
    # Setup the decoded token
    decoded_token = {
        "uid": "new-uid",
        "email": "new@example.com",
        "name": "New User",
        "picture": "http://example.com/pic.png",
        "firebase": {"sign_in_provider": "google.com"},
        "email_verified": True
    }
    
    # Run the dependency
    user = await get_current_user(decoded_token=decoded_token, db=mock_db_session)
    
    # Verify user was created properly
    assert user.firebase_uid == "new-uid"
    assert user.email == "new@example.com"
    assert user.auth_provider == AuthProvider.google
    
    # Verify DB commands were called
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_db_session):
    decoded_token = {"uid": "no-email"} # Missing email
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(decoded_token=decoded_token, db=mock_db_session)
        
    assert exc_info.value.status_code == 401
    assert "Invalid token payload" in exc_info.value.detail
