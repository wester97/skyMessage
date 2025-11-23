# SkyMessage Firebase Project Migration Guide
## Migrating from `st-ann-ai` to `ask-sky-message`

---

## 📋 Overview

This guide will help you migrate SkyMessage from the shared `st-ann-ai` Firebase project to its own dedicated project: `ask-sky-message`.

**Why separate?**
- Independent scaling and billing
- Clearer security boundaries
- Deployment independence
- No quota conflicts with ChatJP2

**Database Note:**
SkyMessage uses the **default Firestore database** (not a separate named database). The `saints` collection and its subcollections (`raw`) are in the default database.

---

## ✅ Prerequisites

1. Firebase CLI installed and authenticated
2. Access to both projects:
   - Source: `st-ann-ai`
   - Target: `ask-sky-message`
3. Backup of current Firestore data
4. API keys ready (OpenAI, Pinecone)

---

## 🚀 Step 1: Create New Firebase Project

### 1.1 Create Project via Console
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Project name: `ask-sky-message`
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Initialize Firebase in Codebase
```bash
cd /Users/wes/Development/ChatJP2

# Add new project to .firebaserc
firebase use --add
# Select: ask-sky-message
# Alias: skymessage

# Verify
firebase projects:list
```

---

## 📦 Step 2: Set Up Firestore Database

### 2.1 Create Firestore Database
```bash
# Switch to new project
firebase use skymessage

# Initialize Firestore (if not already done)
firebase init firestore
# Select: Use an existing project → ask-sky-message
# Rules file: firestore.rules (use existing or create new)
# Indexes file: firestore.indexes.json (use existing or create new)
```

### 2.2 Export Data from Old Project
```bash
# Switch to old project
firebase use st-ann-ai

# Export the saints collection from default database
# Option 1: Using Firebase Console (Recommended)
# 1. Go to Firebase Console → Firestore Database
# 2. Select the 'saints' collection
# 3. Click "Export" or use the menu

# Option 2: Using gcloud (if you have access)
gcloud firestore export gs://st-ann-ai-backup/saints-export \
  --project=st-ann-ai \
  --collection-ids=saints
```

### 2.3 Import Data to New Project
```bash
# Switch to new project
firebase use skymessage

# Import the exported data to default database
# Option 1: Using Firebase Console (Recommended)
# 1. Go to Firebase Console → Firestore Database
# 2. Click "Import" and select the exported file

# Option 2: Using gcloud
gcloud firestore import gs://st-ann-ai-backup/saints-export \
  --project=ask-sky-message
```

**Note:** SkyMessage uses the default Firestore database, so we're exporting/importing the `saints` collection from the default database.

---

## 🔐 Step 3: Set Up Secrets

### 3.1 Set Secrets in New Project
```bash
firebase use skymessage

# Set OpenAI API key
echo "Enter OpenAI API key:"
firebase functions:secrets:set OPENAI_API_KEY

# Set Pinecone API key
echo "Enter Pinecone API key:"
firebase functions:secrets:set PINECONE_API_KEY

# Verify secrets are set
firebase functions:secrets:access OPENAI_API_KEY
firebase functions:secrets:access PINECONE_API_KEY
```

---

## 🏗️ Step 4: Create Separate Functions Directory

### 4.1 Create New Functions Structure
```bash
# Create new functions directory
mkdir -p functions-skymessage

# Copy SkyMessage-specific files
cp -r functions/services/sky functions-skymessage/
cp functions/package.json functions-skymessage/package.json

# Create minimal index.js for SkyMessage
```

### 4.2 Create SkyMessage Functions Index
Create `functions-skymessage/index.js`:

```javascript
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
```

### 4.3 Update Package.json
Create `functions-skymessage/package.json`:

```json
{
  "name": "skymessage-functions",
  "version": "1.0.0",
  "description": "Firebase Functions for SkyMessage",
  "main": "index.js",
  "scripts": {
    "lint": "eslint .",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^13.5.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0"
  },
  "engines": {
    "node": "20"
  }
}
```

---

## 🔧 Step 5: Update Frontend Configuration

### 5.1 Update SkyMessage App Config
Update `apps/skymessage/lib/api.ts` or wherever Firebase config is:

```typescript
// New Firebase project config
const FIREBASE_CONFIG = {
  apiKey: "YOUR_NEW_API_KEY",
  authDomain: "ask-sky-message.firebaseapp.com",
  projectId: "ask-sky-message",
  storageBucket: "ask-sky-message.firebasestorage.app",
  messagingSenderId: "YOUR_NEW_SENDER_ID",
  appId: "YOUR_NEW_APP_ID",
};

// Update function URLs
const FUNCTIONS_URL = "https://us-central1-ask-sky-message.cloudfunctions.net";
```

### 5.2 Get New Firebase Config
1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Add web app (if not exists)
4. Copy config values

---

## 📝 Step 6: Update .firebaserc

Add the new project:

```json
{
  "projects": {
    "default": "st-ann-ai",
    "prod": "st-ann-ai",
    "dev": "st-ann-ai-dev",
    "skymessage": "ask-sky-message"
  },
  "targets": {
    "st-ann-ai": {
      "hosting": {
        "chatjp2-app": ["chatjp2-app"],
        "church-app": ["stann-chatjp2-app"]
      }
    },
    "ask-sky-message": {
      "hosting": {
        "skymessage": ["skymessage"]
      }
    }
  }
}
```

---

## 🚀 Step 7: Deploy Functions

### 7.1 Install Dependencies
```bash
cd functions-skymessage
npm install
```

### 7.2 Deploy to New Project
```bash
# Make sure you're using the right project
firebase use skymessage

# Deploy functions
firebase deploy --only functions:askSky,functions:ingestSaint
```

### 7.3 Verify Deployment
```bash
# Check function URLs
firebase functions:list

# Test the endpoint
curl -X POST https://us-central1-ask-sky-message.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

---

## 🧹 Step 8: Clean Up Old Project (Optional)

### 8.1 Remove Functions from Old Project
```bash
firebase use st-ann-ai

# Remove SkyMessage functions from functions/index.js
# Delete exports.askSky and exports.ingestSaint

# Redeploy (this removes the functions)
firebase deploy --only functions:api
```

### 8.2 Archive Old Data (Optional)
The `saints` collection in the default database of `st-ann-ai` can be kept as backup or deleted after verifying migration.

---

## ✅ Verification Checklist

- [ ] New Firebase project `ask-sky-message` created
- [ ] Firestore data exported and imported
- [ ] Secrets set in new project
- [ ] Functions deployed to new project
- [ ] Frontend updated with new config
- [ ] Function URLs updated in frontend
- [ ] Test `askSky` endpoint works
- [ ] Test `ingestSaint` endpoint works
- [ ] Frontend can connect to new functions
- [ ] Old functions removed from `st-ann-ai` (optional)

---

## 🔄 Rollback Plan

If something goes wrong:

1. **Keep old functions active** until new ones are verified
2. **Use feature flags** in frontend to switch between old/new endpoints
3. **Keep old Firestore database** as backup
4. **Document any issues** encountered during migration

---

## 📊 Post-Migration

### Monitor New Project
```bash
firebase use skymessage
firebase functions:log --only askSky,ingestSaint
```

### Update Documentation
- Update `SKYMESSAGE_DEPLOYMENT_GUIDE.md`
- Update `deploy-skymessage.sh` script
- Update any CI/CD pipelines

---

## 🆘 Troubleshooting

### "Function not found"
- Verify project is correct: `firebase use skymessage`
- Check function names match: `askSky`, `ingestSaint`

### "Secret not found"
- Verify secrets are set: `firebase functions:secrets:list`
- Check secret names match: `OPENAI_API_KEY`, `PINECONE_API_KEY`

### "CORS error"
- Add your domain to `allowedOrigins` in `setCorsHeaders`
- Check function has `cors: true` in config

### "Database connection failed"
- Verify Firestore is enabled in new project
- Ensure you're using the default database (not a named database)
- Update `functions-skymessage/services/sky` to use default database instead of 'skymessage' database

---

## 📝 Notes

- Keep old functions in `st-ann-ai` until migration is verified
- Test thoroughly before removing old functions
- Consider using feature flags for gradual rollout
- Monitor both projects during transition period

