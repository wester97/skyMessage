const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Define secrets
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const pineconeApiKey = defineSecret("PINECONE_API_KEY");

// SkyMessage: Ask a saint endpoint
// Note: cors: true automatically handles CORS for all origins including localhost
// No manual CORS headers needed - Firebase Functions v2 handles it automatically
exports.askSky = onRequest(
  {
    secrets: [openaiApiKey, pineconeApiKey],
    memory: "512MiB",
    timeoutSeconds: 60,
    cors: true, // Automatically allows localhost and handles OPTIONS requests
    invoker: 'public', // Allow unauthenticated access (required for web clients)
  },
  async (req, res) => {
    const { askSaint } = require("./services/sky");
    await askSaint(req, res);
  }
);

// SkyMessage: Ingest saint content into Pinecone
exports.ingestSaint = onRequest(
  {
    secrets: [openaiApiKey, pineconeApiKey],
    memory: "1GiB",
    timeoutSeconds: 540, // 9 minutes for embedding many chunks
    cors: true, // Automatically allows localhost and handles OPTIONS requests
  },
  async (req, res) => {
    const { ingestSaint } = require("./services/sky");
    await ingestSaint(req, res);
  }
);

// SkyMessage: Match user with saints using AI
// Note: cors: true automatically handles CORS for all origins including localhost
// Firebase Functions v2 handles OPTIONS preflight requests automatically
// invoker: 'public' allows unauthenticated access (required for web clients)
exports.matchSaints = onRequest(
  {
    secrets: [openaiApiKey],
    memory: "512MiB",
    timeoutSeconds: 60,
    cors: true, // Automatically allows localhost and handles OPTIONS requests
    invoker: 'public', // Allow unauthenticated invocations
  },
  async (req, res) => {
    const { matchSaints } = require("./services/sky");
    await matchSaints(req, res);
  }
);

