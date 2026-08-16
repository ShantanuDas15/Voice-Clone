import base64
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# Initialize Firebase Admin
def init_firebase():
    if not firebase_admin._apps:
        cred = None
        if settings.FIREBASE_SERVICE_ACCOUNT_KEY_B64:
            decoded = base64.b64decode(settings.FIREBASE_SERVICE_ACCOUNT_KEY_B64).decode("utf-8")
            cred_dict = json.loads(decoded)
            cred = credentials.Certificate(cred_dict)
        elif settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH:
            import os
            if os.path.exists(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH):
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
                
        if cred:
            firebase_admin.initialize_app(cred)
        else:
            print("WARNING: Firebase Admin SDK not initialized. Missing credentials.")

init_firebase()

security = HTTPBearer()

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verifies the Firebase JWT and returns the decoded token payload."""
    token = credentials.credentials
    try:
        # Verify the token against Firebase
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
