# 🚀 Quick Start Guide - Visionizer Testing

## Prerequisites
- Python 3.9+
- Node.js 18+
- Google Cloud Project with:
  - Gemini API key
  - Vertex AI enabled
  - Cloud Storage bucket created

---

## 1. Backend Setup (5 minutes)

```bash
cd agents_service

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

**Edit `.env` file**:
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_API_KEY=your-gemini-api-key
GCS_BUCKET_NAME=storytopia-media-2025
GOOGLE_GENAI_USE_VERTEXAI=True
PORT=8080
```

**Start backend**:
```bash
python main.py
```

Server should start at: `http://localhost:8080`

---

## 2. Create GCS Bucket

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create bucket
gsutil mb -p YOUR_PROJECT_ID gs://storytopia-media-2025

# Make bucket public (for demo)
gsutil iam ch allUsers:objectViewer gs://storytopia-media-2025

# Enable CORS (optional)
echo '[{"origin": ["*"], "method": ["GET", "POST"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://storytopia-media-2025
```

---

## 3. Frontend Setup (3 minutes)

**Open a new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
```

**Edit `.env.local` file**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Start frontend**:
```bash
npm run dev
```

Frontend should start at: `http://localhost:3000`

---

## 4. Test the Visionizer

1. **Open browser**: Navigate to `http://localhost:3000`

2. **Draw a character**:
   - Use the color palette to select colors
   - Draw a simple character (animal, person, creature)
   - Use the brush size slider to adjust thickness
   - Use Undo if you make mistakes

3. **Generate character**:
   - Click "✨ Generate Character ✨"
   - Wait 30-60 seconds for processing
   - See your animated character appear!

4. **Try different drawings**:
   - Click "Try Again" to draw a new character
   - Test with different styles and colors

---

## 5. Verify Backend Health

**Test endpoints**:

```bash
# Health check
curl http://localhost:8080/health

# Should return:
# {
#   "status": "healthy",
#   "agent": "storytopia_coordinator",
#   "project": "your-project-id",
#   "location": "us-central1"
# }
```

---

## Troubleshooting

### Backend Issues

**"Module not found" errors**:
```bash
# Make sure virtual environment is activated
source .venv/bin/activate
pip install -r requirements.txt
```

**"GCS bucket not found"**:
```bash
# Verify bucket exists
gsutil ls gs://storytopia-media-2025

# Create if missing
gsutil mb gs://storytopia-media-2025
```

**"API key invalid"**:
- Get API key from: https://aistudio.google.com/app/apikey
- Update `.env` file with correct key

**"Vertex AI not enabled"**:
```bash
gcloud services enable aiplatform.googleapis.com
```

---

### Frontend Issues

**TypeScript errors**:
```bash
# These are expected before npm install
cd frontend
npm install
```

**"Cannot connect to backend"**:
- Verify backend is running on port 8080
- Check `.env.local` has correct API URL
- Check CORS if using different ports

**Canvas not working**:
- Try a different browser (Chrome/Firefox recommended)
- Check browser console for errors

---

### API Issues

**Character generation fails**:
1. Check backend logs for errors
2. Verify Gemini API key is valid
3. Verify Vertex AI is enabled
4. Check GCS bucket permissions

**Slow generation**:
- Imagen typically takes 30-60 seconds
- This is normal for high-quality image generation

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:3000
- [ ] Can draw on canvas
- [ ] Colors work
- [ ] Undo/Clear work
- [ ] Generate button triggers API call
- [ ] Loading spinner appears
- [ ] Character image displays
- [ ] "Try Again" resets canvas
- [ ] Error messages display if something fails

---

## Example Test Drawings

Try these simple drawings:
1. **Cat**: Draw a circle (head), two triangles (ears), dots (eyes)
2. **Robot**: Draw rectangles and circles
3. **Flower**: Draw a circle with petals
4. **Dragon**: Draw a curved body with wings

The AI will interpret your drawing and create a cute animated version!

---

## Next Steps After Testing

Once Visionizer works:
1. Implement Moderator V1 (safety check)
2. Implement Writer agent (story generation)
3. Implement Moderator V2 (script safety)
4. Implement Animator (video creation)

---

## Support

**Common Commands**:
```bash
# Stop backend: Ctrl+C
# Stop frontend: Ctrl+C

# Restart backend:
cd agents_service
source .venv/bin/activate
python main.py

# Restart frontend:
cd frontend
npm run dev

# View backend logs: Check terminal output
# View frontend logs: Check browser console (F12)
```

---

**Ready to test!** 🎨✨
