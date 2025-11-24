# SkyMessage

Catholic Saints Chat Application - Chat with Catholic saints using RAG (Retrieval-Augmented Generation).

## Quick Start

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Set Up Firebase Secrets

Secrets are stored in Firebase, not in files. Set them up:

```bash
cd functions
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set PINECONE_API_KEY
```

Or use Firebase Console: Functions → Secrets tab

### 3. Configure Environment Variables

Create `.env.local` in the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ask-sky-message.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ask-sky-message
NEXT_PUBLIC_FUNCTIONS_URL=https://us-central1-ask-sky-message.cloudfunctions.net
```

For local function testing, create `functions/.env`:
```env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=saints-v1
```

### 4. Run Development Server

```bash
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001)

## Deployment

### Deploy Everything
```bash
npm run deploy:all
```

### Deploy Individual Services
```bash
npm run deploy:hosting    # Hosting only
npm run deploy:functions # Functions only
npm run deploy:firestore # Firestore rules/indexes
```

### Local Emulators
```bash
npm run emulators
```

## Project Structure

```
.
├── app/              # Next.js app directory
├── components/       # React components
├── functions/        # Firebase Functions
│   ├── services/sky/ # SkyMessage backend
│   ├── routes/       # API routes
│   ├── database/     # Firestore utilities
│   └── scripts/      # Utility scripts
├── lib/              # Shared libraries
└── public/           # Static assets
```

## Features

- **Ask a Saint**: Get responses as if conversing with a Catholic saint
- **Emoji Story**: Tell saint stories in conversational emoji format
- **Source Citations**: Every response includes sources
- **Admin Interface**: Manage saints and scrape URLs

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Bootstrap 5** + React Bootstrap
- **Firebase Functions** (backend)
- **Firestore** (database)
- **Pinecone** (vector database)
- **OpenAI** (embeddings + chat)

## Firebase Configuration

- **Project**: `ask-sky-message`
- **Hosting**: Static export from `out/` directory
- **Functions**: Deployed from `functions/` directory
- **Firestore**: Named database `skymessage`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy:all` - Deploy everything
- `npm run deploy:hosting` - Deploy hosting only
- `npm run deploy:functions` - Deploy functions only
- `npm run emulators` - Start Firebase emulators

## License

MIT
