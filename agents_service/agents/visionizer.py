"""
Visionizer Agent
Analyzes children's drawings using Gemini Vision API
Extracts characters, setting, and artistic style
Then generates a cute animated character using Imagen
"""

from google.adk.agents import LlmAgent
import sys
sys.path.append('..')
from tools.vision_tool import analyze_drawing, create_character_prompt
from tools.imagen_tool import generate_character_image


def analyze_and_generate_character(image_uri: str) -> str:
    """
    Tool function for ADK: Analyzes drawing and generates character
    
    Args:
        image_uri: GCS URI of the child's drawing
        
    Returns:
        JSON string with results
    """
    import json
    import traceback
    
    try:
        print(f"[Visionizer Tool] Starting analysis for: {image_uri}")
        
        # Step 1: Analyze the drawing
        print("[Visionizer Tool] Step 1: Analyzing drawing with Gemini Vision...")
        analysis = analyze_drawing(image_uri)
        print(f"[Visionizer Tool] Analysis complete: {analysis}")
        
        # Check if age-appropriate
        if not analysis.get("age_appropriate", True):
            return json.dumps({
                "success": False,
                "error": "Drawing contains inappropriate content",
                "analysis": analysis
            })
        
        # Step 2: Create character generation prompt
        print("[Visionizer Tool] Step 2: Creating character prompt...")
        character_prompt = create_character_prompt(analysis)
        print(f"[Visionizer Tool] Prompt created: {character_prompt[:100]}...")
        
        # Step 3: Generate character image
        print("[Visionizer Tool] Step 3: Generating character with Imagen...")
        character_image_uri = generate_character_image(character_prompt)
        print(f"[Visionizer Tool] Character generated: {character_image_uri}")
        
        result = {
            "success": True,
            "original_drawing_uri": image_uri,
            "analysis": analysis,
            "character_prompt": character_prompt,
            "generated_character_uri": character_image_uri,
            "character_type": analysis.get("character_type"),
            "character_description": analysis.get("character_description")
        }
        
        print(f"[Visionizer Tool] Success! Returning result")
        return json.dumps(result)
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"[Visionizer Tool] ERROR: {str(e)}")
        print(f"[Visionizer Tool] Traceback: {error_details}")
        return json.dumps({
            "success": False,
            "error": str(e),  # Just the error message, no exception type prefix
            "traceback": error_details
        })


# Create the Visionizer agent using ADK LlmAgent
visionizer_agent = LlmAgent(
    name="visionizer",
    model="gemini-2.0-flash-exp",
    description="Analyzes children's drawings and generates animated characters using Gemini Vision and Imagen",
    instruction="""
    You are the Visionizer agent in the Storytopia pipeline.
    
    Your role:
    1. Extract the image_uri from the user's message
    2. Call the analyze_and_generate_character tool with that image_uri
    3. Return ONLY the raw JSON result from the tool - no additional text, no prose, no explanation
    
    CRITICAL: Your response must be ONLY valid JSON. Do not add any conversational text like 
    "Here's the result" or "I hope you like it". Just return the JSON string from the tool directly.
    
    Example of CORRECT response:
    {"success": true, "analysis": {...}, "generated_character_uri": "gs://..."}
    
    Example of INCORRECT response:
    Here's the animated character! {"success": true, ...}
    
    When you receive a message with an image_uri:
    1. Extract the URI from the message
    2. Call analyze_and_generate_character(image_uri)
    3. Return the exact JSON string the tool returns, nothing else
    """,
    tools=[analyze_and_generate_character],
    output_key="visionizer_result"
)