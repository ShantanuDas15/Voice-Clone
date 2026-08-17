from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_KEY_B64: Optional[str] = None
    
    CLOUDFLARE_R2_ACCESS_KEY_ID: Optional[str] = None
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: Optional[str] = None
    CLOUDFLARE_R2_BUCKET_NAME: Optional[str] = None
    CLOUDFLARE_R2_ENDPOINT_URL: Optional[str] = None
    
    ELEVENLABS_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file="../.env", # Path relative to where we run uvicorn in dev
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
