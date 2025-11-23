# SkyMessage - Saints Library Workflow

**Strategy: Crawl everything, index what you need**

This workflow builds a comprehensive saints database, then selectively indexes only your 20 curated saints.

---

## Architecture

```
┌─────────────────────────┐
│   New Advent Crawler     │ Discover ALL saints
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   /saints-library        │ 500-1000+ saints
│   /{auto-slug}/raw       │ Raw scraped data
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Link Script            │ Map your 20 saints
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   /saints/{slug}         │ Your 20 curated
│   - libraryRef           │ Links to library
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   ingestSaint            │ Embed only your 20
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Pinecone               │ Vectors for 20 saints
└─────────────────────────┘
```

---

## Step 1: Deploy New Advent Crawler

```bash
cd /Users/wes/Development/ChatJP2/actors/newadvent-saints-crawler

# Install Apify CLI
npm install -g apify-cli

# Login
apify login

# Deploy
apify push
```

### Run the Crawler

In Apify Console:

**Environment Variables:**
```json
{
  "FIREBASE_PROJECT_ID": "st-ann-ai",
  "FIREBASE_CLIENT_EMAIL": "firebase-adminsdk-xxxxx@st-ann-ai.iam.gserviceaccount.com",
  "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

**Click "Start"**

**Expected Runtime:** 15-30 minutes

**Expected Output:**
```
✅ Found saint: Saint Francis of Assisi (4521 words)
✅ Found saint: Saint Thomas Aquinas (6234 words)
✅ Found saint: Saint Catherine of Siena (3891 words)
...
✅ Crawl complete! Found 847 saints
```

---

## Step 2: Verify Library Data

Check Firestore Console:

```
/saints-library
  /francis-of-assisi
    /raw/{doc-id}: { text: "...", wordCount: 4521, ... }
  /thomas-aquinas
    /raw/{doc-id}: { text: "...", wordCount: 6234, ... }
  /catherine-of-siena
    /raw/{doc-id}: { text: "...", wordCount: 3891, ... }
  ...
  (500-1000 more saints)
```

---

## Step 3: Link Your 20 Saints

```bash
cd /Users/wes/Development/ChatJP2/scripts

# First, download Firebase service account key
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key
# Save as: /Users/wes/Development/ChatJP2/service-account-key.json

# Run linking script
node link-saints-to-library.js
```

**Expected Output:**
```
🔗 Starting saint linking process...

Processing: St. Francis of Assisi
  ✅ Found in library: francis-of-assisi
  📄 1 raw documents
  🔗 Linked to /saints/francis-of-assisi

Processing: St. Teresa of Calcutta
  ⚠️  NOT found in library: teresa-of-calcutta
  📝 Will need manual source or different crawler

...

📊 Summary:
✅ 15 saints linked to library data
⚠️  5 saints need additional sources

❗ Saints needing manual sources:
   - St. Teresa of Calcutta (teresa-of-calcutta)
   - St. John Paul II (john-paul-ii)
   - St. Gianna Beretta Molla (gianna-beretta-molla)
   - St. Padre Pio (padre-pio)
   - St. Faustina Kowalska (faustina-kowalska)

✨ Done!
```

**Why some saints aren't found:**
- New Advent is pre-1913 (doesn't have 20th century saints)
- Need to run additional crawlers for Vatican, EWTN, Catholic.org

---

## Step 4: Add Missing Saints (Manual)

For saints not in New Advent, use the original targeted crawler:

```bash
cd /Users/wes/Development/ChatJP2/actors/skymessage-crawler

# Deploy if not already done
apify push
```

Run for each missing saint with specific URLs from `SKYMESSAGE_SAINT_SOURCES.json`.

**Example for Teresa of Calcutta:**
```json
{
  "FIREBASE_PROJECT_ID": "st-ann-ai",
  "FIREBASE_CLIENT_EMAIL": "...",
  "FIREBASE_PRIVATE_KEY": "...",
  "SAINT_SLUG": "teresa-of-calcutta",
  "DISPLAY_NAME": "St. Teresa of Calcutta",
  "START_URLS": "[{\"url\":\"https://www.vatican.va/...\",\"publisher\":\"Vatican\"}]"
}
```

This will save to:
- `/saints-library/teresa-of-calcutta/raw/{doc-id}`

Then re-run the linking script.

---

## Step 5: Selective Indexing (Embed Only Your 20)

Now embed ONLY your curated 20 saints to Pinecone:

```bash
# For each of your 20 saints
curl "https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint?saintSlug=francis-of-assisi"
curl "https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint?saintSlug=therese-of-lisieux"
# ... etc
```

Or use a batch script:

```bash
#!/bin/bash
# scripts/ingest-all-curated-saints.sh

