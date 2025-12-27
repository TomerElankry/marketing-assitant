import boto3
import json
from botocore.exceptions import ClientError
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY
        )
        self.bucket_name = "marketing-artifacts"
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
            except ClientError as e:
                print(f"Could not create bucket: {e}")

    def upload_json(self, key: str, data: dict):
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(data),
                ContentType='application/json'
            )
            return True
        except ClientError as e:
            print(f"Upload failed: {e}")
            return False

    def upload_file(self, key: str, file_path: str, content_type: str = 'application/octet-stream'):
        try:
            self.s3_client.upload_file(
                Filename=file_path,
                Bucket=self.bucket_name,
                Key=key,
                ExtraArgs={'ContentType': content_type}
            )
            return True
        except ClientError as e:
            print(f"File upload failed: {e}")
            return False

    def get_json(self, key: str) -> dict:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return json.loads(response['Body'].read().decode('utf-8'))
        except ClientError as e:
            print(f"Download failed: {e}")
            return None

storage_service = StorageService()
