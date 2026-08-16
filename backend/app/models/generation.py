import enum
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Enum, text, ForeignKey, Index, SmallInteger, CheckConstraint, Computed
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class GenerationStatus(enum.Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class GenerationHistory(Base):
    __tablename__ = "generation_history"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    voice_profile_id = Column(UUID(as_uuid=True), ForeignKey("voice_profiles.id", ondelete="SET NULL"), nullable=True)
    
    celery_task_id = Column(String(255), unique=True, nullable=True)
    status = Column(Enum(GenerationStatus, name="generation_status"), nullable=False, default=GenerationStatus.queued)
    
    input_text = Column(String, nullable=False)
    input_text_length = Column(Integer, Computed('char_length(input_text)', persisted=True))
    
    output_r2_path = Column(String, nullable=True)
    output_duration_sec = Column(Numeric(8, 2), nullable=True)
    
    error_message = Column(String, nullable=True)
    retry_count = Column(SmallInteger, nullable=False, default=0)
    
    queued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("char_length(input_text) BETWEEN 1 AND 5000", name="chk_input_text_length"),
        CheckConstraint("retry_count >= 0 AND retry_count <= 5", name="chk_retry_count"),
        Index('idx_gen_history_user_id', 'user_id', 'created_at'),
        Index('idx_gen_history_voice_profile', 'voice_profile_id'),
        Index('idx_gen_history_celery_task', 'celery_task_id'),
        Index('idx_gen_history_status', 'status', postgresql_where=text("status IN ('queued', 'processing')")),
        Index('idx_gen_history_user_status', 'user_id', 'status'),
    )
