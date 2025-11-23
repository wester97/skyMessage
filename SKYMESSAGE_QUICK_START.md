# SkyMessage - 5-Minute Quick Start

## Prerequisites

- Firebase project with Functions enabled
- Pinecone account with index created (`saints-v1`)
- OpenAI API key
- Apify account (for scraping)

## Step 1: Configure Environment (2 min)

Add to `functions/.env`:

```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=saints-v1
EMBEDDING_MODEL=text-embedding-3-large
CHAT_MODEL=gpt-4o
```

## Step 2: Deploy Functions (1 min)

```bash
cd functions
firebase deploy --only functions:askSky,functions:ingestSaint
```

Expected output:
```
✔  functions[askSky(us-central1)] Successful create operation.
✔  functions[ingestSaint(us-central1)] Successful create operation.
```

Note your function URLs:
- `https://us-central1-{project}.cloudfunctions.net/askSky`
- `https://us-central1-{project}.cloudfunctions.net/ingestSaint`

## Step 3: Test with St. Francis (2 min)

### Option A: Using Pre-scraped Test Data

Create a test document manually in Firestore:

**Collection**: `saints/francis-of-assisi/raw`

**Document** (auto-ID):
```json
{
  "displayName": "St. Francis of Assisi",
  "text": "Francis of Assisi was born in 1181 in Assisi, Italy. He was the son of a wealthy merchant but gave up his riches to live in poverty and serve the poor. He founded the Franciscan Order and is known for his love of nature and animals. He received the stigmata in 1224 and died in 1226. His feast day is October 4.",
  "sourceUrl": "https://www.catholic.org/saints/saint.php?saint_id=50",
  "publisher": "Catholic Online",
  "createdAt": 1699123456789
}
```

### Option B: Run Apify Actor (Full Scraping)

Skip to Step 4 in the main README.

### Ingest to Pinecone

```bash
curl "https://us-central1-{project}.cloudfunctions.net/ingestSaint?saintSlug=francis-of-assisi"
```

Expected response:
```json
{"upserted": 5, "saintSlug": "francis-of-assisi"}
```

### Test Chat

```bash
curl -X POST https://us-central1-{project}.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about your life",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

Expected response:
```json
{
  "text": "I was born in Assisi in 1181, the son of a wealthy merchant...",
  "sources": [
    {"publisher": "Catholic Online", "url": "https://..."}
  ],
  "saint": "St. Francis of Assisi"
}
```

## Done! 🎉

You now have:
- ✅ SkyMessage functions deployed
- ✅ One saint with scraped content
- ✅ Working RAG chat endpoint

## Next: Add UI Components

See `SKYMESSAGE_README.md` section "UI Integration" for React component integration.

## Troubleshooting

**"No raw docs" error?**
- Check Firestore console: `saints/francis-of-assisi/raw` should exist

**Empty response?**
- Verify Pinecone has vectors in `saints-v1` namespace
- Check Firebase Functions logs

**CORS error from browser?**
- Add your domain to `functions/index.js` allowedOrigins

## Example URLs Pack for St. Francis

Paste this into Apify actor `START_URLS`:

```json
[
  {"url":"https://www.newadvent.org/cathen/06221a.htm","publisher":"New Advent"},
  {"url":"https://www.franciscanmedia.org/saint-of-the-day/saint-francis-of-assisi","publisher":"Franciscan Media"},
  {"url":"https://www.catholic.org/saints/saint.php?saint_id=50","publisher":"Catholic Online"}
]
```

