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
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}

module.exports = {
  ingestSaint,
};

