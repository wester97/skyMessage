/**
 * Migration script to copy saints data from ChatJP2 (st-ann-ai) to skyMessage (ask-sky-message)
 * 
 * Usage:
 *   cd functions
 *   node scripts/migrate-from-chatjp2.js
 * 
 * This script:
 * 1. Connects to st-ann-ai project (source) - reads from 'skymessage' database
 * 2. Reads all saints from the 'saints' collection (including subcollections)
 * 3. Writes them to ask-sky-message project (target) - writes to 'skymessage' database
 * 4. Migrates both main documents and 'raw' subcollections
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Source project (ChatJP2)
const SOURCE_PROJECT_ID = 'st-ann-ai';
const SOURCE_DATABASE = 'skymessage'; // ChatJP2 uses named 'skymessage' database

// Target project (skyMessage)
const TARGET_PROJECT_ID = 'ask-sky-message';
const TARGET_DATABASE = '(default)'; // Using default database

async function migrateSaints() {
  console.log('🚀 Starting migration from ChatJP2 to skyMessage...\n');
  
  try {
    // Initialize source app (st-ann-ai)
    console.log('📖 Connecting to source project (st-ann-ai)...');
    const sourceApp = admin.initializeApp(
      {
        projectId: SOURCE_PROJECT_ID,
      },
      'source'
    );
    
    const sourceDb = SOURCE_DATABASE === '(default)' 
      ? getFirestore(sourceApp)
      : getFirestore(sourceApp, SOURCE_DATABASE);
    
    console.log(`   ✅ Connected to ${SOURCE_PROJECT_ID} (${SOURCE_DATABASE})\n`);
    
    // Initialize target app (ask-sky-message)
    console.log('📝 Connecting to target project (ask-sky-message)...');
    const targetApp = admin.initializeApp(
      {
        projectId: TARGET_PROJECT_ID,
      },
      'target'
    );
    
    // Use default database
    const targetDb = getFirestore(targetApp);
    console.log(`   ✅ Connected to ${TARGET_PROJECT_ID} (default database)\n`);
    
    // Read saints from source
    console.log('📖 Reading saints from source...');
    const sourceCollection = sourceDb.collection('saints');
    const sourceSnapshot = await sourceCollection.get();
    
    if (sourceSnapshot.empty) {
      console.log('   ⚠️  No saints found in source database');
      console.log('   💡 Trying default database as fallback...');
      
      // Try default database as fallback
      const sourceDbDefault = getFirestore(sourceApp);
      const sourceCollectionDefault = sourceDbDefault.collection('saints');
      const sourceSnapshotDefault = await sourceCollectionDefault.get();
      
      if (sourceSnapshotDefault.empty) {
        console.log('   ❌ No saints found in default database either\n');
        return;
      }
      
      console.log(`   ✅ Found ${sourceSnapshotDefault.size} saints in default database\n`);
      await migrateCollection(sourceCollectionDefault, targetDb.collection('saints'));
    } else {
      console.log(`   ✅ Found ${sourceSnapshot.size} saints in ${SOURCE_DATABASE} database\n`);
      await migrateCollection(sourceCollection, targetDb.collection('saints'));
    }
    
    // Clean up
    await sourceApp.delete();
    await targetApp.delete();
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  }
}

async function migrateCollection(sourceCollection, targetCollection) {
  const sourceSnapshot = await sourceCollection.get();
  
  let migrated = 0;
  let updated = 0;
  let errors = 0;
  
  console.log('📝 Migrating saints...\n');
  
  for (const doc of sourceSnapshot.docs) {
    try {
      const data = doc.data();
      const slug = data.slug || doc.id;
      
      // Check if already exists in target
      const existingDoc = await targetCollection.doc(slug).get();
      
      if (existingDoc.exists) {
        // Update existing document (merge to preserve any new fields)
        await targetCollection.doc(slug).set({
          ...data,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        updated++;
        console.log(`   🔄 Updated: ${slug}`);
      } else {
        // Create new document
        await targetCollection.doc(slug).set({
          ...data,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        migrated++;
        console.log(`   ✨ Migrated: ${slug}`);
      }
      
      // Also migrate subcollections (raw content)
      const rawSubcollection = doc.ref.collection('raw');
      const rawSnapshot = await rawSubcollection.get();
      
      if (!rawSnapshot.empty) {
        const targetRawCollection = targetCollection.doc(slug).collection('raw');
        for (const rawDoc of rawSnapshot.docs) {
          await targetRawCollection.doc(rawDoc.id).set(rawDoc.data());
        }
        console.log(`      📄 Migrated ${rawSnapshot.size} raw documents`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error migrating ${doc.id}:`, error.message);
      errors++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   ✨ New: ${migrated}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total: ${sourceSnapshot.size}\n`);
}

// Run migration
if (require.main === module) {
  migrateSaints().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrateSaints };

