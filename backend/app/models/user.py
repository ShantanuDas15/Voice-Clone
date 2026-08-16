import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class AuthProvider(enum.Enum):
    email = "email"
    google = "google"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    auth_provider = Column(Enum(AuthProvider, name="auth_provider"), nullable=False, default=AuthProvider.email)
    
    email = Column(String(320), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=True)
    avatar_url = Column(String, nullable=True)
    
    is_active = Column(Boolean, nullable=False, default=True)
    is_email_verified = Column(Boolean, nullable=False, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index('idx_users_active', 'is_active', postgresql_where=text("deleted_at IS NULL")),
    )
