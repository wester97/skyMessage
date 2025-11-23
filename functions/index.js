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

// CORS headers function
const setCorsHeaders = (response, request) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://skymessage.chatjp2.app",
    "https://ask-sky-message.web.app",
    "https://ask-sky-message.firebaseapp.com",
  ];

  const origin = request.headers.origin;
  if (allowedOrigins.includes(origin)) {
    response.set("Access-Control-Allow-Origin", origin);
  }
  // Allow skymessage subdomains
  else if (origin && origin.match(/^https:\/\/.*skymessage.*$/)) {
    response.set("Access-Control-Allow-Origin", origin);
  }

  response.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.set("Access-Control-Allow-Credentials", "true");
};

// SkyMessage: Ask a saint endpoint
exports.askSky = onRequest(
  {
    secrets: [openaiApiKey, pineconeApiKey],
    memory: "512MiB",
    timeoutSeconds: 60,
    cors: true,
  },
  async (req, res) => {
    setCorsHeaders(res, req);
    
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }
    
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
  },
  async (req, res) => {
    setCorsHeaders(res, req);
    
    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }
    
    const { ingestSaint } = require("./services/sky");
    await ingestSaint(req, res);
  }
);

