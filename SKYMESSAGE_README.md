# SkyMessage - Catholic Saints Chat

**Chat with Catholic Saints using RAG (Retrieval-Augmented Generation)**

SkyMessage lets users ask questions and get responses as if they're conversing with Catholic saints, backed by historically accurate scraped content. It also supports "emoji story" mode for telling saint stories in a conversational, kid-friendly emoji format.

## 🏗️ Architecture

```
/actors/skymessage-crawler     # Apify actor for scraping saint content
/functions/services/sky         # Firebase Functions (backend)
/client/src/components/SkyMessage  # React UI components
/client/src/utils/skyMessageApi.js # API client
```

### Data Flow

1. **Scraping**: Apify actor crawls saint biographical content → Firestore (`saints/{slug}/raw`)
2. **Ingestion**: `ingestSaint` function chunks & embeds content → Pinecone (`saints-v1` namespace)
3. **Query**: User asks question → `askSky` function retrieves context → OpenAI generates response

## 🚀 Quick Start

### 1. Environment Setup

Add to `functions/.env`:

```bash
# SkyMessage Configuration
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=saints-v1
EMBEDDING_MODEL=text-embedding-3-large
CHAT_MODEL=gpt-4o
```

### 2. Deploy Functions

```bash
cd functions
firebase deploy --only functions:askSky,functions:ingestSaint
```

### 3. Run Apify Actor (First Saint Example)

**Actor Environment Variables:**
```
SAINT_SLUG=francis-of-assisi
DISPLAY_NAME=St. Francis of Assisi
START_URLS=[{"url":"https://www.newadvent.org/cathen/06221a.htm","publisher":"New Advent"},{"url":"https://www.vatican.va/content/john-paul-ii/en/audiences/1999/documents/hf_jp-ii_aud_19990113.html","publisher":"Vatican"}]
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Push to Apify:
```bash
cd actors/skymessage-crawler
apify push
# Then run the actor from Apify console
```

### 4. Ingest Content to Pinecone

After the actor completes:
```bash
curl "https://your-region-your-project.cloudfunctions.net/ingestSaint?saintSlug=francis-of-assisi"
```

Response:
```json
{
  "upserted": 42,
  "saintSlug": "francis-of-assisi"
}
```

### 5. Test the Chat API

**Ask as Saint:**
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How did you discover your vocation?",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

**Emoji Story:**
```bash
curl -X POST https://your-region-your-project.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "tell your life story with emojis",
    "saintSlug": "francis-of-assisi",
    "style": "emoji-story"
  }'
```

## 🎨 UI Integration

### Add to Chat Component

```jsx
import { useState } from 'react';
import SaintSelector from './components/SkyMessage/SaintSelector';
import StyleModeSelector from './components/SkyMessage/StyleModeSelector';
import SourceBadges from './components/SkyMessage/SourceBadges';
import { askSaint } from './utils/skyMessageApi';

