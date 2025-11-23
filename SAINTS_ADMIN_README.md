# Saints Admin Interface

This document describes the new admin interface for managing saints in the SkyMessage system.

## Overview

The saints admin interface allows you to:
- View all saints in Firestore
- Add new saints with metadata
- Edit existing saint information
- Manage URLs to scrape for each saint
- Search and filter saints

## Database Setup

### Firestore Collection

Saints are stored in Firestore in the `saints` collection. Each document uses the saint's `slug` as the document ID.

### Migrate Seed Data

To migrate existing seed data from `apps/skymessage/lib/seed.ts` to Firestore:

```bash
cd functions
node scripts/migrate-saints-to-firestore.js
```

Or use the setup script:

```bash
cd functions
node scripts/setup-saints-database.js
```

This script will:
- Read saints from the seed file
- Read URLs from `scripts/saints-170-for-new-advent.json`
- Insert/update saints in Firestore
- Preserve existing data (updates instead of overwriting)

## Environment Variables

Firebase Admin is automatically initialized. No additional environment variables are needed for Firestore.

If running locally, make sure Firebase Admin can access your Firestore:
- Production: Uses default Firebase credentials
- Emulator: Set `FUNCTIONS_EMULATOR=true`
- Local: Firebase Admin will use default credentials or service account

## API Endpoints

The saints API is available at `/saints`:

- `GET /saints` - List all saints (supports `?page=1&limit=50&search=term`)
- `GET /saints/:slug` - Get a single saint by slug
- `POST /saints` - Create a new saint
- `PUT /saints/:slug` - Update an existing saint
- `DELETE /saints/:slug` - Delete a saint
- `POST /saints/:slug/urls` - Add a URL to scrape for a saint
- `DELETE /saints/:slug/urls/:urlIndex` - Remove a URL from a saint

### Example API Usage

```bash
# Get all saints
curl https://your-api.com/saints

# Create a new saint
curl -X POST https://your-api.com/saints \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "francis-of-assisi",
    "displayName": "St. Francis of Assisi",
    "era": "13th century",
    "feastDay": "10-04",
    "scrapeUrls": [
      {
        "url": "https://www.newadvent.org/cathen/06221a.htm",
        "publisher": "New Advent"
      }
    ]
  }'

# Add a URL to an existing saint
curl -X POST https://your-api.com/saints/francis-of-assisi/urls \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/saint-info",
    "publisher": "Example Publisher"
  }'
```

## Admin UI

Access the admin interface at:
- Local: `http://localhost:3000/admin/saints`
- Production: `https://your-domain.com/admin/saints`

### Features

1. **Search**: Search saints by name or slug
2. **Add Saint**: Click "Add Saint" to create a new saint entry
3. **Edit Saint**: Click "Edit" on any saint card to modify information
4. **Delete Saint**: Click "Delete" to remove a saint (with confirmation)
5. **Manage URLs**: Add/remove URLs to scrape for each saint

### Form Fields

- **Slug** (required): URL-friendly identifier (e.g., `francis-of-assisi`)
- **Display Name** (required): Full display name (e.g., `St. Francis of Assisi`)
- **Era**: Time period (e.g., `13th century`)
- **Feast Day**: Format MM-DD (e.g., `10-04`)
- **Birth Date**: Date string (e.g., `c. 1181`)
- **Death Date**: Date string (e.g., `1226`)
- **Birth Place**: Location (e.g., `Assisi, Italy`)
- **Image URL**: Wikimedia or other image URL
- **Aliases**: Comma-separated alternative names
- **Patronages**: Comma-separated list of patronages
- **Scrape URLs**: Array of URLs with publisher information

## Firestore Schema

The `saints` collection has the following structure:

**Collection**: `saints`  
**Document ID**: `{slug}` (e.g., `francis-of-assisi`)

**Document Fields**:
```typescript
{
  slug: string;                    // URL-friendly identifier
  display_name: string;            // Full display name
  aliases: string[];               // Alternative names
  era: string | null;             // Time period (e.g., "13th century")
  feast_day: string | null;       // Format: MM-DD (e.g., "10-04")
  patronages: string[];           // Array of patronages
  birth_date: string | null;      // Date string (e.g., "c. 1181")
  death_date: string | null;      // Date string (e.g., "1226")
  birth_place: string | null;     // Location (e.g., "Assisi, Italy")
  image_url: string | null;      // Wikimedia or other image URL
  scrape_urls: Array<{            // Array of URLs to scrape
    url: string;
    publisher: string;
  }>;
  created_at: Timestamp;          // Auto-set on creation
  updated_at: Timestamp;          // Auto-updated on modification
}
```

## Migration from Seed Data

The migration script (`functions/scripts/migrate-saints-to-firestore.js`) will:

1. Read saints from `apps/skymessage/lib/seed.ts`
2. Read URLs from `scripts/saints-170-for-new-advent.json`
3. Match URLs to saints by slug
4. Insert new saints or update existing ones in Firestore
5. Preserve any manually added data

Run it whenever you update the seed file:

```bash
cd functions
node scripts/migrate-saints-to-firestore.js
```

## Next Steps

1. **Migrate seed data** to populate initial saints in Firestore
2. **Access the admin UI** to manage saints
3. **Add URLs** for saints that need scraping
4. **Update the scraper** to read from Firestore instead of seed files

## Integration with Scraper

The scraper (Apify actor) can be updated to read from Firestore:

```javascript
// Instead of reading from seed file:
const admin = require('firebase-admin');
const db = admin.firestore();
const saintsSnapshot = await db.collection('saints')
  .where('scrape_urls', '!=', [])
  .get();

const saints = saintsSnapshot.docs.map(doc => ({
  slug: doc.id,
  ...doc.data()
}));
```

This allows dynamic management of which saints to scrape and which URLs to use.

