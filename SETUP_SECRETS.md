# Setting Up Secrets for SkyMessage

Since this is a separate Firebase project (`ask-sky-message`), you need to set up secrets in this project. The secrets are stored in Firebase, not in files, so they need to be configured separately.

## Required Secrets

The following secrets need to be set in the `ask-sky-message` Firebase project:

1. **OPENAI_API_KEY** - For embeddings and chat
2. **PINECONE_API_KEY** - For vector database access

## Setting Up Secrets

### Option 1: Using Firebase CLI (Recommended)

```bash
cd ~/Development/skyMessage/functions

# Set OpenAI API key
firebase functions:secrets:set OPENAI_API_KEY
# Paste your key when prompted

# Set Pinecone API key
firebase functions:secrets:set PINECONE_API_KEY
# Paste your key when prompted
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `ask-sky-message`
3. Navigate to: **Functions** → **Secrets** tab
4. Click **Add Secret** and add:
   - `OPENAI_API_KEY` (value: your OpenAI API key)
   - `PINECONE_API_KEY` (value: your Pinecone API key)

## Getting the Secret Values

If you need to get the values from the ChatJP2 project:

### From ChatJP2 Project

```bash
cd /Users/wes/Development/ChatJP2/functions

# View secrets (will prompt for each)
firebase functions:secrets:access OPENAI_API_KEY
firebase functions:secrets:access PINECONE_API_KEY
```

Then copy these values and set them in the `ask-sky-message` project.

## Local Development (.env files)

For local development, create these files:

### `functions/.env` (for local function testing)
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=saints-v1
PINECONE_ENVIRONMENT=us-east-1-aws
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o
```

### `.env.local` (for Next.js app)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ask-sky-message.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ask-sky-message
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-ask-sky-message.cloudfunctions.net
```

**Note:** These `.env` files are for local development only. In production, the functions use Firebase Secrets, and the Next.js app uses environment variables set in your hosting platform (Firebase Hosting, Vercel, etc.).

## Verifying Secrets

After setting secrets, verify they're accessible:

```bash
cd ~/Development/skyMessage/functions
firebase functions:secrets:access OPENAI_API_KEY
firebase functions:secrets:access PINECONE_API_KEY
```

## Important Notes

- **Never commit `.env` files** - they're in `.gitignore`
- **Secrets are project-specific** - each Firebase project has its own secrets
- **Same values, different projects** - You can use the same API keys, but they need to be set in both projects
- **Functions automatically use secrets** - No code changes needed, functions will read from Firebase Secrets when deployed

