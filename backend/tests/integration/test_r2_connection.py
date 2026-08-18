import pytest
import uuid
import requests
from app.services.storage.r2_client import r2_storage

@pytest.mark.skipif(not r2_storage.is_configured(), reason="R2 credentials not configured in environment")
def test_r2_upload_and_presigned_url():
    """
    Smoke test to verify Cloudflare R2 connectivity.
    Uploads a small text file as bytes, generates a presigned URL,
    and fetches it via requests to ensure it was saved correctly.
    """
    test_content = b"Integration test content for R2"
    test_key = f"test/smoke_test_{uuid.uuid4().hex}.txt"

    try:
        # 1. Upload
        uploaded_path = r2_storage.upload_file_bytes(test_content, test_key, content_type="text/plain")
        assert uploaded_path == test_key

        # 2. Generate presigned URL
        presigned_url = r2_storage.get_presigned_url(test_key, expires_in=60)
        assert presigned_url is not None
        assert presigned_url.startswith("http")

        # 3. Fetch from URL and verify content
        response = requests.get(presigned_url)
        assert response.status_code == 200
        assert response.content == test_content
        
    finally:
        # 4. Cleanup (Best effort delete)
        if r2_storage.is_configured():
            try:
                r2_storage.client.delete_object(
                    Bucket=r2_storage.bucket_name,
                    Key=test_key
                )
            except Exception as e:
                print(f"Cleanup failed for {test_key}: {e}")
