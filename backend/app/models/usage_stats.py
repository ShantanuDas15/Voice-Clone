from sqlalchemy import Column, Integer, Numeric, DateTime, text, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class UserUsageStats(Base):
    __tablename__ = "user_usage_stats"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    total_generations = Column(Integer, nullable=False, default=0)
    total_voice_profiles = Column(Integer, nullable=False, default=0)
    total_audio_uploads = Column(Integer, nullable=False, default=0)
    
    total_output_seconds = Column(Numeric(12, 2), nullable=False, default=0.00)
    storage_used_bytes = Column(BigInteger, nullable=False, default=0)
    
    generations_this_month = Column(Integer, nullable=False, default=0)
    chars_generated_this_month = Column(BigInteger, nullable=False, default=0)
    last_reset_at = Column(DateTime(timezone=True), server_default=text("date_trunc('month', NOW())"), nullable=False)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
