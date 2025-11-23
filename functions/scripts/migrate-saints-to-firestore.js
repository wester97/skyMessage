/**
 * Migration script to move saint data from seed.ts to Firestore
 * 
 * Usage:
 *   cd functions
 *   node scripts/migrate-saints-to-firestore.js
 * 
 * This script:
 * 1. Reads saint data from apps/skymessage/lib/seed.ts
 * 2. Connects to Firestore
 * 3. Inserts saints into Firestore collection 'saints'
 */

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Check if we're in a Firebase Functions environment
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    // Emulator environment
    admin.initializeApp({
      projectId: "st-ann-ai",
    });
  } else if (process.env.FIREBASE_CONFIG) {
    // Production Firebase Functions environment
    admin.initializeApp();
  } else {
    // Local development - try to initialize with default config
    admin.initializeApp({
      projectId: "st-ann-ai",
    });
  }
}

// Use the 'skymessage' database instead of default
// Use modular SDK to access named database
const app = admin.app();
const db = getFirestore(app, 'skymessage');

// Read seed data from TypeScript file
function readSeedData() {
  const seedPath = path.join(__dirname, '../../apps/skymessage/lib/seed.ts');
  
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found: ${seedPath}`);
  }
  
  const seedContent = fs.readFileSync(seedPath, 'utf-8');
  
  // Extract the SEED_SAINTS array using regex
  // Match from "export const SEED_SAINTS" to the closing bracket and semicolon
  const arrayMatch = seedContent.match(/export const SEED_SAINTS[^=]*=\s*(\[[\s\S]*\]);/);
  
  if (!arrayMatch) {
    // Try alternative: find the array content more flexibly
    const startIndex = seedContent.indexOf('export const SEED_SAINTS');
    if (startIndex === -1) {
      throw new Error('Could not find SEED_SAINTS in seed.ts');
    }
    
    // Find the opening bracket after the equals sign
    const equalsIndex = seedContent.indexOf('=', startIndex);
    const openBracketIndex = seedContent.indexOf('[', equalsIndex);
    if (openBracketIndex === -1) {
      throw new Error('Could not find opening bracket in SEED_SAINTS');
    }
    
    // Find the matching closing bracket (handle nested brackets)
    let bracketCount = 0;
    let closeBracketIndex = openBracketIndex;
    for (let i = openBracketIndex; i < seedContent.length; i++) {
      if (seedContent[i] === '[') bracketCount++;
      if (seedContent[i] === ']') bracketCount--;
      if (bracketCount === 0) {
        closeBracketIndex = i;
        break;
      }
    }
    
    if (bracketCount !== 0) {
      throw new Error('Could not find matching closing bracket in SEED_SAINTS');
    }
    
    // Extract the array content
    const arrayContent = seedContent.substring(openBracketIndex, closeBracketIndex + 1);
    
    // Evaluate the array (safe because it's our own file)
    const saintsArray = eval(arrayContent);
    return saintsArray;
  }
  
  // Evaluate the array (safe because it's our own file)
  const saintsArray = eval(arrayMatch[1]);
  
  return saintsArray;
}

// Read URLs from saints-170-for-new-advent.json
function readSaintUrls() {
  const urlsPath = path.join(__dirname, '../../scripts/saints-170-for-new-advent.json');
  
  if (!fs.existsSync(urlsPath)) {
    console.warn(`⚠️  URLs file not found: ${urlsPath}`);
    return {};
  }
  
  const urlsContent = fs.readFileSync(urlsPath, 'utf-8');
  const urlsArray = JSON.parse(urlsContent);
  
  // Create a map of slug -> URLs
  const urlMap = {};
  urlsArray.forEach(item => {
    if (item.slug && item.url && item.url !== 'NEW_ADVENT_URL_NEEDED') {
      if (!urlMap[item.slug]) {
        urlMap[item.slug] = [];
      }
      urlMap[item.slug].push({
        url: item.url,
        publisher: item.publisher || 'New Advent'
      });
    }
  });
  
  return urlMap;
}

async function migrateSaints() {
  console.log('🚀 Starting saint migration to Firestore...\n');
  
  try {
    // Read seed data
    console.log('📖 Reading seed data...');
    const saints = readSeedData();
    console.log(`   Found ${saints.length} saints in seed file`);
    
    // Read URLs
    console.log('📖 Reading URL mappings...');
    const urlMap = readSaintUrls();
    console.log(`   Found URLs for ${Object.keys(urlMap).length} saints\n`);
    
    // Test Firestore connection and log database info
    console.log('🔌 Testing Firestore connection...');
    console.log('   Database ID:', db.databaseId || 'default');
    console.log('   Database type:', typeof db);
    console.log('   Database constructor:', db.constructor.name);
    
    const testDoc = await db.collection('_test').doc('connection').get();
    console.log('   ✅ Firestore connected\n');
    
    const collection = db.collection('saints');
    console.log('📝 Collection path:', collection.path);
    console.log('   Writing to database:', db.databaseId || 'default');
    console.log('   Writing to collection: saints\n');
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    
    console.log('📝 Migrating saints...\n');
    
    for (const saint of saints) {
      try {
        // Get URLs for this saint
        const scrapeUrls = urlMap[saint.slug] || [];
        
        // Check if saint already exists
        const docRef = collection.doc(saint.slug);
        const existingDoc = await docRef.get();
        
        const saintData = {
          slug: saint.slug,
          display_name: saint.displayName,
          aliases: saint.aliases || [],
          era: saint.era || null,
          feast_day: saint.feastDay || null,
          patronages: saint.patronages || [],
          birth_date: saint.birthDate || null,
          death_date: saint.deathDate || null,
          birth_place: saint.birthPlace || null,
          image_url: saint.imageUrl || null,
          scrape_urls: scrapeUrls,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        if (existingDoc.exists) {
          // Update existing saint (preserve created_at)
          const existingData = existingDoc.data();
          saintData.created_at = existingData.created_at || admin.firestore.FieldValue.serverTimestamp();
          
          await docRef.update(saintData);
          updated++;
          if (updated % 10 === 0) {
            process.stdout.write(`   ✅ Updated ${updated}...\r`);
          }
        } else {
          // Insert new saint
          saintData.created_at = admin.firestore.FieldValue.serverTimestamp();
          
          // Log the exact path being written to
          if (inserted === 0) {
            console.log(`   📍 Writing first document to: ${docRef.path}`);
            console.log(`   📍 Database: ${db.databaseId || 'default'}`);
          }
          
          await docRef.set(saintData);
          
          // Verify it was written
          const verifyDoc = await docRef.get();
          if (verifyDoc.exists) {
            inserted++;
            if (inserted % 10 === 0) {
              process.stdout.write(`   ✨ Inserted ${inserted}...\r`);
            }
          } else {
            console.error(`   ❌ Failed to write ${saint.slug} - document not found after write!`);
            skipped++;
          }
        }
      } catch (error) {
        console.error(`\n   ❌ Error migrating ${saint.slug}:`, error.message);
        skipped++;
      }
    }
    
    console.log('\n');
    return { inserted, updated, skipped, total: saints.length };
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function verifyData() {
  console.log('🔍 Verifying data...');
  console.log('   Checking database:', db.databaseId || 'default');
  
  const collection = db.collection('saints');
  console.log('   Collection path:', collection.path);
  
  const snapshot = await collection.get();
  const count = snapshot.size;
  
  // Count saints with URLs
  const withUrlsSnapshot = await collection
    .where('scrape_urls', '!=', [])
    .get();
  const withUrls = withUrlsSnapshot.size;
  
  console.log(`   Total saints: ${count}`);
  console.log(`   Saints with URLs: ${withUrls}`);
  
  if (count > 0) {
    console.log('   Sample document IDs:', snapshot.docs.slice(0, 3).map(d => d.id).join(', '));
    const firstDoc = snapshot.docs[0];
    console.log('   First document path:', firstDoc.ref.path);
    console.log('   First document database:', firstDoc.ref.firestore.databaseId || 'default');
  }
  
  console.log('');
  
  return { count, withUrls };
}

async function main() {
  try {
    const stats = await migrateSaints();
    
    console.log('📊 Migration Summary:');
    console.log(`   ✨ Inserted: ${stats.inserted}`);
    console.log(`   ✅ Updated: ${stats.updated}`);
    console.log(`   ⚠️  Skipped: ${stats.skipped}`);
    console.log(`   📦 Total: ${stats.total}\n`);
    
    // Verify data
    await verifyData();
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the API: GET /saints');
    console.log('   2. Access admin UI: /admin/saints');
    console.log('   3. Start developing the Saint tool\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { migrateSaints };

