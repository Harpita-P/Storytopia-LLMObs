"""
Cloud Storage Tool
Handles uploads and downloads from GCS
"""

import os
import uuid
from google.cloud import storage
from typing import Optional
import base64

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "storytopia-media-2025")

def get_storage_client():
    """Get or create storage client"""
    return storage.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))


def upload_to_gcs(file_data: bytes, filename: str, content_type: str = "image/png") -> str:
    """
    Uploads file to Google Cloud Storage
    Returns public URI
    """
    try:
        storage_client = get_storage_client()
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{filename}"
        blob = bucket.blob(unique_filename)
        
        # Upload with content type
        blob.upload_from_string(file_data, content_type=content_type)
        
        # Make publicly accessible
        blob.make_public()
        
        return blob.public_url
    except Exception as e:
        raise Exception(f"Failed to upload to GCS: {str(e)}")


def upload_base64_to_gcs(base64_data: str, filename: str, content_type: str = "image/png") -> str:
    """
    Uploads base64 encoded data to GCS
    Returns public URI
    """
    try:
        # Remove data URL prefix if present
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        
        # Decode base64
        file_data = base64.b64decode(base64_data)
        
        return upload_to_gcs(file_data, filename, content_type)
    except Exception as e:
        raise Exception(f"Failed to upload base64 to GCS: {str(e)}")


def download_from_gcs(uri: str) -> bytes:
    """
    Downloads file from Google Cloud Storage
    Returns file data
    """
    try:
        storage_client = get_storage_client()
        # Extract bucket and blob name from URI
        if "storage.googleapis.com" in uri:
            parts = uri.split("/")
            bucket_name = parts[3]
            blob_name = "/".join(parts[4:])
        else:
            raise ValueError("Invalid GCS URI format")
        
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        
        return blob.download_as_bytes()
    except Exception as e:
        raise Exception(f"Failed to download from GCS: {str(e)}")
