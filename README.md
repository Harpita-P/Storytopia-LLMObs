![Storytopia Main Screen](https://github.com/Harpita-P/Storytopia/blob/ce180f06d415c798aa699b3cbab49e8c1f12910e/Storytopia-Main.png?raw=true)

**Storytopia** transforms a child’s drawing into a narrated, illustrated 8-scene quest (story adventure), augmenting imagination with Generative AI. Built for the **Google Cloud Run Hackathon**, Storytopia demonstrates how **multi-agent orchestration with Google ADK**, **Vertex AI**, and **Cloud Run** can turn screen time into a hands-on creative adventure.

---
## Try Storytopia Live

You can access the hosted version of **Storytopia** here:  
[Open Storytopia Web App](https://storytopia-frontend-700174635185.us-central1.run.app)

> **Best viewed on:** Desktop or iPad (mobile layout not yet fully optimized).  
> If the screen appears zoomed in, try adjusting the zoom level to around **67%** (or to your preference).

### Runtime Notes  
- Character generation: ~15 seconds  
- Quest generation: ~2.5 minutes  
  _(Actual times may vary depending on model loads and network conditions.)_  
- Demo video and GIF examples are **sped up for presentation purposes**.
---

## High-Level System Overview

Storytopia consists of two main components:

- **Next.js Frontend (UI Service):** Built for the browser, our interface lets children draw directly on a digital canvas — whether on an iPad or a computer. They can also upload photos of their favorite toys, stuffed animals, or hand-drawn art to turn them into story characters.
- **FastAPI Multi-Agent Backend (Agents Service):** Powered by the **Google Agent Development Kit (ADK)**, the backend orchestrates three AI agents — **Visionizer**, **Quest Creator**, and **Illustrator** — to generate characters, stories, and illustrations.  

An optional **Text-to-Speech** endpoint provides narrated playback using **Cloud TTS**.

---

## Cloud Deployment Surfaces

| Component | Technology | Deployment | Purpose |
|------------|-------------|-------------|----------|
| **Frontend** | Next.js | Cloud Run | Drawing canvas, story flow UI |
| **Backend** | FastAPI + ADK | Cloud Run | Orchestrates AI agents |
| **Media** | Cloud Storage | – | Stores all uploads & generated assets |
| **AI Services** | Vertex AI (Gemini + Imagen) & Cloud TTS| – | Drawing analysis, story generation, image synthesis, narrations |

The frontend and backend are containerized with  dedicated **Dockerfiles** and deployable as two separate **Cloud Run services**. Runtime dependencies include **Google Cloud Storage**, **Vertex AI (Gemini Flash + Imagen)**, and **Cloud TTS**.

<p align="center">
  <img src="https://github.com/Harpita-P/Storytopia/blob/62ab0873f9d73c0556d57b9b385798c24c5e06f7/Storytopia-Architecture.png?raw=true" alt="Storytopia Architecture" width="850">
</p>
<p align="center"><strong>Figure 1.</strong> Multi-Agent Architecture on Google Cloud Run</p>

## How Our Multi-Agent Workflow Works

Transforming a child’s character and lesson into a fully illustrated, interactive picture book is a complex process that benefits from being divided into specialized components — which is exactly where AI agents come to play. 
Storytopia is a conversation between multiple AI agents (Google ADK) that collaborate with eachother. Below, we walk through each step of the process. 

### Google ADK Integration
- Each AI agent is defined as an **LlmAgent** within the Google **Agent Development Kit (ADK)**.  
- The FastAPI backend manages interactions through **ADK sessions**, executed asynchronously using `Runner.run_async`.  
- Structured JSON responses stream back to the frontend in real time.

### 1. Creating Your Character with the Visionizer Agent
We designed this stage to make kids feel like their hand-drawn art has come to life, while maintaining visual consistency and safety through automated filtering.
When a child finishes their drawing and hits “Generate Character,” we start the process with our **Visionizer Agent**.

1. The frontend sends the base64-encoded drawing and a user ID to the '/generate-character` endpoint. 
2. Our FastAPI backend uploads the image to **Google Cloud Storage** and initializes an **ADK Runner session**.  
3. The **Visionizer Agent** takes over:
   - It first calls **Gemini Flash 2.0 (Vision Capability)** to understand the drawing — identifying the character’s key traits, objects, and any safety signals.  
   - Given that the drawing is appropriate, it builds a detailed prompt for **Imagen 3.0**, which then produces a high-quality, animated version of the character.
4. The agent returns structured JSON including:
   - Extracted visual traits  
   - The Imagen prompt  
   - A Cloud Storage URI pointing to the generated image  
---
![Creating Character Demo](https://github.com/Harpita-P/Storytopia/blob/a6c44a907685f84477cfdbffa6f7adefcbb3a7c8/CreatingCharacterExample.gif?raw=true)


### 2. Turning the Character into a Quest with the Quest Creator Agent

We treat this agent as the “writer” of the experience — blending educational goals with fun, appropriate storytelling.
Once the character is ready, the child selects a theme or lesson — for example, *kindness*, *sharing*, or *bravery*.  


![Lesson Theme Selection Demo](https://github.com/Harpita-P/Storytopia/blob/17fef7ab21915f9e1713d21f08aad40ab70b20e9/LessonTheme.gif?raw=true)

This triggers the **Quest Creator Agent**.

Here’s how it works:

1. The frontend sends the character’s metadata (from the Visionizer Agent stage) and the chosen lesson to `/create-quest`.  
2. The **Quest Creator Agent**, powered by **Gemini 2.0 Flash (LLM)**, generates an **eight-scene interactive story**, where each scene includes:
   - A short story segment and question
   - One correct and one incorrect answer  
   - A corresponding image prompt  
---

### 3. Bringing the Story to Life with the Illustrator Agent

Once the story structure is ready, we move to the visual storytelling phase with the **Illustrator Agent**. Here’s the process:

1. The quest JSON from the previous step is passed to the **Illustrator Agent**. We also fetch the generated character image from Cloud Storage, and pass it to the agent. This step is important for maintaining visual consistency - ensuring that the kid's character appears the same in each scene. 
2. The agent enhances the image prompts for **visual consistency** across all scenes — matching colors, character poses, and setting details.  
3. It then calls **Gemini Flash 2.5 Image** and performs Image&text-to-Image processing, to create eye-catching **illustrations** for each scene. 
4. Each generated image is uploaded to **Google Cloud Storage**, and the URIs are consolidated into the final JSON response.
5. The full questbook is asssembled, generated and rendered in the frontend UI.
---
![Storytopia Quest Demo](https://github.com/Harpita-P/Storytopia/blob/46619dd63b3024bd942b34ec01b6bd9783990b7f/Storytopia-Quest.gif?raw=true)

### 4. Adding Narration with Gemini Text-to-Speech (Optional)

To make stories even more immersive and accessible to all readers, we offer optional **narrated playback** using **Gemini 2.5 Flash TTS**. When a narration request is made (by clicking on the sound icon):

1. The frontend sends story text to `/text-to-speech`.  
2. The backend invokes **Gemini Flash TTS**, generating expressive, child-friendly MP3 narration.  
3. The audio file is stored in **Cloud Storage**, and the returned URI allows the frontend to sync playback scene by scene.
---

