from sqlalchemy import text
from app.db.session import engine
from app.services.storage_service import storage_service
import time

def test_postgres():
    print("\n--- Testing PostgreSQL Connection ---")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print(f"✅ DB Connection Successful! Result: {result.scalar()}")
    except Exception as e:
        print(f"❌ DB Connection Failed: {e}")

def test_minio():
    print("\n--- Testing MinIO Connection ---")
    test_key = "test_artifact.json"
    test_data = {"message": "Hello MinIO!"}
    
    try:
        # Test Upload
        print(f"Uploading {test_key}...")
        if storage_service.upload_json(test_key, test_data):
            print("✅ Upload Successful.")
        else:
            print("❌ Upload Failed.")
            return

        # Test Download
        print(f"Downloading {test_key}...")
        downloaded_data = storage_service.get_json(test_key)
        if downloaded_data == test_data:
            print(f"✅ Download Successful & Verified: {downloaded_data}")
        else:
            print(f"❌ Data Verification Failed: {downloaded_data}")

    except Exception as e:
        print(f"❌ MinIO Error: {e}")

if __name__ == "__main__":
    # Give Docker a moment to spin up if just started
    print("Waiting 5s for services to warm up...")
    time.sleep(5)
    test_postgres()
    test_minio()