function ChatWithSkyMessage() {
  const [mode, setMode] = useState('normal'); // 'normal' | 'saint' | 'emoji-story'
  const [selectedSaint, setSelectedSaint] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (text) => {
    // Regular ChatJP2 logic for 'normal' mode
    if (mode === 'normal') {
      // ... existing chat logic
      return;
    }

    // SkyMessage mode
    if (!selectedSaint) {
      alert('Please select a saint first');
      return;
    }

    try {
      const response = await askSaint({
        text,
        saintSlug: selectedSaint.slug,
        style: mode, // 'saint' or 'emoji-story'
      });

      setMessages(prev => [
        ...prev,
        { role: 'user', content: text },
        {
          role: 'assistant',
          content: response.text,
          sources: response.sources,
          saint: response.saint,
        },
      ]);
    } catch (error) {
      console.error('SkyMessage error:', error);
    }
  };

  return (
    <div className="chat-container">
      {/* Mode Switcher */}
      <StyleModeSelector mode={mode} onModeChange={setMode} />

      {/* Saint Selector (only show for saint/emoji-story modes) */}
      {(mode === 'saint' || mode === 'emoji-story') && (
        <SaintSelector
          selectedSaint={selectedSaint}
          onSelectSaint={setSelectedSaint}
        />
      )}

      {/* Messages */}
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            {msg.sources && <SourceBadges sources={msg.sources} />}
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
```

## 📊 Firestore Structure

```
saints/
  {saintSlug}/
    raw/
      {docId}
        - displayName: "St. Francis of Assisi"
        - text: "Francis was born in 1181..."
        - sourceUrl: "https://..."
        - publisher: "New Advent"
        - createdAt: 1699123456789
```

## 🎯 Pinecone Structure

**Index**: `saints-v1`  
**Namespace**: `saints-v1` (all saints in one namespace for cross-saint queries)

**Vector Metadata:**
```json
{
  "saintSlug": "francis-of-assisi",
  "idx": 0,
  "text": "Francis was born in Assisi...",
  "sourceUrl": "https://...",
  "publisher": "New Advent",
  "displayName": "St. Francis of Assisi",
  "era": "13th century",
  "feastDay": "10-04",
  "patronages": ["animals", "environment"]
}
```

## 🧪 Testing Checklist

- [ ] Deploy `askSky` and `ingestSaint` functions
- [ ] Run Apify actor for one saint (e.g., Francis)
- [ ] Verify Firestore has raw documents in `saints/{slug}/raw`
- [ ] Call `ingestSaint?saintSlug=francis-of-assisi`
- [ ] Verify Pinecone vectors are upserted
- [ ] Test `askSky` with `style: "saint"`
- [ ] Test `askSky` with `style: "emoji-story"`
- [ ] Integrate UI components into chat interface

## 📚 Available Saints (Seed Data)

20 saints pre-configured in `functions/services/sky/seed.js`:

- St. Francis of Assisi (13th century)
- St. Thérèse of Lisieux (19th century)
- St. Teresa of Calcutta (20th century)
- St. John Paul II (20th century)
- St. Gianna Beretta Molla (20th century)
- St. Pio of Pietrelcina (20th century)
- St. Augustine of Hippo (4th century)
- St. Thomas Aquinas (13th century)
- St. Catherine of Siena (14th century)
- St. Ignatius of Loyola (16th century)
- St. Dominic (13th century)
- St. Benedict (6th century)
- St. Scholastica (6th century)
- St. Kateri Tekakwitha (17th century)
- St. Joan of Arc (15th century)
- St. John Henry Newman (19th century)
- St. Josemaría Escrivá (20th century)
- St. Maximilian Kolbe (20th century)
- St. Faustina Kowalska (20th century)
- St. Bernadette Soubirous (19th century)

## 🔒 Content Licensing & Attribution

**Important Guardrails:**
- Store `publisher` and `sourceUrl` on every chunk
- Display source badges in UI for transparency
- Stick to factual summaries, avoid verbatim liturgical/NAB text
- Prefer public domain sources (New Advent, Vatican, etc.)
- Respect copyright and fair use

**Recommended Sources:**
- New Advent Catholic Encyclopedia (public domain)
- Vatican.va (permitted use)
- CatholicSaints.Info (varies by article)
- Franciscan Media, EWTN (check permissions)

## 🛠️ Troubleshooting

### "No raw docs" Error
- Verify Apify actor ran successfully
- Check Firestore: `saints/{saintSlug}/raw` should have documents

### Empty/Poor Responses
- Check Pinecone has vectors: query the index via dashboard
- Verify embedding model matches (`text-embedding-3-large`)
- Try increasing `topK` in `queryChunks` (currently 12)

### CORS Issues
- Ensure your domain is in `functions/index.js` allowedOrigins
- Check Firebase Functions logs for CORS errors

### High Costs
- Use `text-embedding-3-small` for cheaper embeddings (512 dimensions)
- Reduce chunk count by increasing `target` in `chunkText`
- Cache embeddings in Firestore before upserting

## 📈 Next Steps

1. **Expand Saint Coverage**: Run actor for all 20 seed saints
2. **Add Persona Refinement**: Create saint-specific system prompts
3. **Session Management**: Track conversation history per user
4. **Admin Panel**: UI for triggering ingestion, viewing stats
5. **Advanced Search**: Filter by era, patronage, feast day
6. **Voice Mode**: Add text-to-speech for saint responses

## 🤝 Contributing

SkyMessage is part of the ChatJP2 project. Follow the existing coding standards and PR process.

## 📄 License

Same as ChatJP2 parent project.

