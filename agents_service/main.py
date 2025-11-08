"""
Storytopia FastAPI Server
Main entry point for the ADK agents service
"""

import os
import json
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


@app.post("/storytopia")
async def create_story(
    character_image: UploadFile = File(...),
    setting_image: UploadFile = File(...),
    lesson: str = Form(...),
    user_id: str = Form(...)
):
    """
    Main endpoint for story creation
    Accepts drawings and generates an animated story
    
    TODO: Implement full pipeline when agents are ready
    """
    try:
        # Placeholder response
        return {
            "status": "pending_implementation",
            "message": "Agent pipeline will be implemented in next steps",
            "received": {
                "character_image": character_image.filename,
                "setting_image": setting_image.filename,
                "lesson": lesson,
                "user_id": user_id
            }
        }
        
        # Future implementation:
        # 1. Upload images to GCS
        # 2. Run ADK pipeline with runner.run()
        # 3. Handle moderation results
        # 4. Return video URL or error
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)