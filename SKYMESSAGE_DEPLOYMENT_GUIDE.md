# SkyMessage Deployment Guide
## Deploy to skymessage.chatjp2.app

---

## 📋 Prerequisites

- Firebase project already configured (ChatJP2)
- Vercel account (recommended for Next.js)
- Domain access to configure DNS for `skymessage.chatjp2.app`

---

## 🚀 Step 1: Deploy Firebase Functions

### 1.1 Ensure Functions are Ready

Check that the SkyMessage functions are exported in `/functions/index.js`:
- ✅ `exports.askSky`
- ✅ `exports.ingestSaint`

### 1.2 Set Firebase Secrets

```bash
cd /Users/wes/Development/ChatJP2/functions

# Set OpenAI API key (if not already set)
firebase functions:secrets:set OPENAI_API_KEY

# Set Pinecone API key (if not already set)
firebase functions:secrets:set PINECONE_API_KEY
```

### 1.3 Deploy Functions

```bash
# Deploy all functions (including askSky and ingestSaint)
firebase deploy --only functions

# Or deploy only SkyMessage functions
firebase deploy --only functions:askSky,functions:ingestSaint
```

### 1.4 Get Function URLs

After deployment, note the function URLs:
```
https://us-central1-[project-id].cloudfunctions.net/askSky
https://us-central1-[project-id].cloudfunctions.net/ingestSaint
```

---

## 🌐 Step 2: Deploy Next.js App (Vercel)

### 2.1 Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### 2.2 Configure Environment Variables

Create `/apps/skymessage/.env.production`:

```env
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-[project-id].cloudfunctions.net
```

### 2.3 Deploy to Vercel

```bash
cd /Users/wes/Development/ChatJP2/apps/skymessage

# Login to Vercel
vercel login

# Deploy (first time - will prompt for project setup)
vercel

# Follow prompts:
# - Link to existing project? No (create new)
# - Project name: skymessage
# - Framework: Next.js
# - Root directory: apps/skymessage
```

### 2.4 Configure Custom Domain in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `skymessage.chatjp2.app`
3. Vercel will provide DNS records

---

## 🔧 Step 3: Configure DNS

### Option A: If chatjp2.app is on Vercel

Add a CNAME record:
```
Type: CNAME
Name: skymessage
Value: cname.vercel-dns.com
```

### Option B: If chatjp2.app is elsewhere

Add an A record pointing to Vercel's IP (Vercel will provide this)

---

## 🧪 Step 4: Test Deployment

### 4.1 Test Backend Functions

```bash
# Test askSky function
curl -X POST https://us-central1-[project-id].cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Who are you?",
    "saintSlug": "francis-of-assisi",
    "style": "saint"
  }'
```

### 4.2 Test Frontend

1. Visit `https://skymessage.chatjp2.app`
2. Select a saint from the contact list
3. Send a test message

---

## 📊 Step 5: Monitor & Verify

### Check Firebase Functions Logs
```bash
firebase functions:log --only askSky,ingestSaint
```

### Check Vercel Deployment Logs
```bash
vercel logs
```

---

## 🔐 Security Checklist

- ✅ Firebase Functions have CORS enabled (already configured in code)
- ✅ Secrets are set in Firebase (not in .env files)
- ✅ Pinecone API keys are secured
- ✅ Frontend only exposes public function URLs

---

## 🎯 Production Environment Variables

### Backend (Firebase Functions - via secrets)
```
OPENAI_API_KEY=sk-proj-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=saints-v1
PINECONE_NAMESPACE=saints-v1
EMBEDDING_MODEL=text-embedding-3-small
CHAT_MODEL=gpt-4o
```

### Frontend (Vercel - via dashboard or .env.production)
```
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-[project-id].cloudfunctions.net
```

---

## 🚨 Troubleshooting

### Issue: CORS errors in browser
**Solution**: Ensure `setCorsHeaders` is called in both `askSky` and `ingestSaint`

### Issue: 404 on function URLs
**Solution**: Run `firebase deploy --only functions` again

### Issue: Domain not resolving
**Solution**: DNS propagation can take 24-48 hours. Use `dig skymessage.chatjp2.app` to check

### Issue: API calls failing
**Solution**: Check Firebase Functions logs for errors

---

## 📝 Quick Deploy Commands

```bash
# Backend
cd /Users/wes/Development/ChatJP2/functions
firebase deploy --only functions:askSky,functions:ingestSaint

# Frontend
cd /Users/wes/Development/ChatJP2/apps/skymessage
vercel --prod
```

---

## 🎉 Post-Deployment

1. Update `SKYMESSAGE_README.md` with production URLs
2. Test all saint selections and chat modes
3. Monitor Firebase usage and Vercel analytics
4. Consider setting up monitoring alerts

---

## Alternative: Deploy Frontend to Firebase Hosting

If you prefer to keep everything in Firebase:

```bash
cd /Users/wes/Development/ChatJP2/apps/skymessage

# Build the Next.js app
npm run build

# Configure Firebase hosting
firebase init hosting

# Deploy
firebase deploy --only hosting:skymessage
```

Then configure Firebase Hosting for the subdomain.

