"""
Storytopia Orchestrator
Coordinates all agents in the pipeline:
1. Visionizer - Analyzes drawing and generates character
2. Quest-Creator - Creates 8-scene interactive quest
3. Illustrator - Generates 8 scene illustrations

Usage:
    from orchestrator import create_storytopia_quest
    
    result = create_storytopia_quest(
        drawing_uri="gs://bucket/drawing.png",
        lesson="sharing my toys"
    )
"""

import json
from typing import Dict, Any
from agents.visionizer import visionizer_agent
from agents.quest_creator import quest_creator_agent
from agents.illustrator import illustrator_agent


def create_storytopia_quest(drawing_uri: str, lesson: str) -> Dict[str, Any]:
    """
    Complete pipeline to create an interactive quest from a child's drawing
    
    Args:
        drawing_uri: GCS URI of the child's drawing
        lesson: The life lesson to teach (e.g., "sharing my toys")
    
    Returns:
        Complete quest data with character, scenes, and illustrations
    """
    
    print("=" * 60)
    print("🌈 STORYTOPIA QUEST CREATION PIPELINE")
    print("=" * 60)
    
    # Step 1: Visionizer - Analyze drawing and generate character
    print("\n📸 STEP 1: Visionizer - Analyzing drawing...")
    print(f"   Drawing URI: {drawing_uri}")
    
    visionizer_input = f"Please analyze this drawing: {drawing_uri}"
    visionizer_result = visionizer_agent.run(visionizer_input)
    
    # Parse visionizer result
    visionizer_data = json.loads(visionizer_result)
    
    if not visionizer_data.get("success"):
        return {
            "success": False,
            "error": "Visionizer failed",
            "details": visionizer_data
        }
    
    character_description = visionizer_data.get("character_description", "")
    character_name = visionizer_data.get("analysis", {}).get("character_type", "Character")
    
    print(f"   ✅ Character created: {character_name}")
    print(f"   Description: {character_description[:100]}...")
    
    # Step 2: Quest-Creator - Generate interactive quest
    print(f"\n📖 STEP 2: Quest-Creator - Creating {lesson} quest...")
    
    quest_creator_input = f"""
    Create an interactive quest with these details:
    
    CHARACTER DESCRIPTION: {character_description}
    LESSON: {lesson}
    
    Generate 8 scenes teaching this lesson through the character's adventure.
    """
    
    quest_result = quest_creator_agent.run(quest_creator_input)
    
    # Parse quest result
    try:
        quest_data = json.loads(quest_result)
    except json.JSONDecodeError:
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', quest_result, re.DOTALL)
        if json_match:
            quest_data = json.loads(json_match.group())
        else:
            return {
                "success": False,
                "error": "Quest-Creator returned invalid JSON",
                "raw_response": quest_result
            }
    
    print(f"   ✅ Quest created: {quest_data.get('quest_title', 'Untitled')}")
    print(f"   Scenes: {len(quest_data.get('scenes', []))}")
    
    # Step 3: Illustrator - Generate scene illustrations
    print("\n🎨 STEP 3: Illustrator - Generating 8 scene illustrations...")
    
    illustrator_input = f"""
    Generate illustrations for this quest:
    
    QUEST DATA (JSON):
    {json.dumps(quest_data)}
    
    CHARACTER DESCRIPTION:
    {character_description}
    
    Create 8 storybook-style illustrations maintaining character consistency.
    """
    
    illustration_result = illustrator_agent.run(illustrator_input)
    
    # Parse illustration result
    try:
        illustration_data = json.loads(illustration_result)
    except json.JSONDecodeError:
        import re
        json_match = re.search(r'\{.*\}', illustration_result, re.DOTALL)
        if json_match:
            illustration_data = json.loads(json_match.group())
        else:
            return {
                "success": False,
                "error": "Illustrator returned invalid JSON",
                "raw_response": illustration_result
            }
    
    if not illustration_data.get("success"):
        return {
            "success": False,
            "error": "Illustration generation failed",
            "details": illustration_data
        }
    
    print(f"   ✅ Illustrations complete: {illustration_data.get('total_scenes', 0)} scenes")
    
    # Combine all results
    print("\n" + "=" * 60)
    print("✨ QUEST CREATION COMPLETE!")
    print("=" * 60)
    
    # Merge scene images into quest data
    scene_images = {img["scene_number"]: img["image_uri"] 
                   for img in illustration_data.get("scene_images", [])}
    
    for scene in quest_data.get("scenes", []):
        scene_num = scene.get("scene_number")
        if scene_num in scene_images:
            scene["image_uri"] = scene_images[scene_num]
    
    final_result = {
        "success": True,
        "character": {
            "name": character_name,
            "description": character_description,
            "original_drawing_uri": drawing_uri,
            "generated_character_uri": visionizer_data.get("generated_character_uri")
        },
        "quest": quest_data,
        "lesson": lesson,
        "total_scenes": len(quest_data.get("scenes", [])),
        "all_images_generated": len(scene_images) == 8
    }
    
    return final_result


def test_pipeline():
    """
    Test the complete pipeline with a sample drawing
    """
    # This would use a real drawing URI
    drawing_uri = "gs://storytopia-media-2025/drawings/test_drawing.png"
    lesson = "sharing my toys"
    
    result = create_storytopia_quest(drawing_uri, lesson)
    
    print("\n" + "=" * 60)
    print("FINAL RESULT:")
    print("=" * 60)
    print(json.dumps(result, indent=2))
    
    return result


if __name__ == "__main__":
    # Example usage
    print("Storytopia Orchestrator - Ready to create quests!")
    print("Use: create_storytopia_quest(drawing_uri, lesson)")
