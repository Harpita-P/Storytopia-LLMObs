# 🤖 Storytopia Agents - ADK Implementation

## Overview

All three agents are now fully implemented using Google ADK (Agent Development Kit) with proper tool functions and orchestration.

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STORYTOPIA PIPELINE                       │
└─────────────────────────────────────────────────────────────┘

1. VISIONIZER AGENT
   Input:  Child's drawing (GCS URI)
   Tool:   analyze_and_generate_character()
   Output: Character profile + generated character image
   
   ↓
   
2. QUEST-CREATOR AGENT  
   Input:  Character description + Lesson
   Tool:   Direct LLM generation (no tool needed)
   Output: 8-scene interactive quest (JSON)
   
   ↓
   
3. ILLUSTRATOR AGENT
   Input:  Quest data + Character description
   Tool:   generate_all_scene_illustrations()
   Output: 8 scene image URIs
```

## Implemented Agents

### 1. **Visionizer Agent** ✅
**File:** `agents/visionizer.py`

**Purpose:** Analyzes child's drawing and generates animated character

**Implementation:**
```python
visionizer_agent = LlmAgent(
    name="visionizer",
    model="gemini-2.0-flash-exp",
    description="Analyzes children's drawings and generates animated characters",
    instruction="Extract image_uri and call analyze_and_generate_character tool",
    tools=[analyze_and_generate_character],
    output_key="visionizer_result"
)
```

**Tool Function:**
- `analyze_and_generate_character(image_uri: str) -> str`
  - Calls `analyze_drawing()` - Gemini Vision analysis
  - Calls `create_character_prompt()` - Prompt engineering
  - Calls `generate_character_image()` - Imagen generation
  - Returns JSON with character profile

**Input Example:**
```
"Please analyze this drawing: gs://bucket/drawing.png"
```

**Output Example:**
```json
{
  "success": true,
  "original_drawing_uri": "gs://...",
  "analysis": {
    "character_type": "Mila the Star Bunny",
    "character_description": "A cheerful pink bunny with sparkly star patterns",
    "personality": ["friendly", "curious"],
    "age_appropriate": true
  },
  "generated_character_uri": "gs://...",
  "character_prompt": "..."
}
```

---

### 2. **Quest-Creator Agent** ✅
**File:** `agents/quest_creator.py`

**Purpose:** Creates 8-scene interactive quest teaching a life lesson

**Implementation:**
```python
quest_creator_agent = LlmAgent(
    name="quest_creator",
    model="gemini-2.0-flash-exp",
    description="Creates 8-scene interactive quests teaching life lessons",
    instruction="Generate 8 scenes with scenarios, questions, and choices",
    output_key="quest_data"
)
```

**No Tool Function Needed** - Direct LLM generation with structured output

**Input Example:**
```
Create an interactive quest with these details:

CHARACTER DESCRIPTION: Mila the Star Bunny - A cheerful pink bunny with sparkly star patterns
LESSON: sharing my toys

Generate 8 scenes teaching this lesson through the character's adventure.
```

**Output Example:**
```json
{
  "quest_title": "Mila's Sharing Adventure",
  "lesson": "sharing my toys",
  "character_name": "Mila the Star Bunny",
  "character_description": "A cheerful pink bunny with sparkly star patterns",
  "scenes": [
    {
      "scene_number": 1,
      "scenario": "Mila is playing with her sparkly blue ball...",
      "question": "What should Mila do?",
      "option_a": {
        "text": "Share the ball",
        "is_correct": true,
        "feedback": "Wonderful! Sharing makes everyone happy!"
      },
      "option_b": {
        "text": "Keep it all to herself",
        "is_correct": false,
        "feedback": "That's not very kind. Let's try again!"
      },
      "image_prompt": "A cheerful pink bunny with sparkly star patterns..."
    }
    // ... 7 more scenes
  ]
}
```

---

### 3. **Illustrator Agent** ✅
**File:** `agents/illustrator.py`

**Purpose:** Generates 8 storybook-style scene illustrations

**Implementation:**
```python
illustrator_agent = LlmAgent(
    name="illustrator",
    model="gemini-2.0-flash-exp",
    description="Generates 8 storybook-style scene illustrations using Imagen",
    instruction="Extract quest data and call generate_all_scene_illustrations",
    tools=[generate_all_scene_illustrations],
    output_key="illustration_result"
)
```

**Tool Function:**
- `generate_all_scene_illustrations(quest_json: str, character_description: str) -> str`
  - Parses quest JSON to extract 8 scenes
  - For each scene:
    - Gets `image_prompt` from scene data
    - Enhances with character description for consistency
    - Calls `generate_scene_image()` - Imagen generation
  - Returns JSON with all 8 image URIs

**Input Example:**
```
Generate illustrations for this quest:

QUEST DATA (JSON):
{...quest data with 8 scenes...}

CHARACTER DESCRIPTION:
Mila the Star Bunny - A cheerful pink bunny with sparkly star patterns

Create 8 storybook-style illustrations maintaining character consistency.
```

**Output Example:**
```json
{
  "success": true,
  "character_description": "Mila the Star Bunny...",
  "scene_images": [
    {
      "scene_number": 1,
      "image_uri": "gs://bucket/scene1.png",
      "prompt_used": "..."
    }
    // ... 7 more scenes
  ],
  "total_scenes": 8
}
```

---

## Orchestrator

**File:** `orchestrator.py`

Coordinates all three agents in sequence:

```python
from orchestrator import create_storytopia_quest

