# SkyMessage - Deployment & Data Pipeline Guide

## Overview

This guide walks you through deploying the full SkyMessage data pipeline:
1. **Scrape** saint content from web sources (Apify)
2. **Store** raw content in Firestore
3. **Embed** content into vectors (OpenAI)
4. **Index** vectors in Pinecone
5. **Query** for RAG-based saint responses

---

## Prerequisites

- Firebase project (already have: `st-ann-ai`)
- OpenAI API key (for embeddings + chat)
- Pinecone account & API key
- Apify account (for running crawler)

---

## Step 1: Set Up Pinecone

### Create Index

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create new index:
   - **Name**: `saints-v1`
   - **Dimensions**: `1536` (for text-embedding-3-small)
   - **Metric**: `cosine`
   - **Cloud**: `AWS`
   - **Region**: `us-east-1`

3. Copy your API key and environment

✅ **Index created!**

### Add to Firebase Secrets

```bash
cd functions

# Add OpenAI key
firebase functions:secrets:set OPENAI_API_KEY
# Paste your key when prompted

# Add Pinecone key
firebase functions:secrets:set PINECONE_API_KEY
# Paste your key when prompted
```

### Add to Functions Environment

Update `/functions/.env` (for local testing):
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=saints-v1
PINECONE_ENVIRONMENT=us-east-1-aws
EMBEDDING_MODEL=text-embedding-3-large
CHAT_MODEL=gpt-4
```

---

## Step 2: Deploy Firebase Functions

```bash
cd /Users/wes/Development/ChatJP2/functions

# Deploy both functions
firebase deploy --only functions:askSky,functions:ingestSaint

# Or deploy all functions
firebase deploy --only functions
```

**Endpoints created:**
- `https://us-central1-st-ann-ai.cloudfunctions.net/askSky`
- `https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint`

---

## Step 3: Deploy Apify Actor

### Option A: Deploy via Apify Console

