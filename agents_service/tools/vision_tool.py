"""
Vision Tool
Wrapper for Gemini Vision API to analyze images
"""

import os
import vertexai
from vertexai.generative_models import GenerativeModel, Part
from typing import Dict, Any
import json

_vertex_initialized = False

def ensure_vertexai_initialized():
    """Ensure Vertex AI is initialized"""
    global _vertex_initialized
    if not _vertex_initialized:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        vertexai.init(project=project_id, location=location)
        _vertex_initialized = True

def analyze_drawing(image_uri: str) -> Dict[str, Any]:
    """
    Analyzes a child's drawing using Gemini Vision via Vertex AI
    Returns structured data about characters, setting, and style
    """
    try:
        # Ensure Vertex AI is initialized
        ensure_vertexai_initialized()
        
        # Initialize Vertex AI Gemini model
        model = GenerativeModel('gemini-2.0-flash-exp')
        
        # Download image from URI
        from .storage_tool import download_from_gcs
        image_data = download_from_gcs(image_uri)
        
        # Create prompt for analysis
        prompt = """
        Analyze this child's drawing and extract the following information in JSON format:
        
        {
            "character_type": "what type of character is drawn (e.g., person, animal, creature)",
            "character_description": "detailed description of the character's appearance",
            "colors_used": ["list of main colors"],
            "artistic_style": "description of drawing style (e.g., crayon, pencil, marker)",
            "mood": "overall mood/feeling of the drawing",
            "age_appropriate": true/false,
            "details": "any other notable details"
        }
        
        Be creative and encouraging in your descriptions. This is for generating a cute animated character.
        """
        
        # Create image part for Vertex AI
        image_part = Part.from_data(data=image_data, mime_type="image/png")
        
        # Generate response
        response = model.generate_content([prompt, image_part])
        
        # Parse JSON response
        result_text = response.text.strip()
        
        # Extract JSON from markdown code blocks if present
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(result_text)
        
        return result
        
    except Exception as e:
        raise Exception(f"Failed to analyze drawing: {str(e)}")


def create_character_prompt(analysis: Dict[str, Any]) -> str:
    """
    Creates an Imagen prompt based on vision analysis
    Returns optimized prompt for character generation
    """
    character_type = analysis.get("character_type", "character")
    description = analysis.get("character_description", "")
    colors = ", ".join(analysis.get("colors_used", []))
    style = analysis.get("artistic_style", "cartoon")
    
    prompt = f"""
    Create a cute, friendly, animated {character_type} character for a children's story.
    
    Character details: {description}
    
    Style: Pixar-style 3D animation, colorful, child-friendly, expressive, appealing
    Colors: Incorporate {colors}
    Mood: Warm, inviting, magical
    
    The character should be:
    - Appropriate for children ages 4-10
    - Expressive and friendly
    - High quality, professional animation style
    - Standing in a neutral pose
    - On a simple, clean background
    
    Art style: Similar to Disney/Pixar animated films, vibrant colors, soft lighting
    """
    
    return prompt.strip()
