# SkyMessage AI Backend Wire-Up Plan

## 📊 Current Status

### ✅ Backend Infrastructure
- **Firebase Functions**: Deployed
  - `askSky`: https://asksky-zkaogokzwq-uc.a.run.app
  - `ingestSaint`: https://ingestsaint-zkaogokzwq-uc.a.run.app
- **Pinecone Index**: `saints-v1` (1536 dimensions, cosine)
  - St. Francis of Assisi: 51+ chunks, 10,320 words
  - St. Augustine of Hippo: 6+ chunks, 5,832 words
- **OpenAI**: text-embedding-3-small, gpt-4o configured

### ⚠️ Frontend Status
- **Current Mode**: MOCK (demo responses)
- **Functions URL**: Needs to be set to production
- **CORS**: Needs verification

---

## 🎯 Phase 1: Update Configuration

### Step 1.1: Set Production Functions URL
**File**: `apps/skymessage/lib/api.ts`

**Change**:
```typescript
// Current (line 3):
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'http://127.0.0.1:5003/st-ann-ai/us-central1'

// Change to:
const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-st-ann-ai.cloudfunctions.net'
```

### Step 1.2: Disable Mock Mode
**File**: `apps/skymessage/lib/api.ts`

**Change**:
```typescript
// Current (line 4):
const USE_MOCK = true

// Change to:
const USE_MOCK = false
```

---

## 🧪 Phase 2: Test Backend Functions

### Test 2.1: Verify askSky Function
```bash
curl -X POST https://asksky-zkaogokzwq-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How did you discover your vocation?",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

**Expected**: JSON response with `text`, `sources`, `saint` fields

### Test 2.2: Check CORS
```bash
curl -X OPTIONS https://asksky-zkaogokzwq-uc.a.run.app \
  -H "Origin: https://skymessage.web.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected**: CORS headers allowing cross-origin requests

---

## 🔍 Phase 3: Verify Backend Logic

### Check 3.1: Review askSky Function
**File**: `functions/services/sky/ask.js`

**Verify**:
- ✅ Pinecone namespace: `saints-v1`
- ✅ Embedding model: `text-embedding-3-small`
- ✅ Vector query with `saintSlug` filter
- ✅ OpenAI chat completion with context
- ✅ Response format: `{ text, sources, saint }`

### Check 3.2: Test Pinecone Query Manually
In Firebase Functions logs, verify:
- Query vectors are being generated
- Pinecone is returning matches
- Metadata includes `saintSlug`, `sourceUrl`, `publisher`

---

## 🚀 Phase 4: Deploy & Test Frontend

### Deploy 4.1: Update and Build
```bash
cd /Users/wes/Development/ChatJP2/apps/skymessage

# Update api.ts (Steps 1.1 & 1.2)
# Then build:
npm run build

# Deploy
cd ../..
firebase deploy --only hosting:skymessage
```

### Test 4.2: Frontend Integration
1. Visit: https://skymessage.web.app
2. Select **St. Francis of Assisi**
3. Ask: "How did you discover your vocation?"
4. **Expected**: Real AI response with source citations from New Advent

### Test 4.3: Emoji Story Mode
1. Say: "Can you tell me your story?"
2. **Expected**: Emoji-based story with animated bubbles and pauses

---

## 🐛 Phase 5: Troubleshooting Guide

### Issue 5.1: CORS Error
**Symptom**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Check**: `functions/index.js` - ensure `setCorsHeaders` is called
```javascript
exports.askSky = onRequest(
  { cors: true, ... }, // CORS enabled
  async (req, res) => {
    setCorsHeaders(res, req); // Called
    // ...
  }
);
```

**Fix**: Redeploy functions if CORS headers missing

### Issue 5.2: Empty Responses
**Symptom**: Function returns `{ text: "", sources: [] }`

**Check**:
1. Pinecone query returning 0 matches
2. `saintSlug` mismatch (e.g., "francis-of-assisi" vs "st-francis-of-assisi")
3. Namespace mismatch in Pinecone

**Fix**: Verify Pinecone data with correct metadata

### Issue 5.3: OpenAI Errors
**Symptom**: `OpenAIError: API key invalid`

**Check**: Firebase Secrets
```bash
firebase functions:secrets:access OPENAI_API_KEY
```

**Fix**: Re-set secret if needed:
```bash
firebase functions:secrets:set OPENAI_API_KEY
```

### Issue 5.4: Slow Responses
**Symptom**: Requests take >10 seconds

**Possible Causes**:
- Cold start (first request after inactivity)
- Large context (too many Pinecone matches)
- OpenAI rate limits

**Fix**: 
- Increase function memory (1GiB)
- Reduce `topK` in Pinecone query (currently 12)
- Add loading indicator in UI

---

## 📊 Phase 6: Monitoring & Optimization

### Monitor 6.1: Firebase Functions Logs
```bash
firebase functions:log --only askSky
```

**Watch for**:
- Pinecone query times
- OpenAI API latency
- Error rates

### Monitor 6.2: Test All Saints
Once working with Francis:
- ✅ St. Francis of Assisi
- ✅ St. Augustine of Hippo
- ⏳ St. Thérèse (need to scrape)
- ⏳ St. Teresa of Calcutta (need to scrape)
- ⏳ Others in SEED_SAINTS

### Optimize 6.3: Add More Saints
Run Apify scraper for remaining saints:
1. Update scraper start URLs
2. Run with `maxRequestsPerCrawl: 100`
3. Verify Pinecone Integration processes all data
4. Test new saints in UI

---

## ✅ Success Criteria

### Must Have:
- [ ] Real AI responses from askSky function
- [ ] Source citations from Pinecone metadata
- [ ] Emoji stories with animated display
- [ ] No CORS errors
- [ ] Response time < 5 seconds

### Nice to Have:
- [ ] All 20 SEED_SAINTS have data in Pinecone
- [ ] Error handling with user-friendly messages
- [ ] Loading states during API calls
- [ ] Analytics tracking

---

## 🔄 Rollback Plan

If issues arise:

### Option A: Re-enable Mock Mode
```typescript
const USE_MOCK = true
npm run build
firebase deploy --only hosting:skymessage
```

### Option B: Debug with Local Functions
```bash
cd functions
firebase emulators:start --only functions
```

Then test locally before redeploying.

---

## 📝 Next Steps After Wire-Up

1. **Add more saints** via Apify scraper
2. **Improve error handling** in UI
3. **Add caching** for common queries
4. **Monitor costs** (OpenAI + Pinecone)
5. **Gather user feedback** on response quality
6. **Fine-tune prompts** in `ask.js` for better responses

---

## 🎉 Ready to Wire Up!

Run through Phases 1-4 to connect the AI backend. Start with Phase 1 (configuration changes), then test thoroughly in Phases 2-3 before deploying in Phase 4.

