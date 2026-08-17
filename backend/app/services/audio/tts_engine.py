import httpx
from fastapi import HTTPException
from app.core.config import settings

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

class ElevenLabsClient:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def is_configured(self):
        return self.api_key is not None

    async def generate_speech(self, text: str, voice_id: str) -> bytes:
        """
        Generates speech using the ElevenLabs API and returns the audio bytes.
        """
        if not self.is_configured():
            raise ValueError("ElevenLabs API Key is not configured.")

        url = f"{ELEVENLABS_API_URL}/text-to-speech/{voice_id}"
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1", # or eleven_multilingual_v2
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers, timeout=60.0)
            
            if response.status_code != 200:
                raise Exception(f"ElevenLabs API Error: {response.status_code} - {response.text}")
                
            return response.content

    async def get_voices(self) -> list[dict]:
        """
        Retrieves all voices available to the user (including custom cloned voices).
        """
        if not self.is_configured():
            return []

        url = f"{ELEVENLABS_API_URL}/voices"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 200:
                return response.json().get("voices", [])
            return []

tts_engine = ElevenLabsClient()
