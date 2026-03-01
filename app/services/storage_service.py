import json
import logging

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in ("404", "NoSuchBucket"):
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Created storage bucket '{self.bucket_name}'")
                except ClientError as create_err:
                    logger.error(f"Could not create bucket '{self.bucket_name}': {create_err}")
            else:
                logger.error(f"Unexpected error checking bucket '{self.bucket_name}': {e}")

    def upload_json(self, key: str, data: dict) -> bool:
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(data),
                ContentType="application/json",
            )
            return True
        except ClientError as e:
            logger.error(f"JSON upload failed for key '{key}': {e}")
            return False

    def upload_file(self, key: str, file_path: str, content_type: str = "application/octet-stream") -> bool:
        try:
            self.s3_client.upload_file(
                Filename=file_path,
                Bucket=self.bucket_name,
                Key=key,
                ExtraArgs={"ContentType": content_type},
            )
            return True
        except ClientError as e:
            logger.error(f"File upload failed for key '{key}': {e}")
            return False

    def get_json(self, key: str) -> dict | None:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return json.loads(response["Body"].read().decode("utf-8"))
        except ClientError as e:
            logger.error(f"JSON download failed for key '{key}': {e}")
            return None

    def get_file_stream(self, key: str):
        """Returns a streaming body for the given key, or None if not found."""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response["Body"]
        except ClientError as e:
            logger.error(f"File stream download failed for key '{key}': {e}")
            return None


storage_service = StorageService()
