/**
 * Backfill Firestore from Pinecone metadata
 * 
 * This script queries Pinecone to find all unique saints and their metadata,
 * then creates/updates Firestore documents with that information.
 * 
 * Usage:
 *   cd functions
 *   node scripts/backfill-from-pinecone.js
 */

// Load .env file if it exists (for local development)
try {
  const dotenv = require('dotenv');
  const path = require('path');
  // Try loading from functions/.env
  dotenv.config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv not installed or .env doesn't exist - that's okay
  // Script will use environment variables or try Firebase CLI
}

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getIndex } = require('../services/sky/pinecone');
const OpenAI = require('openai');

// Try to detect the namespace - check if 'saints-v1' exists, otherwise use default ''
const NAMESPACE = process.env.PINECONE_NAMESPACE || '';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    admin.initializeApp({
      projectId: "ask-sky-message",
    });
  } else if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp();
  } else {
    admin.initializeApp({
      projectId: "ask-sky-message",
    });
  }
}

const db = getFirestore(admin.app());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });

// Cache for detected namespace
let detectedNamespace = null;

/**
 * Detect which namespace has the data
 */
async function detectNamespace() {
  if (detectedNamespace !== null) {
    return detectedNamespace;
  }
  
  const index = getIndex();
  const stats = await index.describeIndexStats();
  const namespaces = stats.namespaces || {};
  
  // Determine which namespace to use
  let targetNamespace = NAMESPACE;
  if (!targetNamespace && Object.keys(namespaces).length > 0) {
    // Use the namespace with the most vectors, or default to empty string
    const sorted = Object.entries(namespaces).sort((a, b) => (b[1].recordCount || 0) - (a[1].recordCount || 0));
    targetNamespace = sorted[0][0] || '';
  }
  
  detectedNamespace = targetNamespace;
  return targetNamespace;
}

/**
 * Get the namespace object for querying
 */
async function getNamespace() {
  const index = getIndex();
  const targetNamespace = await detectNamespace();
  return targetNamespace ? index.namespace(targetNamespace) : index;
}

/**
 * Get unique saint slugs from Pinecone by querying with a dummy vector
 * This will return results from various saints, allowing us to discover them
 */
async function discoverSaints() {
  console.log('🔍 Discovering saints in Pinecone...\n');
  
  const index = getIndex();
  const stats = await index.describeIndexStats();
  const namespaces = stats.namespaces || {};
  const targetNamespace = await detectNamespace();
  
  console.log(`   Using namespace: "${targetNamespace || '(default)'}"`);
  console.log(`   Total vectors in namespace: ${namespaces[targetNamespace]?.recordCount || stats.totalRecordCount || 0}\n`);
  
  const namespace = await getNamespace();
  
  // Create a dummy query vector (all zeros) to get diverse results
  // We'll query multiple times to discover different saints
  const dummyVector = new Array(1536).fill(0.01); // Small non-zero values
  
  const saintSlugs = new Set();
  const attempts = 5; // Query multiple times to discover more saints
  
  for (let i = 0; i < attempts; i++) {
    try {
      const results = await namespace.query({
        vector: dummyVector,
        topK: 100, // Get many results
        includeMetadata: true,
      });
      
      for (const match of results.matches || []) {
        if (match.metadata?.saintSlug) {
          saintSlugs.add(match.metadata.saintSlug);
        }
      }
      
      console.log(`   Query ${i + 1}: Found ${results.matches?.length || 0} vectors, ${saintSlugs.size} unique saints`);
    } catch (error) {
      console.error(`   Error in query ${i + 1}:`, error.message);
    }
  }
  
  console.log(`\n✅ Discovered ${saintSlugs.size} unique saints in Pinecone\n`);
  return Array.from(saintSlugs);
}

/**
 * Get metadata for a specific saint by querying Pinecone with a filter
 */
async function getSaintMetadata(saintSlug) {
  const namespace = await getNamespace();
  
  // Create a dummy vector for querying
  const dummyVector = new Array(1536).fill(0.01);
  
  try {
    const results = await namespace.query({
      vector: dummyVector,
      topK: 50, // Get many chunks to find metadata
      includeMetadata: true,
      filter: {
        saintSlug: { $eq: saintSlug }
      },
    });
    
    if (!results.matches || results.matches.length === 0) {
      return null;
    }
    
    // Extract metadata from first few matches (they should have consistent metadata)
    const metadata = {
      displayName: null,
      feastDay: null,
      era: null,
      patronages: null,
      publisher: null,
      sourceUrl: null,
    };
    
    for (const match of results.matches) {
      const meta = match.metadata || {};
      if (!metadata.displayName && meta.displayName) metadata.displayName = meta.displayName;
      if (!metadata.feastDay && meta.feastDay) metadata.feastDay = meta.feastDay;
      if (!metadata.era && meta.era) metadata.era = meta.era;
      if (!metadata.patronages && meta.patronages) metadata.patronages = meta.patronages;
      if (!metadata.publisher && meta.publisher) metadata.publisher = meta.publisher;
      if (!metadata.sourceUrl && meta.sourceUrl) metadata.sourceUrl = meta.sourceUrl;
    }
    
    return metadata;
  } catch (error) {
    console.error(`   Error getting metadata for ${saintSlug}:`, error.message);
    return null;
  }
}

/**
 * Backfill Firestore from Pinecone
 */
