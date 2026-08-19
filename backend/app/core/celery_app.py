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
    # Suppress CPendingDeprecationWarning in Celery 5.x
    broker_connection_retry_on_startup=True,
)

# Auto-discover tasks from our services module
celery_app.autodiscover_tasks(["app.services.audio"])
