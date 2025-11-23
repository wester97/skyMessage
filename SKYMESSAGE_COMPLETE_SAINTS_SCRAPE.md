# Complete Saints Scrape - All 20 SEED_SAINTS

## ✅ What's Ready

### Updated Scraper (v2.0.0)
- **Actor ID**: `1YDqG7rQ56t0HtakP`
- **Name**: `saint-scraper`
- **Build**: 1.2.6 (just deployed)

### Saints to Scrape (20 Total)

#### From New Advent (12 saints):
1. St. Francis of Assisi
2. St. Thérèse of Lisieux
3. St. Augustine of Hippo
4. St. Thomas Aquinas
5. St. Catherine of Siena
6. St. Ignatius of Loyola
7. St. Dominic
8. St. Benedict of Nursia
9. St. Scholastica
10. St. Joan of Arc
11. St. John Henry Newman
12. St. Bernadette Soubirous

#### From Vatican (8 saints):
13. St. Teresa of Calcutta
14. St. Pio of Pietrelcina (Padre Pio)
15. St. John Paul II
16. St. Kateri Tekakwitha
17. St. Josemaría Escrivá
18. St. Maximilian Kolbe
19. St. Faustina Kowalska
20. St. Gianna Beretta Molla

---

## 🚀 How to Run the Complete Scrape

### Option 1: Via Apify Console (Recommended)

1. Go to: https://console.apify.com/actors/1YDqG7rQ56t0HtakP
2. Click **"Start"**
3. Use **build 1.2.6** (latest)
4. Leave input empty (URLs are hardcoded)
5. Click **"Run"**

**Expected Results**:
- 20 saints scraped
- ~100,000+ words total
- Dataset saved to Apify
- Pinecone Integration auto-triggered

### Option 2: Via Apify CLI

```bash
cd /Users/wes/Development/ChatJP2/actors/newadvent-saints-crawler
apify call 1YDqG7rQ56t0HtakP
```

### Option 3: Via Apify API

```bash
curl -X POST https://api.apify.com/v2/acts/1YDqG7rQ56t0HtakP/runs \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 What to Monitor

### During Scrape (5-10 minutes)
Watch the actor log for:
- `📖 Scraping: [Saint Name] from [Source]`
- `✅ Extracted: [Saint Name] (X words)`
- `💾 Saved: [Saint Name] → Dataset`

### After Scrape
Check the summary:
```
✅ Scrape complete!
📊 Saints successfully scraped: 20 / 20
📂 Data saved to Apify Dataset
```

### Pinecone Integration (10-20 minutes)
Monitor at: https://console.apify.com/integrations

Watch for:
- **Status**: Running → Succeeded
- **Vectors uploaded**: Should see ~500-1000 vectors (chunked from 20 saints)
- **Pinecone index**: `saints-v1` namespace

---

## 🔍 Verify Results

### 1. Check Apify Dataset
```bash
# Get latest dataset ID from run
# Then view it in console:
https://console.apify.com/storage/datasets/[DATASET_ID]
```

Expected fields:
- `text` (main content)
- `saintSlug` (e.g., "francis-of-assisi")
- `saintName` / `displayName`
- `publisher` ("New Advent" or "Vatican")
- `sourceUrl`
- `wordCount`
- `createdAt`

### 2. Check Pinecone Vectors
```bash
curl -X POST https://saints-v1-XXXXX.svc.aped-4627-b74a.pinecone.io/query \
  -H "Api-Key: YOUR_PINECONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "saints-v1",
    "vector": [0.1, 0.2, ...], 
    "topK": 10,
    "includeMetadata": true,
    "filter": {"saintSlug": "francis-of-assisi"}
  }'
```

Expected metadata:
- `saintSlug`
- `saintName`
- `displayName`
- `publisher`
- `sourceUrl`
- `wordCount`
- `createdAt`
- `url`

### 3. Test in SkyMessage UI
1. Visit: https://skymessage.web.app
2. Select any saint from the list
3. Ask: "Tell me about your life"
4. **Expected**: Real answer with sources!

---

## 🐛 Troubleshooting

### Issue: Some saints missing from dataset
**Check**: Actor logs for specific saints that were skipped
**Common reasons**:
- Too short (< 200 words)
- Page structure changed
- Network error

**Fix**: Manually add those saint URLs to a re-run

### Issue: Pinecone Integration failed
**Check**: Integration logs in Apify Console
**Common reasons**:
- OpenAI API key invalid
- Pinecone API key invalid
- Dataset field mapping incorrect

**Fix**: 
1. Verify secrets in Integration settings
2. Check "Dataset fields to select" includes all metadata fields
3. Re-run integration from failed dataset

### Issue: Vectors missing metadata
**Check**: Sample query in Pinecone console
**Fix**: Ensure Integration "Dataset fields to select" includes:
```json
[
  "text",
  "saintSlug",
  "saintName",
  "displayName",
  "publisher",
  "sourceUrl",
  "wordCount",
  "createdAt",
  "url"
]
```

---

## 📈 Expected Costs

### Apify
- **Compute**: ~$0.05-0.10 (10 minutes @ $0.50/hour)
- **Storage**: Negligible (dataset < 5 MB)

### OpenAI (via Pinecone Integration)
- **Embeddings**: ~500-1000 vectors
- **Model**: text-embedding-3-small
- **Cost**: ~$0.01-0.02 per 1000 vectors
- **Total**: ~$0.01-0.02

### Pinecone
- **Free tier**: 100K vectors (plenty of room)
- **Cost**: $0.00

**Total estimated cost: $0.06-0.12 per run**

---

## 🎉 Success Criteria

- [x] Scraper updated with all 20 saints
- [x] Actor deployed to Apify (build 1.2.6)
- [ ] Run completed successfully (20/20 saints)
- [ ] Dataset contains all 20 saints with metadata
- [ ] Pinecone Integration succeeded
- [ ] All saints queryable in Pinecone with metadata
- [ ] UI responds with real AI answers for all saints

---

## 📝 Next Steps After Scrape

1. **Verify Coverage**: Check that all 20 saints are in Pinecone
2. **Test Quality**: Ask each saint a few questions to verify responses
3. **Update Greetings**: Customize greeting messages in ChatInterface.tsx
4. **Add More Saints**: Repeat process with additional saints as needed
5. **Monitor Costs**: Track OpenAI usage in dashboard

---

## 🔄 Re-Running the Scrape

If you need to re-scrape (e.g., to update content):

1. **Clear old data** (optional):
   ```bash
   # Delete old vectors from Pinecone namespace
   # Or create a new namespace like "saints-v2"
   ```

2. **Run scraper** again (same steps as above)

3. **Integration will handle** the rest

**Note**: Scraper is idempotent - safe to run multiple times. Latest data wins.

---

## 📚 Reference Files

- **Saint URLs**: `/SKYMESSAGE_SAINT_URLS.json`
- **Scraper Code**: `/actors/newadvent-saints-crawler/src/main.js`
- **Actor Config**: `/actors/newadvent-saints-crawler/actor.json`
- **Seed Saints**: `/apps/skymessage/lib/seed.ts`

---

Ready to run! 🚀