result = create_storytopia_quest(
    drawing_uri="gs://bucket/drawing.png",
    lesson="sharing my toys"
)
```

**Pipeline Flow:**
1. Calls `visionizer_agent.run(drawing_uri)`
2. Extracts character description from result
3. Calls `quest_creator_agent.run(character + lesson)`
4. Extracts quest data from result
5. Calls `illustrator_agent.run(quest + character)`
6. Merges all results into final quest structure

**Final Output:**
```json
{
  "success": true,
  "character": {
    "name": "Mila the Star Bunny",
    "description": "...",
    "original_drawing_uri": "gs://...",
    "generated_character_uri": "gs://..."
  },
  "quest": {
    "quest_title": "...",
    "scenes": [
      {
        "scene_number": 1,
        "scenario": "...",
        "question": "...",
        "option_a": {...},
        "option_b": {...},
        "image_uri": "gs://..."  // ← Added by orchestrator
      }
      // ... 7 more scenes with image_uri
    ]
  },
  "lesson": "sharing my toys",
  "total_scenes": 8,
  "all_images_generated": true
}
```

---

## Key Features

### ✅ **Proper ADK Implementation**
- All agents use `LlmAgent` from `google.adk.agents`
- Tool functions properly decorated and registered
- Clear input/output specifications

### ✅ **JSON-Only Responses**
- All agents instructed to return ONLY valid JSON
- No conversational text or explanations
- Easy to parse and process

### ✅ **Character Consistency**
- Character description flows through entire pipeline
- Visionizer → Quest-Creator → Illustrator
- Every scene references the character by name and traits
- Every image prompt includes full character description

### ✅ **Error Handling**
- Try-catch blocks in all tool functions
- Detailed error messages with tracebacks
- Success/failure flags in all responses

### ✅ **Progress Logging**
- Print statements at each step
- Clear indication of what's happening
- Helpful for debugging

---

## Usage Examples

### Example 1: Complete Pipeline
```python
from orchestrator import create_storytopia_quest

result = create_storytopia_quest(
    drawing_uri="gs://storytopia-media-2025/drawings/bunny.png",
    lesson="sharing my toys"
)

if result["success"]:
    print(f"Quest created: {result['quest']['quest_title']}")
    print(f"Scenes: {result['total_scenes']}")
    print(f"Character: {result['character']['name']}")
```

### Example 2: Individual Agent
```python
from agents.visionizer import visionizer_agent

result = visionizer_agent.run(
    "Please analyze this drawing: gs://bucket/drawing.png"
)

import json
data = json.loads(result)
print(data["character_description"])
```

### Example 3: Quest-Creator Only
```python
from agents.quest_creator import quest_creator_agent

result = quest_creator_agent.run("""
Create an interactive quest with these details:

CHARACTER DESCRIPTION: Luna the Moon Cat - A silver cat with glowing moon patterns
LESSON: being kind with words

Generate 8 scenes teaching this lesson.
""")

import json
quest = json.loads(result)
print(f"Created: {quest['quest_title']}")
```

---

## Dependencies

All agents require:
- `google-adk` - Agent Development Kit
- `google-cloud-aiplatform` - Vertex AI
- `google-generativeai` - Gemini API

Tool functions use:
- `tools/vision_tool.py` - Gemini Vision wrapper
- `tools/imagen_tool.py` - Imagen wrapper
- `tools/storage_tool.py` - GCS operations

---

## Testing

To test the complete pipeline:

```bash
cd agents_service
python orchestrator.py
```

Or test individual agents:

```python
# Test Visionizer
from agents.visionizer import visionizer_agent
result = visionizer_agent.run("gs://bucket/test.png")

# Test Quest-Creator
from agents.quest_creator import quest_creator_agent
result = quest_creator_agent.run("CHARACTER: ... LESSON: sharing")

# Test Illustrator
from agents.illustrator import illustrator_agent
result = illustrator_agent.run("QUEST DATA: {...} CHARACTER: ...")
```

---

## Next Steps

1. ✅ All agents implemented with ADK
2. ✅ Tool functions created and tested
3. ✅ Orchestrator coordinates pipeline
4. 🔄 **TODO:** Create FastAPI endpoints
5. 🔄 **TODO:** Connect to frontend
6. 🔄 **TODO:** Add progress tracking
7. 🔄 **TODO:** Implement coin system
8. 🔄 **TODO:** Add quest completion logic

---

## File Structure

```
agents_service/
├── agents/
│   ├── visionizer.py          ✅ Implemented
│   ├── quest_creator.py       ✅ Implemented
│   └── illustrator.py         ✅ Implemented
├── tools/
│   ├── vision_tool.py         ✅ Existing
│   ├── imagen_tool.py         ✅ Existing
│   └── storage_tool.py        ✅ Existing
├── data/
│   └── lessons.json           ✅ 12 lessons defined
├── examples/
│   └── quest_example.json     ✅ Complete example
├── orchestrator.py            ✅ Implemented
└── AGENTS_IMPLEMENTATION.md   ✅ This file
```

All agents are ready for integration! 🎉