1. Create new actor in [Apify Console](https://console.apify.com/actors)
2. Upload files from `/actors/skymessage-crawler/`:
   - `actor.json`
   - `package.json`
   - `src/main.ts`
3. Build & publish

### Option B: Deploy via Apify CLI

```bash
cd /Users/wes/Development/ChatJP2/actors/skymessage-crawler

# Install Apify CLI
npm install -g apify-cli

# Login
apify login

# Create & deploy
apify push
```

---

## Step 4: Run First Scrape (St. Francis)

### Configure Actor Run

In Apify Console, create a new run with these environment variables:

```json
{
  "FIREBASE_PROJECT_ID": "st-ann-ai",
  "FIREBASE_CLIENT_EMAIL": "firebase-adminsdk-xxxxx@st-ann-ai.iam.gserviceaccount.com",
  "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "SAINT_SLUG": "francis-of-assisi",
  "DISPLAY_NAME": "St. Francis of Assisi",
  "START_URLS": "[{\"url\":\"https://www.newadvent.org/cathen/06221a.htm\",\"publisher\":\"New Advent\"},{\"url\":\"https://www.franciscanmedia.org/saint-of-the-day/saint-francis-of-assisi\",\"publisher\":\"Franciscan Media\"},{\"url\":\"https://www.catholic.org/saints/saint.php?saint_id=50\",\"publisher\":\"Catholic Online\"}]"
}
```

**Get Firebase credentials:**
```bash
# In Firebase Console > Project Settings > Service Accounts
# Click "Generate new private key"
```

### Run Actor

Click **"Start"** in Apify Console. It will:
1. Crawl the 3 URLs
2. Extract main content
3. Save to Firestore at `/saints/francis-of-assisi/raw/{docId}`

**Expected output:**
```
✅ Saved raw text from https://www.newadvent.org/cathen/06221a.htm
✅ Saved raw text from https://www.franciscanmedia.org/...
✅ Saved raw text from https://www.catholic.org/saints/...
```

---

## Step 5: Verify Firestore Data

Check Firebase Console > Firestore:

```
/saints
  /francis-of-assisi
    /raw
      /{auto-id-1}
        - text: "Saint Francis of Assisi was born..."
        - sourceUrl: "https://www.newadvent.org/..."
        - publisher: "New Advent"
        - displayName: "St. Francis of Assisi"
        - createdAt: 1234567890
      /{auto-id-2}
        ...
```

---

## Step 6: Ingest to Pinecone (Create Vectors)

Call the `ingestSaint` function:

```bash
curl "https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint?saintSlug=francis-of-assisi"
```

**What happens:**
1. Fetches all `/saints/francis-of-assisi/raw` docs
2. Chunks text into ~1000 word segments
3. Creates embeddings via OpenAI
4. Upserts to Pinecone namespace `saints-v1`

**Expected response:**
```json
{
  "upserted": 45,
  "saintSlug": "francis-of-assisi"
}
```

This means 45 chunks were embedded and indexed!

---

## Step 7: Test RAG Queries

### Update Frontend API Config

In `/apps/skymessage/lib/api.ts`, change:

```typescript
const USE_MOCK = false // Enable real backend
```

Update `.env.local`:
```env
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-st-ann-ai.cloudfunctions.net
```

### Test in UI

1. Restart Next.js dev server
2. Navigate to SkyMessage app
3. Select "St. Francis of Assisi"
4. Ask: "How did you discover your vocation?"

**Expected flow:**
1. Frontend calls `/askSky`
2. Backend creates embedding of question
3. Pinecone searches for similar chunks
4. OpenAI generates response as Francis
5. Frontend displays answer with sources!

---

## Step 8: Batch Process All Saints

Create a script to process all 20 saints:

```bash
#!/bin/bash
# run-all-saints.sh

SAINTS=(
  "francis-of-assisi"
  "therese-of-lisieux"
  "teresa-of-calcutta"
  "john-paul-ii"
  "augustine-of-hippo"
  "thomas-aquinas"
  "catherine-of-siena"
  "ignatius-of-loyola"
  "padre-pio"
  "maximilian-kolbe"
  "faustina-kowalska"
  "joan-of-arc"
  "benedict-of-nursia"
  "dominic-guzman"
  "kateri-tekakwitha"
  "john-henry-newman"
  "bernadette-soubirous"
  "gianna-beretta-molla"
  "josemaria-escriva"
  "scholastica"
)

BASE_URL="https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint"

for saint in "${SAINTS[@]}"; do
  echo "Processing $saint..."
  curl "$BASE_URL?saintSlug=$saint"
  echo ""
  sleep 5 # Rate limiting
done

echo "✅ All saints processed!"
```

---

## Architecture Diagram

```
┌─────────────────┐
│   Web Sources   │ (New Advent, Vatican, Catholic.org)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apify Crawler  │ (Scrape & extract content)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Firestore    │ /saints/{slug}/raw
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ingestSaint CF  │ (Chunk + Embed)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Pinecone     │ saints-v1 namespace
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   askSky CF     │ (RAG: Query + Generate)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js UI     │ (Chat interface)
└─────────────────┘
```

---

## Cost Estimates

### Per Saint (3 source URLs, ~10k words total)

- **Apify**: Free tier (5k CUs/month = ~100 crawls)
- **OpenAI Embeddings**: ~$0.03 (10k words = 10 chunks × $0.0001/1k tokens)
- **Pinecone**: Free tier (1 index, 100k vectors)
- **Firebase Functions**: ~$0.01 per invocation
- **Storage**: Negligible

**Total per saint**: ~$0.05

**All 20 saints**: ~$1.00 one-time setup

### Ongoing Costs

- **Queries**: ~$0.001 per question (embedding + OpenAI chat)
- **Expected monthly (100 users, 10 questions each)**: ~$10-15

---

## Monitoring

### Check Pinecone Index Stats

```bash
curl -X GET "https://saints-v1-xxxxx.svc.us-east-1-aws.pinecone.io/describe_index_stats" \
  -H "Api-Key: YOUR_PINECONE_KEY"
```

### Check Firebase Logs

```bash
firebase functions:log --only askSky,ingestSaint
```

### View Apify Run History

https://console.apify.com/actors/runs

---

## Troubleshooting

### "No raw docs" error
- Verify Firestore has data at `/saints/{slug}/raw`
- Check Apify actor completed successfully

### "Pinecone connection failed"
- Verify PINECONE_API_KEY secret is set
- Check index name matches `saints-v1`
- Confirm dimensions = 3072

### "No results found"
- Check Pinecone has vectors (describe_index_stats)
- Verify saintSlug matches exactly
- Try broader query

### Embeddings taking too long
- Reduce chunk size in `chunker.js`
- Use `text-embedding-3-small` (cheaper, faster)
- Batch multiple chunks per API call

---

## Next Steps

1. ✅ Deploy functions
2. ✅ Set up Pinecone
3. ✅ Run first scrape (Francis)
4. ✅ Test ingest pipeline
5. ✅ Verify RAG works in UI
6. Scale to all 20 saints
7. Add cron job for periodic content updates
8. Implement caching for common queries
9. Add user feedback collection

---

## Production Checklist

- [ ] Firebase functions deployed
- [ ] Pinecone index created & configured
- [ ] Secrets set (OPENAI_API_KEY, PINECONE_API_KEY)
- [ ] Apify actor deployed
- [ ] At least 1 saint fully ingested
- [ ] Frontend connected to real backend
- [ ] RAG query tested successfully
- [ ] Error handling & logging in place
- [ ] Rate limiting configured
- [ ] Source attribution displaying correctly


