import pytest
from unittest.mock import patch
from app.services.audio.tts_engine import tts_engine, ElevenLabsClient

@patch("httpx.Client.post")
def test_generate_speech_success(mock_post):
    """ElevenLabs returns 200 and audio bytes -> generate_speech() returns it."""
    mock_post.return_value.status_code = 200
    mock_post.return_value.content = b"fake_audio_bytes"
    
    # Set mock API key
    tts_engine.api_key = "test_key"
    
    result = tts_engine.generate_speech("Hello world", "voice_abc")
    
    assert result == b"fake_audio_bytes"
    mock_post.assert_called_once()
    assert "https://api.elevenlabs.io/v1/text-to-speech/voice_abc" in mock_post.call_args[0][0]
    
    # Verify payload
    payload = mock_post.call_args[1]["json"]
    assert payload["text"] == "Hello world"
    assert payload["model_id"] == "eleven_turbo_v2"

@patch("httpx.Client.post")
def test_generate_speech_api_failure(mock_post):
    """ElevenLabs returns 401 -> generate_speech() raises Exception."""
    mock_post.return_value.status_code = 401
    mock_post.return_value.text = "Unauthorized"
    
    # Set mock API key
    tts_engine.api_key = "test_key"
    
    with pytest.raises(Exception, match="ElevenLabs API Error: 401"):
        tts_engine.generate_speech("Hello", "bad_voice_id")
