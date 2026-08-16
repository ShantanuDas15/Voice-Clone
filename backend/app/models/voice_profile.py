import enum
from sqlalchemy import Column, String, Numeric, DateTime, Enum, text, ForeignKey, Index, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class VoiceProfileStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"
    archived = "archived"

class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    
    embedding_r2_path = Column(String, nullable=True)
    status = Column(Enum(VoiceProfileStatus, name="voice_profile_status"), nullable=False, default=VoiceProfileStatus.pending)
    processing_error = Column(String, nullable=True)
    
    sample_count = Column(SmallInteger, nullable=False, default=0)
    total_duration_sec = Column(Numeric(8, 2), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index('idx_voice_profiles_user_id', 'user_id', postgresql_where=text("deleted_at IS NULL")),
        Index('idx_voice_profiles_status', 'status'),
        Index('idx_voice_profiles_user_status', 'user_id', 'status', postgresql_where=text("deleted_at IS NULL")),
    )
