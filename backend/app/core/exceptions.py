from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

def generate_error_response(detail: str, code: str, status_code: int = 500) -> JSONResponse:
    """Standardized error response format for the API."""
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": detail,
            "code": code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return generate_error_response(
        detail="An unexpected error occurred.",
        code="INTERNAL_SERVER_ERROR",
        status_code=500
    )

async def value_error_handler(request: Request, exc: ValueError):
    return generate_error_response(
        detail=str(exc),
        code="VALIDATION_ERROR",
        status_code=400
    )

async def permission_error_handler(request: Request, exc: PermissionError):
    return generate_error_response(
        detail=str(exc),
        code="FORBIDDEN",
        status_code=403
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return generate_error_response(
        detail=exc.detail,
        code="HTTP_ERROR",
        status_code=exc.status_code
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return generate_error_response(
        detail="Invalid request parameters.",
        code="UNPROCESSABLE_ENTITY",
        status_code=422
    )
