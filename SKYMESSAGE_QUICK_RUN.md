# SkyMessage - Quick Run Guide

## 🚀 One-Step Scrape → Pinecone

Your scraper now goes **directly from Apify to Pinecone**. No intermediate steps!

---

## ⚙️ Configuration (One-Time Setup)

### Step 1: Go to Apify Actor
**URL:** https://console.apify.com/actors/1YDqG7rQ56t0HtakP

### Step 2: Set Environment Variables

Click "Input" tab, add these 3 required variables:

```json
{
  "OPENAI_API_KEY": "sk-proj-YOUR_KEY_HERE",
  "PINECONE_API_KEY": "pcsk_YOUR_KEY_HERE"
}
```

**Optional** (defaults are fine):
```json
{
  "PINECONE_INDEX": "saints-v1",
  "PINECONE_NAMESPACE": "saints-v1", 
  "EMBEDDING_MODEL": "text-embedding-3-small"
}
```

### Where to get keys:

**OpenAI API Key:**
- Go to: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the `sk-proj-...` key

**Pinecone API Key:**
- Go to: https://app.pinecone.io/
- Click "API Keys" in sidebar
- Copy your key (starts with `pcsk_...`)

---

## 🎯 Run It!

### Step 3: Click "Start"

That's it! The scraper will:

1. ✅ Crawl 5 pages from New Advent
2. ✅ Find 3-5 saints  
3. ✅ Chunk the text (~1000 words per chunk)
4. ✅ Create embeddings (OpenAI)
5. ✅ Upload vectors to Pinecone
6. ✅ Done in ~2-3 minutes!

---

## 📊 Expected Output

```
Processing: https://www.newadvent.org/cathen/06221a.htm
✅ Found saint: Saint Francis of Assisi (4521 words)
   📄 Created 5 chunks
   ✅ Uploaded 5 vectors to Pinecone
💾 Saint Francis of Assisi → Pinecone complete!

Processing: https://www.newadvent.org/cathen/14564b.htm
✅ Found saint: Saint Thérèse of Lisieux (3245 words)
   📄 Created 4 chunks
   ✅ Uploaded 4 vectors to Pinecone
💾 Saint Thérèse of Lisieux → Pinecone complete!

...

✅ Crawl complete!
📊 Saints processed: 5
🔢 Total vectors uploaded to Pinecone: 23
📂 Index: saints-v1 / Namespace: saints-v1
✨ Ready to query via /askSky endpoint!
```

---

## 🧪 Test Your Data

### Option 1: Pinecone Console

1. Go to https://app.pinecone.io/
2. Select `saints-v1` index
3. Check "Indexes" tab - should show ~20-30 vectors
4. Query for "francis" to test

### Option 2: Deploy askSky Function

```bash
cd /Users/wes/Development/ChatJP2/functions
firebase deploy --only functions:askSky
```

Then test:
```bash
curl -X POST https://us-central1-st-ann-ai.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How did you discover your vocation?",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

---

## 💰 Cost Breakdown (5 Saints)

| Item | Cost |
|------|------|
| Apify crawl | FREE (free tier) |
| OpenAI embeddings (~25 chunks × 1000 words) | $0.001 |
| Pinecone storage (25 vectors) | FREE (free tier) |
| **Total** | **~$0.001** |

---

## 🔧 Troubleshooting

### "Error: OPENAI_API_KEY is required"
- Make sure you set the environment variable in Apify
- Check the key starts with `sk-proj-` or `sk-`

### "Error: PINECONE_API_KEY is required"
- Set the Pinecone API key in Apify
- Check the key starts with `pcsk_`

### "No saints found"
- The scraper may have hit non-saint pages first
- Run again - it will discover different pages

### "Rate limit exceeded"
- OpenAI rate limit hit
- Wait a few seconds and re-run
- Or reduce to maxRequestsPerCrawl: 3

---

## 📈 Next Steps

Once your 5 test saints are in Pinecone:

1. **Test the UI** - Update `/apps/skymessage/lib/api.ts`:
   ```typescript
   const USE_MOCK = false // Use real backend
   ```

2. **Deploy askSky** - Make it live:
   ```bash
   firebase deploy --only functions:askSky
   ```

3. **Add More Saints** - Remove the 5-page limit:
   - Edit `maxRequestsPerCrawl: 50` in Apify
   - Re-run to get 30-50 saints

4. **Full Dataset** - Get all saints:
   - Edit `maxRequestsPerCrawl: 5000`
   - Run once for 500+ saints
   - Costs: ~$0.50 total

---

## ✅ Quick Checklist

- [ ] Pinecone index `saints-v1` created (1536 dims)
- [ ] OpenAI API key obtained
- [ ] Pinecone API key obtained  
- [ ] Environment variables set in Apify
- [ ] Scraper run completed
- [ ] Vectors visible in Pinecone console
- [ ] askSky function tested

---

**Ready to run?** → https://console.apify.com/actors/1YDqG7rQ56t0HtakP

Just add your API keys and click "Start"! 🚀

