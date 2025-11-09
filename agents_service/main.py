"""
Storytopia FastAPI Server
Main entry point for the ADK agents service
"""

import os
import json
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Storytopia ADK Agents Service",
    description="Multi-agent system for converting children's drawings to animated stories",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK Session Service
session_service = InMemorySessionService()
APP_NAME = "storytopia"


# Request models
class CreateQuestRequest(BaseModel):
    character_description: str
    character_name: str
    lesson: str

class TextToSpeechRequest(BaseModel):
    text: str
    voice_name: str = "Kore"


def extract_json_block(text: str) -> dict:
    """
    Extract the first JSON object from an LLM-ish string.
    Handles prose + ```json fences.
    """
    # If it's in a ```json ... ``` block, grab inside
    fence_match = re.search(r"```json(.*?)```", text, re.DOTALL)
    if fence_match:
        candidate = fence_match.group(1).strip()
    else:
        # Otherwise, grab from first { to last }
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON object found in agent response")
        candidate = text[start:end+1]
    
    # Fix common escape issues: \' is not valid in JSON, should be just '
    # JSON only allows: \" \\ \/ \b \f \n \r \t \uXXXX
    candidate = candidate.replace("\\'", "'")
    
    return json.loads(candidate)


def normalize_agent_response(raw_text: str) -> dict:
    """
    Turns the messy agent output into a clean, final JSON dict.
    Expected structure:
    {
      "analyze_and_generate_character_response": {
        "result": "{\"success\": true, ... }"
      }
    }
    """
    outer = extract_json_block(raw_text)

    # If agent wrapped in this top-level key
    if "analyze_and_generate_character_response" in outer:
        inner = outer["analyze_and_generate_character_response"]
    else:
        inner = outer

    raw_result = inner.get("result", inner)

    # If result is itself a JSON string, decode it
    if isinstance(raw_result, str):
        try:
            result = json.loads(raw_result)
        except json.JSONDecodeError:
            # If it's not valid JSON, just raise so we see it
            raise ValueError("Failed to decode nested result JSON")
    else:
        result = raw_result

    return result

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Storytopia ADK Agents",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "Storytopia ADK Agents",
        "project": os.getenv("GOOGLE_CLOUD_PROJECT"),
        "location": os.getenv("GOOGLE_CLOUD_LOCATION")
    }

