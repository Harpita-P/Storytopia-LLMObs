"""
Illustrator Agent
Generates scene illustrations for interactive story quests using Imagen
Creates 8 beautiful storybook-style images, one for each scene

The agent:
- Takes the quest structure from Quest-Creator
- Generates a detailed image for each of the 8 scenes
- Ensures visual consistency with the child's character
- Creates warm, colorful, child-friendly illustrations
"""

import os
import json
import sys
from typing import Dict, List, Any
from google.adk.agents import LlmAgent

sys.path.append('..')
from tools.imagen_tool import generate_scene_image


def generate_all_scene_illustrations(quest_json: str, character_description: str) -> str:
    """
    Tool function: Generates ONLY the first 4 scene illustrations
    Returns immediately so user can start playing
    Scenes 5-8 will have empty image_uri and load later
    
    Args:
        quest_json: JSON string of the quest data with 8 scenes
        character_description: Full character description for consistency
    
    Returns:
        JSON string with image URIs for first 4 scenes, empty for scenes 5-8
    """
    try:
        print(f"[Illustrator Tool] Starting illustration generation...")
        
        # Parse quest data
        quest_data = json.loads(quest_json)
        scenes = quest_data.get("scenes", [])
        
        if len(scenes) != 8:
            return json.dumps({
                "success": False,
                "error": f"Expected 8 scenes, got {len(scenes)}"
            })
        
        image_uris = []
        
        # Generate ONLY FIRST 4 scenes (for immediate return)
        print(f"[Illustrator Tool] ⚡ Generating scenes 1-4 for immediate playback...")
        for i, scene in enumerate(scenes[:4], 1):
            print(f"[Illustrator Tool] Generating scene {i}/8...")
            
            # Get the image prompt from the scene
            image_prompt = scene.get("image_prompt", "")
            
            # Enhance prompt with character description for consistency
            enhanced_prompt = f"{image_prompt}\n\nCharacter consistency note: {character_description}"
            
            try:
                # Generate the image
                image_uri = generate_scene_image(
                    prompt=enhanced_prompt,
                    character_description=character_description
                )
                
                image_uris.append({
                    "scene_number": i,
                    "image_uri": image_uri,
                    "prompt_used": image_prompt
                })
                
                print(f"[Illustrator Tool] ✅ Scene {i} complete: {image_uri}")
            except Exception as e:
                print(f"[Illustrator Tool] ⚠️ Scene {i} failed: {str(e)}")
                # Add placeholder for failed scene
                image_uris.append({
                    "scene_number": i,
                    "image_uri": "",
                    "prompt_used": image_prompt,
                    "error": str(e)
                })
        
        # Add EMPTY placeholders for scenes 5-8 (will be generated later)
        print(f"[Illustrator Tool] Adding placeholders for scenes 5-8 (will generate later)...")
        for i in range(5, 9):
            image_uris.append({
                "scene_number": i,
                "image_uri": "",  # Empty - will be generated later
                "prompt_used": scenes[i-1].get("image_prompt", "")
            })
        
        result = {
            "success": True,
            "character_description": character_description,
            "scene_images": image_uris,
            "total_scenes": len(image_uris),
            "partial": True,  # Indicates scenes 5-8 not yet generated
            "ready_scenes": 4  # First 4 scenes are ready
        }
        
        print(f"[Illustrator Tool] ✅ First 4 scenes complete! Returning to user NOW.")
        print(f"[Illustrator Tool] 💡 Scenes 5-8 will show loading state in UI.")
        return json.dumps(result)
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[Illustrator Tool] ERROR: {str(e)}")
        print(f"[Illustrator Tool] Traceback: {error_details}")
        return json.dumps({
            "success": False,
            "error": f"{type(e).__name__}: {str(e)}",
            "traceback": error_details
        })


# Illustrator Agent Configuration
illustrator_instruction = """
You are the Illustrator agent. Your ONLY job is to call the generate_all_scene_illustrations tool function.

CRITICAL INSTRUCTIONS:
1. You MUST call the generate_all_scene_illustrations function
2. You MUST NOT generate fake image URLs
3. You MUST NOT return JSON without calling the tool first

PROCESS:
1. Extract the quest JSON string from the user's message
2. Extract the character description from the user's message
3. CALL generate_all_scene_illustrations(quest_json, character_description)
4. Wait for the tool to return real image URLs
5. Return ONLY the tool's response

DO NOT:
- Generate placeholder URLs like "https://storage.googleapis.com/show-me-staging/..."
- Create fake JSON responses
- Skip calling the tool function

YOU MUST CALL THE TOOL FUNCTION. The tool will generate REAL images using Imagen API.
"""

# Create Illustrator Agent
illustrator_agent = LlmAgent(
    name="illustrator",
    model="gemini-2.0-flash-exp",
    description="Generates 8 storybook-style scene illustrations using Imagen with character consistency",
    instruction=illustrator_instruction,
    tools=[generate_all_scene_illustrations],
    output_key="illustration_result"
)
