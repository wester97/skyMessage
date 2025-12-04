# Environment Variables for Firebase Functions

## Overview

Firebase Functions use **secrets** for production (stored securely in Firebase), but local scripts need environment variables for development.

## Best Practices

### For Production (Firebase Functions)
- ✅ Use **Firebase Secrets** (configured via `firebase functions:secrets:set`)
- ✅ Secrets are automatically available in deployed functions
- ✅ Never commit secrets to git

### For Local Scripts
- ✅ Use `.env` file in `functions/` directory (git-ignored)
- ✅ Scripts explicitly load `.env` using `dotenv` package
- ✅ `.env` is only for local development, not deployed

## Setup

### 1. Create `.env` file (for local scripts only)

```bash
cd functions
cp .env.example .env
# Edit .env with your API keys
```

### 2. Set Firebase Secrets (for production)

```bash
cd functions
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set PINECONE_API_KEY
```

## Deployment

**Important**: The `.env` file can cause conflicts during deployment because Firebase CLI tries to load it as environment variables, which conflicts with secrets.

### Option 1: Use the deployment script (Recommended)

```bash
cd functions
npm run deploy          # Deploys all functions
npm run deploy:askSky  # Deploys only askSky
```

The script automatically handles `.env` by temporarily renaming it during deployment.

### Option 2: Manual deployment

If deploying manually, temporarily rename `.env`:

```bash
cd functions
mv .env .env.backup
firebase deploy --only functions
mv .env.backup .env
```

### Option 3: Use raw deploy command

If you need to use `firebase deploy` directly:

```bash
cd functions
npm run deploy:raw
```

But you'll need to handle `.env` manually (rename it first).

## Local Script Execution

Scripts like `backfill-from-pinecone.js` will:
1. Try to load `.env` file (if it exists)
2. Fall back to environment variables
3. Try to fetch from Firebase secrets via CLI
4. Show helpful error messages if keys are missing

Example:
```bash
cd functions
node scripts/backfill-from-pinecone.js
```

## Troubleshooting

### "Secret environment variable overlaps non secret environment variable"
- **Cause**: `.env` file exists and Firebase is trying to load it during deployment
- **Fix**: Use `npm run deploy` (uses script that handles this) or manually rename `.env` before deploying

### Script can't find API keys
- **Fix 1**: Create `functions/.env` file with your keys
- **Fix 2**: Export environment variables:
  ```bash
  export PINECONE_API_KEY=$(firebase functions:secrets:access PINECONE_API_KEY)
  export OPENAI_API_KEY=$(firebase functions:secrets:access OPENAI_API_KEY)
  ```
- **Fix 3**: Use inline:
  ```bash
  PINECONE_API_KEY=$(firebase functions:secrets:access PINECONE_API_KEY) \
  OPENAI_API_KEY=$(firebase functions:secrets:access OPENAI_API_KEY) \
  node scripts/backfill-from-pinecone.js
  ```

