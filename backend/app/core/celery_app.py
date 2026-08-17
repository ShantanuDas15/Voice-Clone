import os
from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "voice_clone_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Example task routing for Phase 2:
    # task_routes={
    #     "app.services.audio.tasks.*": {"queue": "audio_processing"},
    # }
)

# Optional: Auto-discover tasks once we create them
# celery_app.autodiscover_tasks(["app.services.audio"])
