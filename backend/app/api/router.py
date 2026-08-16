from fastapi import APIRouter
from app.api.routes import health, users, auth

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])

v1_router = APIRouter()
v1_router.include_router(auth.router, prefix="/auth", tags=["auth"])
v1_router.include_router(users.router, prefix="/users", tags=["users"])

api_router.include_router(v1_router, prefix="/api/v1")
