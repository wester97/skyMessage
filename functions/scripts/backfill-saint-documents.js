/**
 * Backfill script to create main saint documents from raw content
 * 
 * This script finds all saints that have raw content but are missing
 * the main document, and creates/updates them with metadata from raw.
 * 
 * Usage:
 *   cd functions
 *   node scripts/backfill-saint-documents.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

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

async function backfillSaints() {
  console.log('🔍 Finding saints with raw content but missing main documents...\n');
  
  try {
    const saintsCollection = db.collection('saints');
    const allSaints = await saintsCollection.listDocuments();
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Check each saint document
    for (const docRef of allSaints) {
      try {
        const mainDoc = await docRef.get();
        const rawCollection = docRef.collection('raw');
        const rawSnapshot = await rawCollection.get();
        
        if (rawSnapshot.empty) {
          // No raw content, skip
          continue;
        }
        
        // Extract metadata from raw documents
        let metadata = {
          displayName: null,
          feastDay: null,
          era: null,
          patronages: null,
        };
        
        for (const rawDoc of rawSnapshot.docs) {
          const data = rawDoc.data() || {};
          if (!metadata.displayName && data.displayName) metadata.displayName = data.displayName;
          if (!metadata.feastDay && data.feastDay) metadata.feastDay = data.feastDay;
          if (!metadata.era && data.era) metadata.era = data.era;
          if (!metadata.patronages && data.patronages) metadata.patronages = data.patronages;
        }
        
        if (!mainDoc.exists) {
          // Create main document
          await docRef.set({
            slug: docRef.id,
            display_name: metadata.displayName || docRef.id,
            feast_day: metadata.feastDay || null,
            era: metadata.era || null,
            patronages: metadata.patronages || [],
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          created++;
          console.log(`   ✨ Created: ${docRef.id} (${metadata.displayName || docRef.id})`);
        } else {
          // Update main document with missing metadata
          const existingData = mainDoc.data();
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
            console.log(`   🔄 Updated: ${docRef.id} with:`, Object.keys(updateData).join(', '));
          } else {
            skipped++;
          }
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${docRef.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`   ✨ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}\n`);
    
  } catch (error) {
    console.error('\n❌ Backfill error:', error);
    process.exit(1);
  }
}

// Run backfill
if (require.main === module) {
  backfillSaints().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { backfillSaints };