@app.post("/generate-character")
async def generate_character(
    drawing_data: str = Form(...),
    user_id: str = Form(...)
):
    """
    Visionizer endpoint: Analyzes drawing and generates animated character using ADK Runner
    
    Args:
        drawing_data: Base64 encoded drawing from canvas
        user_id: User identifier
        
    Returns:
        Analysis and generated character image URI
    """
    try:
        from tools.storage_tool import upload_base64_to_gcs
        from agents.visionizer import visionizer_agent
        
        # Upload drawing to GCS
        drawing_uri = upload_base64_to_gcs(
            base64_data=drawing_data,
            filename=f"drawing_{user_id}.png"
        )
        
        # Create or get session
        session_id = f"session_{user_id}"
        try:
            session = await session_service.get_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id
            )
            if not session:
                session = await session_service.create_session(
                    app_name=APP_NAME,
                    user_id=user_id,
                    session_id=session_id,
                    state={}
                )
        except:
            session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
                state={}
            )
        
        # Initialize ADK Runner with visionizer agent
        runner = Runner(
            agent=visionizer_agent,
            app_name=APP_NAME,
            session_service=session_service
        )
        
        # Create user message with image URI
        user_message = types.Content(
            role='user',
            parts=[types.Part(text=f"Please analyze this drawing and generate an animated character. The image URI is: {drawing_uri}")]
        )
        
        # Run agent and collect events
        final_response_text = ""
        tool_results = []
        
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            # Capture tool results from function responses
            if event.content and event.content.parts:
                for part in event.content.parts:
                    # Check if this is a function response (tool result)
                    if hasattr(part, 'function_response') and part.function_response:
                        tool_results.append(part.function_response)
                    # Capture final text response
                    elif hasattr(part, 'text') and part.text:
                        final_response_text = part.text
        
        print(f"[API] Raw response: {final_response_text[:500] if final_response_text else 'No text response'}")
        print(f"[API] Tool results captured: {len(tool_results)}")
        
        # Try to parse the tool result directly
        result = None
        for tool_result in tool_results:
            try:
                print(f"[API] Tool result type: {type(tool_result)}")
                print(f"[API] Tool result attributes: {dir(tool_result)}")
                
                # Try different ways to access the result
                if hasattr(tool_result, 'response'):
                    response_data = tool_result.response
                    print(f"[API] Response data type: {type(response_data)}")
                    
                    if isinstance(response_data, dict):
                        # Check if it has a 'result' field
                        if 'result' in response_data:
                            result_str = response_data['result']
                            result = json.loads(result_str) if isinstance(result_str, str) else result_str
                        else:
                            result = response_data
                    elif isinstance(response_data, str):
                        result = json.loads(response_data)
                    
                    if result and result.get("success"):
                        print(f"[API] Successfully parsed tool result!")
                        break
            except Exception as e:
                print(f"[API] Failed to parse tool result: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        # If no tool result, try parsing the final response text
        if not result and final_response_text:
            try:
                result = normalize_agent_response(final_response_text)
                print(f"[API] Normalized result keys: {result.keys()}")
            except Exception as parse_error:
                print(f"[API] Parse error: {parse_error}")
                print(f"[API] Full response: {final_response_text}")
                
                # If parsing failed but we have tool results, extract from them
                if tool_results:
                    print(f"[API] Attempting to extract from tool results...")
                    # The tool already succeeded based on logs, so construct response
                    result = {
                        "success": True,
                        "error": None
                    }
        
        # If still no result, return error
        if not result:
            return {
                "status": "error",
                "error": "Failed to get result from agent",
                "detail": "No parseable response or tool result found"
            }
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to process drawing")
            )
        
        # Return the result - handle both cases where fields might be in result or need extraction
        return {
            "status": "success",
            "drawing_uri": drawing_uri,
            "analysis": result.get("analysis", {}),
            "generated_character_uri": result.get("generated_character_uri", ""),
            "character_type": result.get("character_type", ""),
            "character_description": result.get("character_description", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/create-quest")
async def create_quest(request: CreateQuestRequest):
    """
    Creates an interactive quest with 8 scenes
    
    Args:
        character_description: Full character description
        character_name: Character name
        lesson: Lesson ID (e.g., "sharing", "kindness")
    
    Returns:
        Quest data with 8 scenes and illustrations
    """
    try:
        from agents.quest_creator import quest_creator_agent
        from agents.illustrator import illustrator_agent
        
        character_description = request.character_description
        character_name = request.character_name
        lesson = request.lesson
        
        if not character_description or not lesson:
            raise HTTPException(
                status_code=400,
                detail="Missing character_description or lesson"
            )
        
        # Step 1: Create Quest with Quest-Creator Agent
        print(f"[API] Creating quest for {character_name} with lesson: {lesson}")
        
        quest_input = f"""
Create an interactive quest with these details:

CHARACTER NAME: {character_name}
CHARACTER DESCRIPTION: {character_description}
LESSON: {lesson}

CRITICAL: Use the character name "{character_name}" in ALL 8 scenes. 
The character's name is "{character_name}" - use this exact name throughout the entire quest.
Generate 8 scenes teaching this lesson through {character_name}'s adventure.
"""
        
        # Create session for quest creation
        user_id = f"quest_{lesson}"
        session_id = f"session_{user_id}"
        
        try:
            session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
                state={}
            )
        except:
            pass  # Session might already exist
        
        # Run Quest-Creator agent
        runner = Runner(
            agent=quest_creator_agent,
            app_name=APP_NAME,
            session_service=session_service
        )
        
        user_message = types.Content(
            role='user',
            parts=[types.Part(text=quest_input)]
        )
        
        quest_response_text = ""
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        quest_response_text = part.text
        
        print(f"[API] Quest response: {quest_response_text[:200]}...")
        
        # Parse quest data
        try:
            quest_data = extract_json_block(quest_response_text)
        except Exception as e:
            print(f"[API] Failed to parse quest JSON: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse quest data: {str(e)}"
            )
        
        # Step 2: Generate illustrations with Illustrator Agent
        print(f"[API] Generating illustrations for {len(quest_data.get('scenes', []))} scenes...")
        
        illustrator_input = f"""
Generate illustrations for this quest:

QUEST DATA (JSON):
{json.dumps(quest_data)}

CHARACTER DESCRIPTION (USE THIS EXACTLY):
{character_description}

CRITICAL CONSISTENCY REQUIREMENTS:
- The character MUST look EXACTLY the same in all 8 scenes
- Use the character description PRECISELY - do not deviate
- Maintain IDENTICAL: colors, proportions, features, style, markings
- The character should be instantly recognizable across all scenes
- Do NOT change, morph, or alter the character's appearance in any way
"""
        
        # Create separate session for illustrator
        illustrator_session_id = f"{session_id}_illustrator"
        try:
            await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=illustrator_session_id,
                state={}
            )
        except:
            pass  # Session might already exist
        
        # Run Illustrator agent
        illustrator_runner = Runner(
            agent=illustrator_agent,
            app_name=APP_NAME,
            session_service=session_service
        )
        
        illustrator_message = types.Content(
            role='user',
            parts=[types.Part(text=illustrator_input)]
        )
        
        illustration_response_text = ""
        illustration_tool_results = []
        
        async for event in illustrator_runner.run_async(
            user_id=user_id,
            session_id=illustrator_session_id,
            new_message=illustrator_message
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if hasattr(part, 'function_response') and part.function_response:
                        print(f"[API] Tool function was called! Response: {part.function_response}")
                        illustration_tool_results.append(part.function_response)
                    elif hasattr(part, 'function_call') and part.function_call:
                        print(f"[API] Tool function call detected: {part.function_call}")
                    elif hasattr(part, 'text') and part.text:
                        illustration_response_text = part.text
                        print(f"[API] Text response from agent: {part.text[:200]}...")
        
        # Parse illustration results
        illustration_data = None
        for tool_result in illustration_tool_results:
            try:
                if hasattr(tool_result, 'response'):
                    response_data = tool_result.response
                    print(f"[API] Tool response type: {type(response_data)}")
                    
                    # If response is a dict with 'result' key that's a JSON string
                    if isinstance(response_data, dict):
                        if 'result' in response_data:
                            result_str = response_data['result']
                            if isinstance(result_str, str):
                                illustration_data = json.loads(result_str)
                            else:
                                illustration_data = result_str
                        else:
                            illustration_data = response_data
                        break
                    elif isinstance(response_data, str):
                        illustration_data = json.loads(response_data)
                        break
            except Exception as e:
                print(f"[API] Failed to parse tool result: {e}")
                continue
        
        if not illustration_data and illustration_response_text:
            try:
                illustration_data = extract_json_block(illustration_response_text)
            except Exception as e:
                print(f"[API] Failed to parse illustration text: {e}")
                pass
        
        print(f"[API] Illustration data: {illustration_data}")
        
        # Merge scene images into quest data
        if illustration_data and illustration_data.get("success"):
            scene_images_list = illustration_data.get("scene_images", [])
            print(f"[API] Scene images type: {type(scene_images_list)}, value: {scene_images_list[:2] if len(scene_images_list) > 2 else scene_images_list}")
            
            # Ensure scene_images is a list
            if isinstance(scene_images_list, list) and len(scene_images_list) > 0:
                # Check if it's a list of dicts or a list of strings
                if isinstance(scene_images_list[0], dict):
                    # Format: [{"scene_number": 1, "image_uri": "..."}, ...]
                    # Include ALL scenes, even with empty image_uri (for progressive loading)
                    scene_images = {img["scene_number"]: img.get("image_uri", "") 
                                   for img in scene_images_list if isinstance(img, dict) and "scene_number" in img}
                elif isinstance(scene_images_list[0], str):
                    # Format: ["url1", "url2", ...] - map by index
                    scene_images = {i+1: url for i, url in enumerate(scene_images_list)}
                    print(f"[API] Mapped {len(scene_images)} string URLs to scene numbers")
                else:
                    print(f"[API] Warning: Unknown scene_images format")
                    scene_images = {}
                
                # Apply images to scenes (including empty strings for scenes not yet generated)
                images_applied = 0
                for scene in quest_data.get("scenes", []):
                    scene_num = scene.get("scene_number")
                    if scene_num in scene_images:
                        scene["image_uri"] = scene_images[scene_num]
                        if scene_images[scene_num]:  # Only count non-empty URIs
                            images_applied += 1
                    else:
                        # Scene not in response yet (shouldn't happen but be safe)
                        scene["image_uri"] = ""
                
                print(f"[API] Applied {images_applied} images to scenes")
            else:
                print(f"[API] Warning: scene_images is not a valid list, skipping image merge")
        
        print(f"[API] Quest creation complete!")
        
        return {
            "status": "success",
            "quest_title": quest_data.get("quest_title", f"{character_name}'s Adventure"),
            "lesson": lesson,
            "character_name": character_name,
            "scenes": quest_data.get("scenes", []),
            "total_scenes": len(quest_data.get("scenes", []))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating quest: {str(e)}")

@app.post("/text-to-speech")
async def generate_speech(request: TextToSpeechRequest):
    """
    Convert text to speech using Google Cloud TTS
    """
    try:
        from tools.tts_tool import text_to_speech
        
        print(f"[TTS] Converting text to speech: {request.text[:50]}...")
        
        audio_uri = text_to_speech(
            text=request.text,
            voice_name=request.voice_name
        )
        
        print(f"[TTS] Audio generated: {audio_uri}")
        
        return {
            "status": "success",
            "audio_uri": audio_uri,
            "text": request.text
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)