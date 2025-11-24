# SkyMessage Deployment Guide

This guide covers deploying SkyMessage to Firebase Hosting and Functions.

## Prerequisites

1. **Firebase CLI**: Install if not already installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**: Authenticate with Firebase
   ```bash
   firebase login
   ```

3. **Firebase Project**: Ensure you have access to the `ask-sky-message` project

## Project Configuration

The project is configured to use:
- **Firebase Project**: `ask-sky-message`
- **Hosting**: Static Next.js export from `out/` directory
- **Functions**: Firebase Functions in `functions/` directory
- **Firestore**: Database named `skymessage` (not default)

## Environment Setup

### 1. Set up environment variables

Create `.env.local` in the root directory:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ask-sky-message.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ask-sky-message
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-ask-sky-message.cloudfunctions.net
```

### 2. Set up Functions secrets

In Firebase Console or via CLI, set the required secrets:
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set PINECONE_API_KEY
```

Or set them in Firebase Console:
1. Go to Firebase Console > Functions > Secrets
2. Add `OPENAI_API_KEY` and `PINECONE_API_KEY`

## Installation

Install all dependencies:
```bash
npm run install:all
```

## Building

Build the Next.js app for static export:
```bash
npm run build
```

This creates the `out/` directory with static files ready for hosting.

## Deployment

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy Individual Services

**Hosting only:**
```bash
npm run deploy:hosting
```

**Functions only:**
```bash
npm run deploy:functions
```

**Firestore rules and indexes:**
```bash
npm run deploy:firestore
```

## Local Development

### Run Emulators
```bash
npm run emulators
```

This starts:
- Functions emulator on port 5001
- Auth emulator on port 9099
- Emulator UI on port 4000

### Development Server
```bash
npm run dev
```

Runs Next.js dev server on port 3000 (or next available).

## Firebase Configuration Files

- **`.firebaserc`**: Project configuration
- **`firebase.json`**: Firebase services configuration
- **`firestore.rules`**: Firestore security rules
- **`firestore.indexes.json`**: Firestore indexes

## Functions Endpoints

After deployment, functions are available at:
- `https://us-central1-ask-sky-message.cloudfunctions.net/askSky`
- `https://us-central1-ask-sky-message.cloudfunctions.net/ingestSaint`

## Hosting URLs

After deployment, the app will be available at:
- `https://ask-sky-message.web.app`
- `https://ask-sky-message.firebaseapp.com`

## Troubleshooting

### Functions deployment fails
- Ensure secrets are set: `firebase functions:secrets:access OPENAI_API_KEY`
- Check Node.js version matches (should be 20)
- Verify dependencies are installed in `functions/` directory

### Hosting deployment fails
- Ensure `out/` directory exists (run `npm run build` first)
- Check `next.config.js` has `output: 'export'`

### CORS errors
- Verify `NEXT_PUBLIC_FUNCTIONS_URL` matches deployed functions URL
- Check functions CORS configuration in `functions/index.js`

## Database Setup

The project uses a named Firestore database called `skymessage`. To set it up:

1. Go to Firebase Console > Firestore Database
2. Create a new database named `skymessage`
3. Run migration scripts from `functions/scripts/`:
   ```bash
   cd functions
   node scripts/migrate-saints-to-firestore.js
   ```

