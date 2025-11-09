"""
Imagen Tool
Generates image frames for story scenes using Vertex AI Imagen
"""

import os
import base64
from google.cloud import aiplatform
from vertexai.preview.vision_models import ImageGenerationModel
from typing import Optional
from .storage_tool import upload_to_gcs

_initialized = False

def ensure_vertex_ai_initialized():
    """Lazy initialize Vertex AI"""
    global _initialized
    if not _initialized:
        PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
        LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        aiplatform.init(project=PROJECT_ID, location=LOCATION)
        _initialized = True


def generate_character_image(prompt: str, negative_prompt: Optional[str] = None) -> str:
    """
    Generates a character image using Imagen 3.0
    Returns GCS URI of generated image
    """
    try:
        # Ensure Vertex AI is initialized
        ensure_vertex_ai_initialized()
        
        # Initialize Imagen model
        model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
        
        # Set default negative prompt for child-safe content
        # Note: Mild sadness/crying is OK for teaching empathy
        if negative_prompt is None:
            negative_prompt = "violence, weapons, fighting, blood, gore, death, killing, scary monsters, horror, adult content, sexual content, drugs, alcohol"
        
        # Generate image with retry logic for rate limits
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                images = model.generate_images(
                    prompt=prompt,
                    number_of_images=1,
                    negative_prompt=negative_prompt,
                    aspect_ratio="1:1",
                    safety_filter_level="block_some",
                    person_generation="allow_adult"
                )
                break  # Success
            except Exception as api_error:
                error_str = str(api_error)
                if "429" in error_str or "Resource exhausted" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        import time
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"[Imagen Tool] Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(f"Rate limit exceeded after {max_retries} attempts. Please wait a few minutes and try again.")
                else:
                    raise
        
        # Get the first generated image
        generated_image = images[0]
        
        # Convert to bytes
        image_bytes = generated_image._image_bytes
        
        # Upload to GCS
        image_uri = upload_to_gcs(
            file_data=image_bytes,
            filename="character.png",
            content_type="image/png"
        )
        
        return image_uri
        
    except Exception as e:
        raise Exception(f"Failed to generate character image: {str(e)}")


def generate_scene_image(prompt: str, character_description: Optional[str] = None) -> str:
    """
    Generates a scene/setting image using Imagen 3.0
    Returns GCS URI of generated image
    """
    try:
        # Ensure Vertex AI is initialized
        ensure_vertex_ai_initialized()
        
        model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
        
        # Enhance prompt with character if provided
        if character_description:
            full_prompt = f"{prompt}\n\nInclude this character: {character_description}"
        else:
            full_prompt = prompt
        
        # Generate image with retry logic for rate limits
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                images = model.generate_images(
                    prompt=full_prompt,
                    number_of_images=1,
                    negative_prompt="violence, weapons, fighting, blood, gore, death, killing, scary monsters, horror, adult content",
                    aspect_ratio="16:9",
                    safety_filter_level="block_some"
                )
                
                # Check if images were actually generated
                # Note: images is an ImageGenerationResponse object, not a list
                if not images:
                    raise Exception("Imagen returned no images. This may be due to safety filters blocking the content.")
                
                break  # Success
            except Exception as api_error:
                error_str = str(api_error)
                if "429" in error_str or "Resource exhausted" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    if attempt < max_retries - 1:
                        import time
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"[Imagen Tool] Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise Exception(f"Rate limit exceeded after {max_retries} attempts. Please wait a few minutes and try again.")
                else:
                    raise
        
        generated_image = images[0]
        image_bytes = generated_image._image_bytes
        
        # Upload to GCS
        image_uri = upload_to_gcs(
            file_data=image_bytes,
            filename="scene.png",
            content_type="image/png"
        )
        
        return image_uri
        
    except Exception as e:
        raise Exception(f"Failed to generate scene image: {str(e)}")
