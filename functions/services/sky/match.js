/**
 * SkyMessage - Match User with Saints using AI
 */

const OpenAI = require("openai");
const { getSaintsCollection, docToSaint } = require("../../database/saints-firestore");
const { SEED_SAINTS } = require("./seed");

const MATCH_SYSTEM = `
You are a Catholic saint matching expert. Your task is to match users with saints based on their traits, values, and preferences.

Given a user's traits and a list of saints (filtered by gender), you must:
1. Analyze the user's traits and what they indicate about their personality, values, and spiritual journey
2. Match them with saints who share similar traits, values, or life experiences
3. Return the top 10 matches in order of relevance
4. Provide a brief explanation for each match (1-2 sentences)

CRITICAL RULES:
- Only match with saints of the same gender as the user
- Consider not just exact trait matches, but also semantic similarity (e.g., "charity" matches with "service" and "compassion")
- Consider the saint's life story, patronages, and historical context
- Prioritize meaningful connections over simple keyword matching
- Return results as a JSON array with saint slugs and match explanations
`;

async function matchSaints(req, res) {
  // Handle OPTIONS preflight request
  // Note: The wrapper has cors: true, but we need to handle OPTIONS here too
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
    
    const {
      traits = [],
      gender, // 'male' or 'female'
    } = req.body;

    if (!gender) {
      return res.status(400).json({ error: "gender required" });
    }

    if (!Array.isArray(traits) || traits.length === 0) {
      return res.status(400).json({ error: "traits array required" });
    }

    // Fetch all saints from Firestore, fallback to seed data
    let allSaints;
    try {
      const collection = getSaintsCollection();
      const allDocs = await collection.get();
      allSaints = allDocs.docs.map(doc => {
        const data = docToSaint(doc);
        // Convert API format to match expected structure
        return {
          slug: data.slug || data.id,
          displayName: data.display_name || data.displayName,
          aliases: data.aliases || [],
          era: data.era || undefined,
          feastDay: data.feast_day || data.feastDay || undefined,
          patronages: data.patronages || [],
          birthDate: data.birth_date || data.birthDate || undefined,
          deathDate: data.death_date || data.deathDate || undefined,
          birthPlace: data.birth_place || data.birthPlace || undefined,
          imageUrl: data.image_url || data.imageUrl || undefined,
        };
      });
      console.log(`Fetched ${allSaints.length} saints from Firestore`);
    } catch (error) {
      console.warn("Failed to fetch from Firestore, using seed data:", error);
      allSaints = SEED_SAINTS;
    }

    // Filter saints by gender
    const genderFilteredSaints = allSaints.filter(saint => {
      const saintTraits = getSaintTraits(saint);
      return saintTraits.includes(gender);
    });

    if (genderFilteredSaints.length === 0) {
      return res.status(404).json({ error: `No ${gender} saints found` });
    }

    // Build saint summaries for the AI
    const saintSummaries = genderFilteredSaints.map(saint => {
      const saintTraits = getSaintTraits(saint);
      return {
        slug: saint.slug,
        displayName: saint.displayName,
        era: saint.era || 'Unknown era',
        patronages: saint.patronages || [],
        traits: saintTraits,
        summary: `${saint.displayName}${saint.era ? ` (${saint.era})` : ''}${saint.patronages && saint.patronages.length > 0 ? `. Patron of: ${saint.patronages.slice(0, 5).join(', ')}` : ''}`
      };
    }).map(s => 
      `- ${s.slug}: ${s.summary} (Traits: ${s.traits.filter(t => t !== gender).join(', ') || 'none'})`
    ).join('\n');

    // Build the prompt
    const userTraitsDescription = traits.join(', ');
    const prompt = `User traits: ${userTraitsDescription}
User gender: ${gender}

Available saints (${genderFilteredSaints.length} total):
${saintSummaries}

Analyze the user's traits and match them with the most relevant saints. Consider:
- Direct trait matches
- Semantic similarity (e.g., charity/service/compassion are related)
- Life experiences and spiritual journeys
- Patronages that align with the user's interests

Return a JSON object with a "matches" array containing exactly 10 matches (or fewer if not enough saints), ordered by relevance. Each match should have:
{
  "slug": "saint-slug",
  "displayName": "St. Name",
  "score": 0.0-1.0,
  "explanation": "Brief 1-2 sentence explanation of why this saint matches",
  "summary": "Brief 1-2 sentence summary of what this saint is known for (their main contributions, patronages, or notable aspects of their life)"
}

Format: { "matches": [...] }

Return ONLY valid JSON, no markdown, no code blocks.`;

    const chat = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: MATCH_SYSTEM },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent matching
      response_format: { type: "json_object" },
    });

    const text = chat.choices[0]?.message?.content || "{}";
    let matches;
    
    try {
      const parsed = JSON.parse(text);
      // Handle both { matches: [...] } and direct array responses
      matches = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.results || []);
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        matches = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.results || []);
      } else {
        throw new Error("Invalid JSON response from AI");
      }
    }

    // Validate and enrich matches with full saint data
    const enrichedMatches = matches
      .filter(m => m.slug && genderFilteredSaints.find(s => s.slug === m.slug))
      .slice(0, 10)
      .map(m => {
        const saint = genderFilteredSaints.find(s => s.slug === m.slug);
        return {
          saint: {
            slug: saint.slug,
            displayName: saint.displayName,
            era: saint.era,
            patronages: saint.patronages,
            feastDay: saint.feastDay,
            imageUrl: saint.imageUrl,
          },
          score: typeof m.score === 'number' ? m.score : 0.8, // Default score if not provided
          explanation: m.explanation || `A good match based on your traits.`,
          summary: m.summary || generateDefaultSummary(saint),
        };
      });

    // Ensure CORS headers are set (backup in case wrapper doesn't handle it)
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json({
      matches: enrichedMatches,
    });
  } catch (e) {
    console.error("matchSaints error:", e);
    // Set CORS headers even on error
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(500).json({ error: e?.message || "unknown error" });
  }
}

