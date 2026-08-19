from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

from app.api.router import api_router
from app.core.exceptions import (
    global_exception_handler,
    value_error_handler,
    permission_error_handler,
    http_exception_handler,
    validation_exception_handler
)

app = FastAPI(
    title="Voice Clone API",
    description="API for the Voice Clone platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(ValueError, value_error_handler)
app.add_exception_handler(PermissionError, permission_error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(api_router)
