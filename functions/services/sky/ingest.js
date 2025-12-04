/**
 * SkyMessage - Ingest Saint Content
 * Embed and upsert Firestore docs to Pinecone
 */

const admin = require("firebase-admin");
const { chunkText, sha } = require("./chunker");
const { upsertChunks } = require("./pinecone");
const OpenAI = require("openai");

const NAMESPACE = "saints-v1";

async function ingestSaint(req, res) {
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  // Set CORS headers for all requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
    const db = admin.firestore();
    
    const { saintSlug } = req.query;

    if (!saintSlug) {
      return res.status(400).json({ error: "saintSlug required" });
    }

    const snap = await db
      .collection("saints")
      .doc(saintSlug)
      .collection("raw")
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: "no raw docs" });
    }

    // Ensure main saint document exists (create/update from raw metadata)
    const mainDocRef = db.collection("saints").doc(saintSlug);
    const mainDoc = await mainDocRef.get();
    
    // Extract metadata from raw documents (use first non-null value found)
    let metadata = {
      displayName: null,
      feastDay: null,
      era: null,
      patronages: null,
    };
    
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      if (!metadata.displayName && data.displayName) metadata.displayName = data.displayName;
      if (!metadata.feastDay && data.feastDay) metadata.feastDay = data.feastDay;
      if (!metadata.era && data.era) metadata.era = data.era;
      if (!metadata.patronages && data.patronages) metadata.patronages = data.patronages;
    }
    
    // Create or update main document if missing fields
    if (!mainDoc.exists) {
      // Create main document with metadata from raw
      await mainDocRef.set({
        slug: saintSlug,
        display_name: metadata.displayName || saintSlug,
        feast_day: metadata.feastDay || null,
        era: metadata.era || null,
        patronages: metadata.patronages || [],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: false });
      console.log(`[ingest] Created main document for ${saintSlug}`);
    } else {
      // Update main document with any missing metadata
      const updateData = {};
      const existingData = mainDoc.data();
      
      if (!existingData.display_name && metadata.displayName) {
        updateData.display_name = metadata.displayName;
      }
      if (!existingData.feast_day && metadata.feastDay) {
        updateData.feast_day = metadata.feastDay;
      }
      if (!existingData.era && metadata.era) {
        updateData.era = metadata.era;
      }
      if ((!existingData.patronages || existingData.patronages.length === 0) && metadata.patronages) {
        updateData.patronages = metadata.patronages;
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();
        await mainDocRef.update(updateData);
        console.log(`[ingest] Updated main document for ${saintSlug} with:`, Object.keys(updateData));
      }
    }

    const chunks = [];
    let idx = 0;

    for (const doc of snap.docs) {
      const {
        text,
        sourceUrl,
        publisher,
        displayName,
        feastDay,
        era,
        patronages,
      } = doc.data() || {};

      if (!text) continue;

      const parts = chunkText(String(text));

      for (const part of parts) {
        const id = sha(`${saintSlug}-${idx}-${part.slice(0, 80)}`);

        const emb = await openai.embeddings.create({
          model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
          input: part,
        });

        chunks.push({
          id,
          values: emb.data[0].embedding,
          metadata: {
            saintSlug,
            idx,
            text: part,
            sourceUrl,
            publisher,
            displayName,
            feastDay,
            era,
            patronages,
          },
        });

        idx++;
      }
    }

    await upsertChunks(NAMESPACE, chunks);

    res.json({ upserted: chunks.length, saintSlug });
  } catch (e) {
    console.error("ingestSaint error:", e);
    // Ensure CORS headers are set even on error
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}

module.exports = {
  ingestSaint,
};

