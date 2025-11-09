# 🚦 Google Cloud API Rate Limits

## What Happened?

You're seeing **429 Resource Exhausted** errors because you've hit Google Cloud's API rate limits.

## Why Does This Happen?

Google Cloud APIs have quotas to prevent abuse:
- **Gemini Vision API**: Limited requests per minute
- **Imagen API**: Limited image generations per minute
- **Combined usage**: All APIs share project-level quotas

## ✅ Solutions Implemented

### 1. **Automatic Retry with Exponential Backoff**

Both `vision_tool.py` and `imagen_tool.py` now automatically retry on rate limit errors:

```python
# Retry logic
max_retries = 3
retry_delay = 2  # seconds

Attempt 1: Wait 2 seconds
Attempt 2: Wait 4 seconds  
Attempt 3: Wait 8 seconds
```

**Benefits:**
- Automatically handles temporary rate limits
- Exponential backoff prevents overwhelming the API
- User-friendly error messages

### 2. **Better Error Messages**

Instead of cryptic errors, you now see:
```
Rate limit hit, waiting 4s before retry 2/3...
```

Or if all retries fail:
```
Rate limit exceeded after 3 attempts. Please wait a few minutes and try again.
```

## 📊 Current Quotas (Free Tier)

### Gemini Vision API
- **Requests per minute:** 60
- **Requests per day:** Varies by region

### Imagen API
- **Images per minute:** 10-20
- **Images per day:** Varies by region

## 💡 Best Practices

### 1. **Wait Between Requests**
If you're testing multiple times:
```bash
# Wait 1-2 minutes between tests
# Don't spam the "Generate Character" button
```

### 2. **Use Cached Results**
The app already caches:
- Generated character images
- Quest data
- Scene illustrations

### 3. **Monitor Usage**
Check your quota usage:
```bash
# Google Cloud Console
https://console.cloud.google.com/apis/dashboard
```

### 4. **Request Quota Increase**
For production use:
1. Go to Google Cloud Console
2. Navigate to APIs & Services → Quotas
3. Request increase for:
   - Gemini API quota
   - Imagen API quota

## 🔧 How to Test Without Hitting Limits

### Option 1: Use Mock Data
For frontend development, use example quest data:
```javascript
// Use the example quest from examples/quest_example.json
import exampleQuest from './examples/quest_example.json'
```

### Option 2: Space Out Tests
```
Test 1 → Wait 2 minutes → Test 2 → Wait 2 minutes → Test 3
```

### Option 3: Use Different Characters
The system caches by drawing, so:
- Same drawing = cached result (no API call)
- New drawing = new API call

## 📈 Quota Management

### Check Current Usage
```bash
gcloud monitoring time-series list \
  --filter='metric.type="serviceruntime.googleapis.com/api/request_count"'
```

### View Quota Limits
```bash
gcloud services quota list \
  --service=aiplatform.googleapis.com
```

### Request Increase
```bash
# Or use the console:
https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas
```

## 🎯 What to Do Right Now

### Immediate Actions:
1. ✅ **Wait 5-10 minutes** - Let quotas reset
2. ✅ **Restart backend** - Pick up retry logic
   ```bash
   cd agents_service
   python main.py
   ```
3. ✅ **Test again** - Should work with retries

### Long-term Actions:
1. **Request quota increase** for production
2. **Implement caching** at API level
3. **Add rate limiting** in frontend (prevent spam clicks)
4. **Monitor usage** regularly

## 🚀 Production Recommendations

### 1. **Implement Request Queuing**
```python
# Queue requests instead of failing
from queue import Queue
request_queue = Queue()
```

### 2. **Add User Feedback**
```javascript
// Show user when rate limit is hit
"⏳ High demand! Your request is queued..."
```

### 3. **Use Redis for Caching**
```python
# Cache generated characters for 24 hours
redis.setex(f"character:{drawing_hash}", 86400, character_data)
```

### 4. **Implement Backpressure**
```javascript
// Disable button while generating
<button disabled={isGenerating}>
  {isGenerating ? "Generating..." : "Generate Character"}
</button>
```

## 📞 Support

If rate limits persist:
1. Check [Google Cloud Status](https://status.cloud.google.com/)
2. Review [Vertex AI Quotas](https://cloud.google.com/vertex-ai/docs/quotas)
3. Contact Google Cloud Support

## 🔗 Useful Links

- [Vertex AI Error Codes](https://cloud.google.com/vertex-ai/generative-ai/docs/error-code-429)
- [Quota Management](https://cloud.google.com/docs/quota)
- [API Rate Limiting Best Practices](https://cloud.google.com/apis/design/design_patterns#rate_limiting)

---

**TL;DR:** You hit rate limits. Wait 5-10 minutes, restart the backend, and try again. The system now automatically retries with exponential backoff! 🎉
