# SkyMessage - Pinecone Configuration

## ✅ Current Setup (What You Already Have)

**Index Name:** `saints-v1`  
**Dimensions:** `1536` (for text-embedding-3-small)  
**Metric:** `cosine`  
**Cloud:** `AWS`  
**Region:** `us-east-1`

---

## 🔧 Complete Settings Object

### For Backend Functions (`/functions/services/sky/`)

```javascript
// pinecone.js
const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pc.index("saints-v1");
const NAMESPACE = "saints-v1";

module.exports = {
  index,
  NAMESPACE,
  
  // Upsert vectors
  async upsertChunks(vectors) {
    return await index.namespace(NAMESPACE).upsert(vectors);
  },
  
  // Query vectors
  async queryChunks(vector, topK = 10, filter = {}) {
    return await index.namespace(NAMESPACE).query({
      vector,
      topK,
      includeMetadata: true,
      filter
    });
  }
};
```

### Vector Format

```javascript
{
  id: "unique-hash-string",           // SHA256 of slug-index-text
  values: [0.123, -0.456, ...],      // 1536-dim array from OpenAI
  metadata: {
    saintSlug: "francis-of-assisi",  // For filtering
    saintName: "Saint Francis...",    // Display name
    displayName: "St. Francis...",    // Formatted
    publisher: "New Advent",          // Source attribution
    sourceUrl: "https://...",         // Original URL
    text: "Full chunk text...",       // The actual content
    chunkIndex: 0,                    // Position in document
    totalChunks: 12,                  // Total chunks for saint
    wordCount: 987                    // Words in this chunk
  }
}
```

---

## 🎯 Embedding Settings

### OpenAI Configuration

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create embedding
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",   // 1536 dimensions
  input: "Your text here...",
  encoding_format: "float"           // Default, can omit
});

const embedding = response.data[0].embedding;  // [1536 floats]
```

### Why `text-embedding-3-small`?

| Feature | text-embedding-3-small | text-embedding-3-large |
|---------|----------------------|----------------------|
| **Dimensions** | 1536 | 3072 |
| **Cost** | $0.02 / 1M tokens | $0.13 / 1M tokens |
| **Speed** | Fast | Slower |
| **Use Case** | Semantic search (perfect for you!) | Multi-lingual, research |
| **Quality** | Excellent for English religious text | Marginally better |

---

## 📊 Chunking Settings

```javascript
const CHUNK_CONFIG = {
  targetWords: 1000,      // ~1000 words per chunk
  overlapWords: 120,      // 120 word overlap between chunks
  minWords: 200,          // Skip chunks shorter than this
};

function chunkText(text, targetWords = 1000, overlapWords = 120) {
  const words = text.split(/\s+/);
  const chunks = [];
  let buffer = [];
  
  for (const word of words) {
    // Approximate: ~5 characters per word
    if ((buffer.join(" ").length + word.length + 1) > targetWords * 5) {
      chunks.push(buffer.join(" "));
      
      // Keep overlap for context
      const tail = buffer.slice(-Math.floor(overlapWords));
      buffer = tail.length ? tail : [];
    }
    buffer.push(word);
  }
  
  if (buffer.length) {
    chunks.push(buffer.join(" "));
  }
  
  return chunks.filter(Boolean);
}
```

**Why these numbers?**
- **1000 words** ≈ 1500 tokens ≈ optimal for embeddings
- **120 word overlap** ≈ 2-3 sentences for context continuity
- **200 min words** ≈ filters out navigation/headers

---

## 🔍 Query Settings

### For RAG (Retrieval-Augmented Generation)

```javascript
// In askSky function
const queryResults = await index.namespace("saints-v1").query({
  vector: queryEmbedding,        // User's question embedded
  topK: 12,                      // Get top 12 most similar chunks
  includeMetadata: true,         // Need the text content
  filter: {
    saintSlug: "francis-of-assisi"  // Optional: limit to specific saint
  }
});
```

**Query Parameters:**
- `topK: 12` - Get 12 chunks (enough context, not too much)
- `includeMetadata: true` - REQUIRED to get the text content
- `filter` - Optional, use when querying specific saint

### Similarity Scores

Pinecone returns cosine similarity (0 to 1):
- **0.9+**: Extremely relevant
- **0.8-0.9**: Very relevant
- **0.7-0.8**: Relevant
- **< 0.7**: Less relevant (can ignore)

---

## 🚀 Full Workflow

```
User Question
    ↓
1. Embed question → [1536 floats]
    ↓
2. Query Pinecone (topK=12, filter by saint if specified)
    ↓
3. Get matching chunks with metadata
    ↓
4. Pass to OpenAI as context
    ↓
5. Generate response as the saint
    ↓
6. Return answer + source URLs
```

---

## 🔐 Environment Variables

```bash
# .env or Firebase Secrets
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=saints-v1
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o
```

---

## 💰 Cost Estimates

### For 5 Saints (~50k words total)

**One-time Setup:**
- Embedding: 50k words ≈ 75k tokens ≈ $0.002
- Storage: 50 chunks × 1536 dims = FREE (Pinecone free tier)

**Per Query:**
- Question embedding: ~50 tokens ≈ $0.000001
- OpenAI chat (with context): ~2000 tokens ≈ $0.01

**Expected monthly (100 queries):**
- Embeddings: $0.001
- Chat: $1.00
- Pinecone: FREE
- **Total: ~$1/month**

---

## 📝 Quick Start Checklist

- [x] ✅ Pinecone index created (`saints-v1`, 1536 dims)
- [x] ✅ Apify scraper deployed
- [ ] ⏹️ Run scraper (5 saints)
- [ ] ⏹️ Download JSON from Apify
- [ ] ⏹️ Run `import-saints-to-pinecone.js`
- [ ] ⏹️ Test query with `/askSky`

---

## 🧪 Testing Your Setup

```bash
# 1. Run scraper
# Go to: https://console.apify.com/actors/Wb5A2NpH36vjohFCm
# Click "Start" (no env vars needed now!)

# 2. Download JSON
# After run completes, go to "Storage" → "Dataset" → "Export" → "JSON"
# Save as: scripts/saints-data.json

# 3. Import to Pinecone
cd scripts
export OPENAI_API_KEY=sk-proj-...
export PINECONE_API_KEY=pcsk_...
node import-saints-to-pinecone.js

# 4. Test query (after deploying askSky function)
curl -X POST https://us-central1-st-ann-ai.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How did you discover your vocation?",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

---

## 🎯 Next: Run Your First Scrape!

**Go to:** https://console.apify.com/actors/Wb5A2NpH36vjohFCm

**Click "Start"** - No configuration needed! It will:
1. Crawl 5 pages from New Advent
2. Find ~3-5 saints
3. Save to Dataset (JSON)

Takes ~1 minute. Then download and import! 🚀