async function backfillFromPinecone() {
  console.log('🚀 Starting backfill from Pinecone...\n');
  
  try {
    // Discover all saints in Pinecone
    const saintSlugs = await discoverSaints();
    
    if (saintSlugs.length === 0) {
      console.log('⚠️  No saints found in Pinecone\n');
      return;
    }
    
    const saintsCollection = db.collection('saints');
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const skippedSaints = [];
    
    console.log('📝 Processing saints...\n');
    
    for (const slug of saintSlugs) {
      try {
        // Get metadata from Pinecone
        const metadata = await getSaintMetadata(slug);
        
        if (!metadata) {
          console.log(`   ⚠️  No metadata found for: ${slug}`);
          skipped++;
          skippedSaints.push({ slug, reason: 'No metadata in Pinecone' });
          continue;
        }
        
        const docRef = saintsCollection.doc(slug);
        const existingDoc = await docRef.get();
        
        if (!existingDoc.exists) {
          // Create new document
          await docRef.set({
            slug: slug,
            display_name: metadata.displayName || slug,
            feast_day: metadata.feastDay || null,
            era: metadata.era || null,
            patronages: metadata.patronages || [],
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          created++;
          console.log(`   ✨ Created: ${slug} (${metadata.displayName || slug})`);
        } else {
          // Update existing document with missing metadata
          const existingData = existingDoc.data();
          const updateData = {};
          
          if (!existingData.display_name && metadata.displayName) {
            updateData.display_name = metadata.displayName;
          }
          if (!existingData.feast_day && metadata.feastDay) {
            updateData.feast_day = metadata.feastDay;
          }
          if (!existingData.era && metadata.era) {
            updateData.era = metadata.era;
          }
          if ((!existingData.patronages || existingData.patronages.length === 0) && metadata.patronages) {
            updateData.patronages = metadata.patronages;
          }
          
          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();
            await docRef.update(updateData);
            updated++;
            console.log(`   🔄 Updated: ${slug} with:`, Object.keys(updateData).join(', '));
          } else {
            skipped++;
            skippedSaints.push({ slug, reason: 'Already exists with all metadata' });
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${slug}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`   ✨ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // List all discovered saints for reference
    console.log(`\n📋 All ${saintSlugs.length} saints discovered in Pinecone:`);
    saintSlugs.sort().forEach((slug, i) => {
      const isSkipped = skippedSaints.find(s => s.slug === slug);
      const marker = isSkipped ? '✓' : '✨';
      console.log(`   ${marker} ${i + 1}. ${slug}${isSkipped ? ` (${isSkipped.reason})` : ''}`);
    });
    
    // Check specifically for nicholas
    const nicholasSlug = saintSlugs.find(s => s.toLowerCase().includes('nicholas'));
    if (nicholasSlug) {
      console.log(`\n🎅 St. Nicholas found as: ${nicholasSlug}`);
      const nicholasSkipped = skippedSaints.find(s => s.slug === nicholasSlug);
      if (nicholasSkipped) {
        console.log(`   Status: ${nicholasSkipped.reason}`);
      }
    } else {
      console.log(`\n⚠️  St. Nicholas not found in Pinecone`);
      console.log(`   He may not have been scraped/ingested yet`);
    }
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Backfill error:', error);
    process.exit(1);
  }
}

/**
 * Try to get secret from Firebase (for local execution)
 * Note: This requires Firebase CLI and proper authentication
 * 
 * Usage: firebase functions:secrets:access SECRET_NAME
 */
async function getSecretLocally(secretName) {
  try {
    const { execSync } = require('child_process');
    // Try to get secret via Firebase CLI
    const result = execSync(`firebase functions:secrets:access ${secretName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const value = result.trim();
    // If command succeeded but returned empty, it might require interactive auth
    return value || null;
  } catch (error) {
    // Command failed - secret might not exist or CLI not authenticated
    return null;
  }
}

// Run backfill
if (require.main === module) {
  (async () => {
    // Try to get secrets if not already set
    if (!process.env.PINECONE_API_KEY) {
      console.log('🔑 PINECONE_API_KEY not found in env, trying Firebase secrets...');
      const key = await getSecretLocally('PINECONE_API_KEY');
      if (key) {
        process.env.PINECONE_API_KEY = key;
        console.log('   ✅ Retrieved PINECONE_API_KEY from Firebase secrets\n');
      }
    }
    
    if (!process.env.OPENAI_API_KEY) {
      const key = await getSecretLocally('OPENAI_API_KEY');
      if (key) {
        process.env.OPENAI_API_KEY = key;
        console.log('   ✅ Retrieved OPENAI_API_KEY from Firebase secrets\n');
      }
    }
    
    // Check for required environment variables
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ PINECONE_API_KEY is required');
      console.error('\n💡 Options to provide it:');
      console.error('   1. Export as env var:');
      console.error('      export PINECONE_API_KEY="your-key"');
      console.error('   2. Use Firebase CLI (one-time):');
      console.error('      export PINECONE_API_KEY=$(firebase functions:secrets:access PINECONE_API_KEY)');
      console.error('   3. Or inline:');
      console.error('      PINECONE_API_KEY=$(firebase functions:secrets:access PINECONE_API_KEY) node scripts/backfill-from-pinecone.js');
      console.error('   4. Create .env file in functions/ directory (not committed)');
      console.error('   5. Or run as Cloud Function where secrets are auto-available\n');
      process.exit(1);
    }
    
    backfillFromPinecone().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  })();
}

module.exports = { backfillFromPinecone };

