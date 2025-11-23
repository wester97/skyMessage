# SkyMessage - Catholic Saints Chat

Chat with Catholic saints using RAG (Retrieval-Augmented Generation).

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.local.example .env.local
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

### 4. Deploy Functions First

Before using the app, deploy the backend functions:

```bash
cd ../../functions
firebase deploy --only functions:askSky,functions:ingestSaint
```

See parent directory's `SKYMESSAGE_README.md` for full setup instructions.

## Features

- **Ask a Saint**: Get responses as if conversing with a Catholic saint
- **Emoji Story**: Tell saint stories in conversational emoji format
- **Source Citations**: Every response includes sources for transparency
- **20 Saints**: Pre-configured with popular Catholic saints

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Bootstrap 5** + React Bootstrap
- **Firebase Functions** (backend)
- **Pinecone** (vector database)
- **OpenAI** (embeddings + chat)

## Project Structure

```
/app              # Next.js App Router pages
/components       # React components
/lib              # API client, types, seed data
/public           # Static assets
/styles           # Global styles
```

## Development

- **Dev Server**: `npm run dev` (port 3001)
- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`

## Related Documentation

- `../../SKYMESSAGE_README.md` - Full documentation
- `../../SKYMESSAGE_QUICK_START.md` - 5-minute quickstart
- `../../SKYMESSAGE_URLS.md` - Source URLs for scraping

