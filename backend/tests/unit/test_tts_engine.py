import tempfile
import pytest
from unittest.mock import patch
from app.services.audio.tts_engine import tts_engine, ElevenLabsClient

@patch("httpx.Client.post")
def test_add_voice_success(mock_post):
    """ElevenLabs returns voice_id -> add_voice() returns it."""
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"voice_id": "abc12345"}
    
    # Set mock API key
    tts_engine.api_key = "test_key"
    
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        result = tts_engine.add_voice("Test Voice", "desc", [f.name])
    
    assert result == "abc12345"
    mock_post.assert_called_once()
    assert "https://api.elevenlabs.io/v1/voices/add" in mock_post.call_args[0][0]

@patch("httpx.Client.post")
def test_add_voice_api_error(mock_post):
    """ElevenLabs returns 422 -> add_voice() raises Exception."""
    mock_post.return_value.status_code = 422
    mock_post.return_value.text = "Unprocessable"
    
    # Set mock API key
    tts_engine.api_key = "test_key"
    
    with pytest.raises(Exception, match="ElevenLabs API Error: 422"):
        with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
            tts_engine.add_voice("Test", "", [f.name])

def test_add_voice_not_configured():
    """No API key -> add_voice() raises ValueError."""
    client = ElevenLabsClient.__new__(ElevenLabsClient)
    client.api_key = None
    client.headers = {}
    
    with pytest.raises(ValueError, match="ElevenLabs API Key is not configured"):
        client.add_voice("Test", "", [])
