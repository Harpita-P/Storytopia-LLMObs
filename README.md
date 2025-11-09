# 🎨 Storytopia

AI-powered multi-agent system that converts children's drawings into personalized animated stories with embedded life lessons.

## 🔒 Security Notice

**IMPORTANT:** This repository does NOT contain any API keys or credentials. You must set up your own:
- Google Cloud Project with Vertex AI enabled
- Google Cloud Storage bucket
- Environment variables (see setup instructions below)

Never commit `.env` files or credentials to version control!

## 🏗️ Architecture

- **Frontend**: Next.js app with Canvas API (Cloud Run Service #1)
- **Backend**: Python FastAPI + ADK agents (Cloud Run Service #2)
- **AI Models**: Gemini 2.0 Flash, Imagen 3.0, Veo
- **Storage**: Google Cloud Storage, Firestore

## 🤖 Multi-Agent Pipeline

1. **Visionizer** - Analyzes drawings with Gemini Vision
2. **Moderator V1** - Safety check on visuals
3. **Writer** - Generates story script with lesson
4. **Moderator V2** - Safety check on script (auto-revises)
5. **Animator** - Creates video using Imagen + Veo

## 📁 Project Structure

```
storytopia/
├── agents_service/       # Backend ADK agents (Python)
│   ├── agents/          # Individual agent implementations
│   ├── tools/           # Custom tools (Vision, Imagen, Veo)
│   ├── agent.py         # Root agent definition
│   ├── main.py          # FastAPI server
│   └── requirements.txt
│
├── frontend/            # Next.js frontend
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── lib/            # Utilities
│
└── terraform/          # Infrastructure as code
```

## 🚀 Getting Started

### Backend Setup

```bash
cd agents_service

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Google Cloud credentials

# Run locally
python main.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with API URL

# Run development server
npm run dev
```

## 🌐 Deployment

### Deploy Backend (ADK Agents Service)

```bash
cd agents_service

export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1

adk deploy cloud_run \
  --project=$GOOGLE_CLOUD_PROJECT \
  --region=$GOOGLE_CLOUD_LOCATION \
  --service_name=storytopia-agents \
  --with_ui \
  .
```

### Deploy Frontend

```bash
cd frontend

gcloud run deploy storytopia-frontend \
  --source . \
  --region $GOOGLE_CLOUD_LOCATION \
  --allow-unauthenticated
```

## 📊 Environment Variables

### Backend (.env)
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
- `GOOGLE_CLOUD_LOCATION` - Region (e.g., us-central1)
- `GOOGLE_API_KEY` - Gemini API key
- `GCS_BUCKET_NAME` - Cloud Storage bucket
- `GOOGLE_GENAI_USE_VERTEXAI` - Use Vertex AI (true/false)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🎯 Features

- ✅ Canvas drawing interface for children
- ✅ AI-powered story generation
- ✅ Two-phase content moderation
- ✅ Animated video output
- ✅ Life lesson integration
- ✅ Cloud-native deployment

## 📈 Performance

- **Pipeline latency**: 2-4 minutes
- **Cost per story**: ~$0.15-0.30
- **Auto-scaling**: Cloud Run handles concurrency

## 🔐 Safety

Two-phase moderation system:
1. Visual content check before story creation
2. Script safety check with auto-revision
3. Only approved content reaches animation stage

## 📝 License

MIT License - Built for Google Cloud Hackathon

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

---

**Built with Google ADK, Vertex AI, and Cloud Run**
