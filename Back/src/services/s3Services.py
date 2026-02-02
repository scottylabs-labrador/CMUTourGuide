# s3_service.py
import boto3
import base64
import io
import os
import uuid
from datetime import datetime

# Initialize client once (reads env vars automatically)
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "us-east-1")
)

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

def upload_interaction(image_base64: str, building_name: str, confidence: float):
    """
    Decodes and uploads the image to S3 'inbox'.
    This is a synchronous function, which is perfect for FastAPI BackgroundTasks
    (FastAPI automatically runs sync background tasks in a separate thread).
    """
    if not S3_BUCKET_NAME:
        print("⚠️ S3_BUCKET_NAME not set. Skipping upload.")
        return

    try:
        # 1. Decode
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        image_data = base64.b64decode(image_base64)

        # 2. Filename: inbox/0.95_WeanHall_20260202_uuid.jpg
        # Allows for easy sorting by confidence later
        safe_name = building_name.replace(" ", "")
        timestamp = datetime.now().strftime("%Y%m%d")
        unique_id = uuid.uuid4().hex[:8]
        
        filename = f"inbox/{confidence:.2f}_{safe_name}_{timestamp}_{unique_id}.jpg"

        # 3. Upload
        s3_client.upload_fileobj(
            io.BytesIO(image_data),
            S3_BUCKET_NAME,
            filename,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        print(f"☁️  Captured to S3: {filename}")

    except Exception as e:
        # Catch errors silently so we never crash the user's request
        print(f"⚠️ S3 Upload Failed: {e}")