// Helper function to get saint traits (same logic as frontend)
function getSaintTraits(saint) {
  const traits = [];
  const name = saint.displayName.toLowerCase();
  
  // Gender detection
  if (name.includes('mary') || name.includes('catherine') || name.includes('elizabeth') || 
      name.includes('teresa') || name.includes('therese') || name.includes('cecilia') ||
      name.includes('agatha') || name.includes('lucy') || name.includes('rose') ||
      name.includes('bernadette') || name.includes('gianna') || name.includes('brigid') ||
      name.includes('adelaide') || name.includes('monica') || name.includes('clare') ||
      name.includes('joan') || name.includes('faustina') || name.includes('kateri')) {
    traits.push('female');
  } else {
    traits.push('male');
  }
  
  // Era detection
  if (saint.era) {
    const era = saint.era.toLowerCase();
    if (era.includes('1st century') || era.includes('2nd century') || era.includes('3rd century') || 
        era.includes('4th century') || era.includes('early centuries')) {
      traits.push('ancient', 'early_church');
    } else if (era.includes('19th century') || era.includes('20th century') || 
               (saint.birthDate && parseInt(saint.birthDate) >= 1800)) {
      traits.push('modern', 'recent');
    }
  }
  
  // Popularity
  const popularSaints = [
    'francis', 'augustine', 'thomas', 'john', 'mary', 'joseph', 'peter', 'paul',
    'catherine', 'teresa', 'therese', 'joan', 'anthony', 'benedict', 'ignatius',
    'patrick', 'valentine', 'christopher', 'george', 'lucy', 'cecilia'
  ];
  const isPopular = popularSaints.some(pop => name.includes(pop));
  if (isPopular) {
    traits.push('popular');
  } else {
    traits.push('obscure');
  }
  
  // Patronages
  if (saint.patronages && saint.patronages.length > 0) {
    traits.push('patronage_specific');
  } else {
    traits.push('patronage_universal');
  }
  
  // Specific virtue indicators
  const patronagesStr = (saint.patronages || []).join(' ').toLowerCase();
  if (patronagesStr.includes('poor') || patronagesStr.includes('charity') || 
      patronagesStr.includes('hospitals') || patronagesStr.includes('homeless')) {
    traits.push('charity', 'service', 'compassion');
  }
  if (patronagesStr.includes('soldiers') || patronagesStr.includes('courage') || 
      name.includes('george') || name.includes('joan')) {
    traits.push('courage', 'leadership', 'action');
  }
  if (patronagesStr.includes('students') || patronagesStr.includes('teachers') || 
      patronagesStr.includes('education') || patronagesStr.includes('philosophers')) {
    traits.push('education', 'teaching', 'wisdom');
  }
  if (name.includes('francis') || name.includes('clare') || name.includes('benedict') ||
      name.includes('domin') || name.includes('ignatius')) {
    traits.push('monastic', 'religious_life');
  }
  if (name.includes('mary') || name.includes('joseph') || name.includes('gianna') ||
      name.includes('elizabeth') || name.includes('monica')) {
    traits.push('family', 'marriage', 'lay_life');
  }
  if (name.includes('augustine') || name.includes('ignatius') || name.includes('francis')) {
    traits.push('conversion', 'transformation');
  }
  if (patronagesStr.includes('martyr') || name.includes('stephen') || 
      name.includes('lawrence') || name.includes('sebastian')) {
    traits.push('martyrdom', 'sacrifice', 'witness');
  }
  
  return traits;
}

// Generate a default summary if AI doesn't provide one
function generateDefaultSummary(saint) {
  const parts = [];
  
  if (saint.era) {
    parts.push(`Lived in the ${saint.era}`);
  }
  
  if (saint.patronages && saint.patronages.length > 0) {
    const patronagesList = saint.patronages.slice(0, 3).join(', ');
    parts.push(`Patron saint of ${patronagesList}`);
  }
  
  return parts.length > 0 ? parts.join('. ') + '.' : `A beloved Catholic saint.`;
}

module.exports = {
  matchSaints,
};

