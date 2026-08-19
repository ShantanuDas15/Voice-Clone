import pytest
from pydantic import ValidationError
from app.schemas.voice_schema import VoiceCreate

def test_voice_create_schema_valid():
    voice = VoiceCreate(name="My Custom Voice", description="A great voice")
    assert voice.name == "My Custom Voice"
    assert voice.description == "A great voice"

def test_voice_create_schema_missing_name():
    with pytest.raises(ValidationError):
        VoiceCreate(description="No name provided")

def test_voice_create_schema_name_too_short():
    with pytest.raises(ValidationError) as exc_info:
        VoiceCreate(name="")
    assert "String should have at least 1 character" in str(exc_info.value)

def test_voice_create_schema_name_too_long():
    with pytest.raises(ValidationError):
        VoiceCreate(name="A" * 101)

def test_voice_create_schema_description_too_long():
    with pytest.raises(ValidationError):
        VoiceCreate(name="Voice", description="A" * 501)
