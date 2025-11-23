# SkyMessage Migration Checklist
## Quick Reference for `ask-sky-message` Project Migration

---

## ✅ Pre-Migration

- [ ] New Firebase project `ask-sky-message` created
- [ ] Project added to `.firebaserc` with alias `skymessage`
- [ ] Firebase CLI authenticated: `firebase login`
- [ ] Can switch projects: `firebase use skymessage`

---

## 🔐 Secrets Setup

- [ ] `OPENAI_API_KEY` set: `firebase functions:secrets:set OPENAI_API_KEY`
- [ ] `PINECONE_API_KEY` set: `firebase functions:secrets:set PINECONE_API_KEY`
- [ ] Secrets verified: `firebase functions:secrets:list`

---

## 📦 Firestore Data Migration

- [ ] Default Firestore database enabled in new project
- [ ] `saints` collection exported from `st-ann-ai` (default database)
- [ ] `saints` collection imported to `ask-sky-message` (default database)
- [ ] Verify data: Check that saints documents exist in new project
- [ ] Verify subcollections: Check `saints/{slug}/raw` subcollections exist

---

## 🏗️ Functions Setup

- [ ] `functions-skymessage` directory created
- [ ] `services/sky` copied to `functions-skymessage/services/`
- [ ] `index.js` created in `functions-skymessage/`
- [ ] `package.json` created in `functions-skymessage/`
- [ ] Dependencies installed: `cd functions-skymessage && npm install`
- [ ] Code uses default database (already correct: `admin.firestore()`)

---

## 🚀 Deployment

- [ ] Functions deployed: `firebase deploy --only functions:askSky,functions:ingestSaint`
- [ ] Function URLs verified:
  - `https://us-central1-ask-sky-message.cloudfunctions.net/askSky`
  - `https://us-central1-ask-sky-message.cloudfunctions.net/ingestSaint`
- [ ] Test `askSky` endpoint with curl or Postman
- [ ] Test `ingestSaint` endpoint (if needed)

---

## 🌐 Frontend Update

- [ ] New Firebase config obtained from Firebase Console
- [ ] `apps/skymessage` updated with new Firebase config
- [ ] Function URLs updated in `apps/skymessage/lib/api.ts` (or wherever API calls are made)
- [ ] Frontend tested locally
- [ ] Frontend deployed to Vercel (or hosting platform)

---

## ✅ Verification

- [ ] Can query saints from new Firestore database
- [ ] `askSky` function returns correct responses
- [ ] Frontend can connect to new functions
- [ ] No CORS errors
- [ ] Pinecone queries work (if using Pinecone)
- [ ] All saint data accessible

---

## 🧹 Cleanup (Optional - After Verification)

- [ ] Old `askSky` function removed from `st-ann-ai` project
- [ ] Old `ingestSaint` function removed from `st-ann-ai` project
- [ ] Old `saints` collection archived/backed up (keep as backup for now)
- [ ] Documentation updated with new project info

---

## 📝 Notes

- **Database**: Uses default Firestore database (not a named database)
- **Collection Structure**: `saints/{slug}` with subcollection `saints/{slug}/raw`
- **Function Memory**: `askSky` uses 512MiB, `ingestSaint` uses 1GiB
- **Timeout**: `askSky` 60s, `ingestSaint` 540s (9 minutes)

---

## 🆘 Rollback Plan

If issues occur:
1. Keep old functions active in `st-ann-ai` until migration verified
2. Use feature flags in frontend to switch between old/new endpoints
3. Keep old Firestore data as backup
4. Document any issues for troubleshooting

---

## Quick Commands Reference

```bash
# Switch to new project
firebase use skymessage

# Set secrets
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set PINECONE_API_KEY

# Deploy functions
cd functions-skymessage
firebase deploy --only functions:askSky,functions:ingestSaint

# View logs
firebase functions:log --only askSky,ingestSaint

# Test endpoint
curl -X POST https://us-central1-ask-sky-message.cloudfunctions.net/askSky \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello", "saintSlug": "francis-of-assisi", "style": "saint"}'
```

