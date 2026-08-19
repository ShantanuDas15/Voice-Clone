from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.exceptions import global_exception_handler
from app.core.exceptions import (
    global_exception_handler,
    value_error_handler,
    permission_error_handler,
    http_exception_handler,
    validation_exception_handler
)
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError


app = FastAPI(
    title="Voice Clone API",
    description="API for the Voice Clone platform",
    version="1.0.0",

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production to Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],


# Exception handlers
# Include main router
