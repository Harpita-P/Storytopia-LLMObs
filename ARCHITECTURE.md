# 🌈 Storytopia Architecture (Interactive Quest Version)

## Overview
Storytopia is an interactive learning platform where children create their own characters and go on value-based quests that teach life skills through interactive storytelling.

## Core Flow

```
┌─────────────────┐
│  1. Draw Hero   │  Kid draws character on canvas
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Visionizer  │  Analyzes drawing → Character description
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Choose Lesson│  Parent/kid selects life lesson
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Quest-Creator│  Generates 8 interactive scenes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Illustrator  │  Creates 8 scene illustrations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Play Quest   │  Kid makes choices, earns coins
└─────────────────┘
```

## Agents

### 1. **Visionizer Agent** (Vision Analysis)
- **Input:** Child's drawing (canvas image)
- **Process:** 
  - Analyzes drawing using Gemini Vision
  - Extracts character traits, style, personality
  - Generates detailed character description
- **Output:** Character profile
- **Tools:** Gemini Vision API

### 2. **Quest-Creator Agent** (Story Generation)
- **Input:** 
  - Character description
  - Selected lesson (e.g., "sharing my toys")
- **Process:**
  - Creates 8-scene interactive quest
  - Each scene has:
    - Scenario (1-2 sentences with character)
    - Question ("What should [character] do?")
    - Option A (correct, value-aligned)
    - Option B (obviously wrong)
    - Feedback for each option
    - Image generation prompt
- **Output:** Quest structure (JSON)
- **Tools:** Gemini 2.0 Flash

### 3. **Illustrator Agent** (Image Generation)
- **Input:**
  - Quest structure with 8 scenes
  - Character description (for consistency)
- **Process:**
  - Generates 8 storybook-style illustrations
  - Ensures character looks consistent across all images
  - Creates warm, child-friendly visuals
- **Output:** 8 image URIs (GCS)
- **Tools:** Imagen 3.0

## Data Models

### Character Profile
```json
{
  "name": "Mila the Star Bunny",
  "description": "A cheerful pink bunny with sparkly star patterns",
  "personality": ["friendly", "curious", "kind"],
  "visual_style": "cute, colorful, storybook",
  "original_drawing_uri": "gs://...",
  "enhanced_image_uri": "gs://..."
}
```

### Quest Structure
```json
{
  "quest_id": "uuid",
  "character_name": "Mila",
  "lesson": "sharing",
  "scenes": [
    {
      "scene_number": 1,
      "scenario": "Mila is playing with her ball...",
      "question": "What should Mila do?",
      "option_a": {
        "text": "Share the ball",
        "is_correct": true,
        "feedback": "Great job!"
      },
      "option_b": {
        "text": "Keep it all to herself",
        "is_correct": false,
        "feedback": "Let's try again..."
      },
      "image_uri": "gs://...",
      "image_prompt": "..."
    }
    // ... 7 more scenes
  ],
  "coins_earned": 0,
  "completed": false
}
```

### Lesson
```json
{
  "id": "sharing",
  "title": "Sharing My Toys",
  "description": "Learn why sharing makes everyone happy",
  "emoji": "🤝",
  "age_range": "4-8",
  "key_concepts": ["taking turns", "generosity", "fairness"]
}
```

## Frontend Flow

### 1. Drawing Screen
- Canvas for drawing character
- Color picker (crayon-style)
- Tools: eraser, undo, clear
- Submit button → sends to Visionizer

### 2. Lesson Selection Screen
- Grid of lesson cards
- Each shows: emoji, title, description
- Kid/parent selects one lesson
- Triggers Quest-Creator

### 3. Quest Play Screen
- Full-screen scene image
- Text overlay with:
  - Scenario text
  - Question
  - Two option buttons (A & B)
- Coin counter at top
- Progress indicator (Scene X/8)
- Feedback animations:
  - ✅ Correct → celebration + coin
  - ❌ Wrong → gentle retry prompt

### 4. Completion Screen
- Total coins earned
- Completion message
- Option to:
  - Play again with same character
  - Create new character
  - Choose different lesson

## Tech Stack

### Backend
- **Framework:** FastAPI
- **AI Platform:** Google Vertex AI
- **Models:**
  - Gemini 2.0 Flash (vision & text)
  - Imagen 3.0 (image generation)
- **Storage:** Google Cloud Storage
- **Database:** Firestore (quest progress, user data)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Canvas:** HTML5 Canvas API
- **State:** React hooks
- **API:** REST endpoints to backend

## API Endpoints

```
POST /api/visionizer
  - Input: { drawing_image: base64 }
  - Output: { character_profile }

GET /api/lessons
  - Output: { lessons: [...] }

POST /api/quest/create
  - Input: { character_profile, lesson_id }
  - Output: { quest_structure }

POST /api/quest/illustrate
  - Input: { quest_id }
  - Output: { scene_images: [...] }

POST /api/quest/answer
  - Input: { quest_id, scene_number, selected_option }
  - Output: { is_correct, feedback, coins_earned }
```

## Deployment

### Backend
- **Platform:** Google Cloud Run
- **Container:** Docker
- **Environment:** Python 3.11
- **Auto-scaling:** Yes

### Frontend
- **Platform:** Vercel / Cloud Run
- **Build:** Next.js static export
- **CDN:** Yes

## Future Enhancements

1. **Multi-language support**
2. **Parent dashboard** (track progress)
3. **Custom lesson creation**
4. **Character gallery** (save favorite characters)
5. **Difficulty levels** (adjust complexity by age)
6. **Audio narration** (read-aloud mode)
7. **Multiplayer quests** (collaborative learning)

## File Structure

```
storytopia/
├── agents_service/          # Backend
│   ├── agents/
│   │   ├── visionizer.py   # Character analysis
│   │   ├── writer.py       # Quest-Creator (renamed)
│   │   └── animator.py     # Illustrator (renamed)
│   ├── tools/
│   │   ├── vision_tool.py  # Gemini Vision wrapper
│   │   ├── imagen_tool.py  # Imagen wrapper
│   │   └── storage_tool.py # GCS operations
│   ├── data/
│   │   └── lessons.json    # Available lessons
│   └── examples/
│       └── quest_example.json
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── page.tsx       # Main app
│   │   ├── draw/          # Drawing screen
│   │   ├── lessons/       # Lesson selection
│   │   └── quest/         # Quest play screen
│   └── components/
│       ├── DrawingCanvas.tsx
│       ├── LessonCard.tsx
│       └── QuestScene.tsx
└── ARCHITECTURE.md        # This file
```

## Key Design Principles

1. **Child-First:** Simple, intuitive, joyful UX
2. **Educational:** Clear learning outcomes
3. **Engaging:** Interactive, not passive
4. **Safe:** Age-appropriate content, no ads
5. **Personalized:** Every story features their character
6. **Positive:** Encouraging feedback, growth mindset
7. **Beautiful:** Warm, colorful, storybook aesthetic
