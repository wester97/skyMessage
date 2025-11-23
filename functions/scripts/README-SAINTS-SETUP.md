# Saints Database Setup Guide

## Quick Start

### 1. Set Environment Variables

Create or update `functions/.env`:

```bash
# Database connection (same as your main database)
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Optional: specify different database name (defaults to 'skymessage')
SKYMESSAGE_DB_NAME=skymessage
```

### 2. Create the Database (if it doesn't exist)

```bash
# Using psql
createdb skymessage

# Or using environment variables
createdb -h $DB_HOST -U $DB_USER skymessage
```

### 3. Run the Setup Script

```bash
cd functions
node scripts/setup-saints-database.js
```

This script will:
- ✅ Check database connection
- ✅ Create the `saints` table (if it doesn't exist)
- ✅ Migrate all saints from `apps/skymessage/lib/seed.ts`
- ✅ Add URLs from `scripts/saints-170-for-new-advent.json`
- ✅ Verify the data was inserted correctly

## What Gets Migrated

### From `apps/skymessage/lib/seed.ts`:
- All saint metadata (slug, displayName, era, feastDay, etc.)
- Patronages, aliases, birth/death dates
- Image URLs

### From `scripts/saints-170-for-new-advent.json`:
- Scrape URLs matched by slug
- Publisher information for each URL

## Verification

After running the setup, verify the data:

```bash
# Connect to database
psql -d skymessage

# Check saints count
SELECT COUNT(*) FROM saints;

# Check saints with URLs
SELECT COUNT(*) FROM saints WHERE jsonb_array_length(scrape_urls) > 0;

# View a sample saint
SELECT slug, display_name, jsonb_array_length(scrape_urls) as url_count 
FROM saints 
LIMIT 10;
```

## Troubleshooting

### Connection Errors

**Error: `ECONNREFUSED`**
- Check PostgreSQL is running
- Verify DB_HOST and DB_PORT are correct
- Check firewall settings

**Error: `3D000` (database does not exist)**
```bash
createdb skymessage
```

**Error: `28P01` (authentication failed)**
- Verify DB_USER and DB_PASSWORD
- Check database user permissions

### Migration Errors

**Error: `relation "saints" already exists`**
- This is fine - the table already exists
- The script will update existing data

**Error: `could not parse SEED_SAINTS`**
- Check that `apps/skymessage/lib/seed.ts` exists
- Verify the file format is correct

## Manual Migration

If you prefer to run steps manually:

### 1. Create Table
```bash
psql -d skymessage -f functions/migrations/create_saints_table.sql
```

### 2. Migrate Data
```bash
cd functions
node scripts/migrate-saints-to-db.js
```

## Next Steps

After setup is complete:

1. **Test the API**:
   ```bash
   curl http://localhost:5001/st-ann-ai/us-central1/api/saints
   ```

2. **Access Admin UI**:
   - Navigate to `/admin/saints` in your admin interface

3. **Start Development**:
   - The database is ready
   - API routes are available
   - Admin UI is functional

