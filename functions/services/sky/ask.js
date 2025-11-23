/**
 * SkyMessage - Ask a Saint (RAG)
 */

const { queryChunks } = require("./pinecone");
const OpenAI = require("openai");

const NAMESPACE = "saints-v1";

const SAINT_SYSTEM = (displayName) => `
You ARE ${displayName}. You must respond AS ${displayName}, not ABOUT ${displayName}.

CRITICAL CHARACTER RULES:
- You MUST fully assume the identity of ${displayName} and respond in first person as if you ARE them
- NEVER break character or say things like "I'm not ${displayName}" or "I can tell you about ${displayName}"
- NEVER refer to ${displayName} in third person (e.g., "he did", "she was") - always use first person ("I did", "I was")
- Accept any form of address the user uses (e.g., "St. Andrew", "Andrew", "Saint Andrew") and respond naturally as that person
- If the user addresses you by name (even with variations like "St. Andrew" vs "Andrew"), respond as that person - you ARE them
- Always speak in first person with humility and charity, as ${displayName} would

CONTENT RULES:
- Use ONLY retrieved facts from context below. If unsure, say you're unsure.
- Prefer official Church teaching; avoid private revelation claims.
- Keep it concise unless asked for more. Cite sources in brackets like [Vatican] or [New Advent].
- Remember: You are speaking as ${displayName} themselves, not as a narrator or biographer.
`;

const EMOJI_SYSTEM = (displayName) => `
Write ${displayName}'s life as 8–12 short emoji segments for kids.
Each segment should be: emoji(s) + one short sentence.
CRITICAL: Separate each segment with a blank line (double newline).
No dates unless asked. No direct quotes. Joyful, simple.
Only use facts in context. End with a hopeful takeaway.

IMPORTANT: Choose emojis appropriate to the saint's gender:
- For MALE saints: 👨 👦 🧔 🤴 👨‍🦱 (people), 👔 🥼 (clothes), 👨‍⚕️ (priest/monk), 🧑‍🌾 (worker)
- For FEMALE saints: 👩 👧 👸 👰 👩‍🦱 (people), 👚 🧥 (clothes), 👩‍🏫 (nun/teacher), 🤱 (mother)
- Gender-neutral items OK: 📖 ⛪ ✝️ 🙏 ❤️ 🌟 🕊️ 👑 🏰 ⚔️ 🌹

CRITICAL clothing examples:
- Male giving away clothes: 👔💸 or 🧥💫 NOT 👗
- Female giving away clothes: 👗💸 or 👚💫 OK
- Use 👕 or 🧥 for gender-neutral clothing

Example format for a FEMALE saint:
👸✨ Born a princess in a beautiful castle, I had a life full of adventure!

👰💔 I married a king, but soon faced sadness when he passed away.

Example format for a MALE saint:
👦🏰 Born into a wealthy family, I loved fancy clothes and parties!

👔💫 I gave away all my expensive clothes to help the poor!
`;

async function askSaint(req, res) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
    
    const {
      query,
      saintSlug,
      style = "saint",
      audience = "adult",
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query required" });
    }

    // 1) Make embedding of the question
    const qEmbed = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: query.slice(0, 8000),
    });
    const qVec = qEmbed.data[0].embedding;

    // 2) Vector search with filter if saint specified
    const pineRes = await queryChunks(
      NAMESPACE,
      qVec,
      12,
      saintSlug ? { saintSlug } : undefined
    );

    const contexts = (pineRes.matches || [])
      .map(
        (m) =>
          `Source: ${m.metadata?.publisher || "Unknown"} | ${
            m.metadata?.sourceUrl
          }\n${m.metadata?.text || m.metadata?.raw || ""}`
      )
      .join("\n\n");

    // Fallback saint display name from metadata
    const displayName =
      pineRes.matches?.[0]?.metadata?.displayName ||
      (saintSlug || "the saint");

    const system =
      style === "emoji-story"
        ? EMOJI_SYSTEM(String(displayName))
        : SAINT_SYSTEM(String(displayName));

    const prompt = [
      { role: "system", content: system },
      { role: "system", content: `Audience: ${audience}` },
      {
        role: "system",
        content: `Context (sources, do not quote verbatim liturgical texts):\n${contexts}`,
      },
      {
        role: "user",
        content:
          style === "plain" ? query : `Answer as ${displayName}: ${query}`,
      },
    ];

    const chat = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || "gpt-4o",
      messages: prompt,
      temperature: style === "emoji-story" ? 0.7 : 0.3,
    });

    const text = chat.choices[0]?.message?.content || "";

    // Build simple source badge list
    const badges = (pineRes.matches || []).slice(0, 4).map((m) => ({
      publisher: m.metadata?.publisher,
      url: m.metadata?.sourceUrl,
    }));

    const response = {
      text,
      sources: badges,
      saint: String(displayName),
    };

    res.json(response);
  } catch (e) {
    console.error("askSaint error:", e);
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}

module.exports = {
  askSaint,
};

