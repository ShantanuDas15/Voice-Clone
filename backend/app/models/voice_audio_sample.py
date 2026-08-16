from sqlalchemy import Column, String, Integer, Numeric, DateTime, Boolean, text, ForeignKey, Index, SmallInteger, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class VoiceAudioSample(Base):
    __tablename__ = "voice_audio_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    voice_profile_id = Column(UUID(as_uuid=True), ForeignKey("voice_profiles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    r2_object_key = Column(String, unique=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(50), nullable=False)
    
    duration_sec = Column(Numeric(8, 2), nullable=True)
    sample_rate_hz = Column(Integer, nullable=True)
    channels = Column(SmallInteger, nullable=True)
    is_preprocessed = Column(Boolean, nullable=False, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("file_size_bytes > 0 AND file_size_bytes <= 52428800", name="chk_file_size"),
        CheckConstraint("mime_type IN ('audio/wav', 'audio/mpeg', 'audio/x-wav')", name="chk_mime_type"),
        Index('idx_voice_samples_profile_id', 'voice_profile_id', postgresql_where=text("deleted_at IS NULL")),
        Index('idx_voice_samples_user_id', 'user_id'),
    )
