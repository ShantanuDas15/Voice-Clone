import pytest
from pydantic import ValidationError
from app.schemas.generation_schema import GenerateRequest

def test_generate_request_schema_valid():
    req = GenerateRequest(text="Hello world", voice_id="test-voice-123", is_custom_voice=True)
    assert req.text == "Hello world"
    assert req.voice_id == "test-voice-123"
    assert req.is_custom_voice is True

def test_generate_request_schema_missing_voice_id():
    with pytest.raises(ValidationError):
        GenerateRequest(text="Hello world")

def test_generate_request_schema_text_too_short():
    with pytest.raises(ValidationError):
        GenerateRequest(text="", voice_id="test-voice-123")

def test_generate_request_schema_text_too_long():
    with pytest.raises(ValidationError):
        GenerateRequest(text="A" * 5001, voice_id="test-voice-123")