SAINTS=(
  "francis-of-assisi"
  "therese-of-lisieux"
  "teresa-of-calcutta"
  "john-paul-ii"
  "gianna-beretta-molla"
  "padre-pio"
  "augustine-of-hippo"
  "thomas-aquinas"
  "catherine-of-siena"
  "ignatius-of-loyola"
  "dominic-guzman"
  "benedict-of-nursia"
  "scholastica"
  "kateri-tekakwitha"
  "joan-of-arc"
  "john-henry-newman"
  "josemaria-escriva"
  "maximilian-kolbe"
  "faustina-kowalska"
  "bernadette-soubirous"
)

BASE_URL="https://us-central1-st-ann-ai.cloudfunctions.net/ingestSaint"

for saint in "${SAINTS[@]}"; do
  echo "📦 Ingesting $saint..."
  curl "$BASE_URL?saintSlug=$saint"
  echo ""
  sleep 3
done

echo "✅ All 20 saints ingested to Pinecone!"
```

---

## Step 6: Update ingestSaint to Use Library

Modify `/functions/services/sky/ingest.js` to read from library:

```javascript
// Instead of:
const snap = await db.collection("saints").doc(saintSlug).collection("raw").get();

// Use library reference:
const saintDoc = await db.collection("saints").doc(saintSlug).get();
const saintData = saintDoc.data();

if (saintData.libraryRef) {
  // Read from library
  const snap = await db.collection("saints-library").doc(saintSlug).collection("raw").get();
} else {
  // Fallback to direct raw data
  const snap = await db.collection("saints").doc(saintSlug).collection("raw").get();
}
```

---

## Benefits of This Approach

### ✅ Advantages

1. **Scalable**: Have 500-1000 saints ready to use
2. **Future-proof**: Add new saints without re-crawling
3. **Cost-effective**: Only embed what you use
4. **Comprehensive**: One source, many uses
5. **Flexible**: Can combine multiple sources per saint

### 📊 Data Volume

- **saints-library**: 500-1000 documents (5-10 MB)
- **Pinecone**: Only 20 saints (minimal cost)
- **Firestore**: Free tier sufficient

### 💰 Cost Breakdown

| Task | Cost |
|------|------|
| New Advent crawler (one-time) | Free (Apify tier) |
| Firestore storage (1000 saints) | ~$0.02/month |
| Embed 20 saints | ~$0.10 one-time |
| Pinecone (20 saints) | Free tier |
| **Total first month** | **~$0.12** |
| **Monthly ongoing** | **~$0.02** |

---

## Future Expansion

### Add More Sources

Create similar crawlers for:
- **Catholic.org** (modern saints)
- **EWTN Saints** (modern + multimedia)
- **Vatican.va** (official canonization documents)

### Add More Saints

1. Check if already in `saints-library`
2. If yes, just link and ingest
3. If no, run targeted crawler

### Keep Data Fresh

Run crawlers annually to pick up:
- New canonizations
- Updated biographies
- Corrected information

---

## Firestore Structure (Final)

```
/saints-library          [Read-only master database]
  /{auto-slug}
    /raw
      /{doc-id}
        - saintName
        - text
        - sourceUrl
        - publisher
        - wordCount
        - createdAt

/saints                  [Your curated 20]
  /{curated-slug}
    - displayName
    - aliases: []
    - libraryRef: "/saints-library/{slug}"
    - hasLibraryData: true
    - era: "13th century"
    - feastDay: "10-04"
    - patronages: []

/saints (no library ref) [Manual sources]
  /{slug}
    /raw
      /{doc-id}
        - text
        - sourceUrl
        - publisher
```

---

## Monitoring & Maintenance

### Check Library Coverage

```javascript
// How many saints in library?
const librarySnapshot = await db.collection("saints-library").get();
console.log(`📚 ${librarySnapshot.size} saints in library`);
```

### Check Your Saints Status

```javascript
// How many of your 20 are linked?
const saintsSnapshot = await db.collection("saints").get();
const linked = saintsSnapshot.docs.filter(doc => doc.data().hasLibraryData);
console.log(`🔗 ${linked.length}/20 saints linked to library`);
```

### Verify Pinecone Indexing

```bash
# Check how many vectors
curl -X GET "https://saints-v1-xxxxx.svc.pinecone.io/describe_index_stats" \
  -H "Api-Key: YOUR_KEY"
```

---

## Troubleshooting

### "No saints found in library"
- Check crawler completed successfully
- Verify Firestore permissions
- Look for errors in Apify logs

### "Linking script fails"
- Verify service-account-key.json is valid
- Check Firebase rules allow writes
- Ensure slugs match exactly

### "Ingest fails for linked saint"
- Check libraryRef points to correct path
- Verify raw documents exist
- Test with direct path first

---

## Next Steps

1. ✅ Deploy New Advent crawler
2. ✅ Run crawler (wait 15-30 min)
3. ✅ Verify saints-library in Firestore
4. ✅ Run linking script
5. ⏹️ Add missing modern saints
6. ⏹️ Update ingestSaint function
7. ⏹️ Ingest all 20 saints
8. ⏹️ Test in UI

Ready to start? Run the New Advent crawler first! 🚀

