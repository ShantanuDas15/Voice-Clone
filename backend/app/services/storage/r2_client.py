import boto3
from botocore.client import Config
from app.core.config import settings

class R2StorageClient:
    def __init__(self):
        # We only initialize if the variables are set
        if not settings.CLOUDFLARE_R2_ACCESS_KEY_ID:
            self.client = None
            return

        self.bucket_name = settings.CLOUDFLARE_R2_BUCKET_NAME
        
        self.client = boto3.client(
            's3',
            endpoint_url=settings.CLOUDFLARE_R2_ENDPOINT_URL,
            aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )

    def is_configured(self):
        return self.client is not None

    def upload_file_bytes(self, file_bytes: bytes, destination_path: str, content_type: str = "audio/mpeg") -> str:
        """
        Uploads file bytes directly to R2 and returns the path.
        """
        if not self.is_configured():
            raise ValueError("R2 Storage is not configured.")

        self.client.put_object(
            Bucket=self.bucket_name,
            Key=destination_path,
            Body=file_bytes,
            ContentType=content_type
        )
        return destination_path

    def get_presigned_url(self, object_path: str, expires_in: int = 3600) -> str:
        """
        Generates a presigned URL to securely download/stream an object.
        """
        if not self.is_configured():
            raise ValueError("R2 Storage is not configured.")

        url = self.client.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': object_path
            },
            ExpiresIn=expires_in
        )
        return url

# Singleton instance
r2_storage = R2StorageClient()
