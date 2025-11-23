/**
 * Script to delete saints collection from default database
 * 
 * Usage:
 *   cd functions
 *   node scripts/delete-saints-from-default-db.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    admin.initializeApp({
      projectId: "st-ann-ai",
    });
  } else if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp();
  } else {
    admin.initializeApp({
      projectId: "st-ann-ai",
    });
  }
}

async function deleteSaintsFromDefault() {
  console.log('🗑️  Deleting saints from default database...\n');
  
  try {
    const app = admin.app();
    const defaultDb = app.firestore();
    const collection = defaultDb.collection('saints');
    
    // Get all documents
    const snapshot = await collection.get();
    
    if (snapshot.empty) {
      console.log('   ℹ️  No saints found in default database');
      return;
    }
    
    console.log(`   Found ${snapshot.size} documents to delete...\n`);
    
    // Delete in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deleted = 0;
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = defaultDb.batch();
      const batchDocs = snapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deleted += batchDocs.length;
      console.log(`   ✅ Deleted ${deleted}/${snapshot.size} documents...`);
    }
    
    console.log(`\n✅ Successfully deleted ${deleted} saints from default database`);
    console.log('   Data remains in skymessage database\n');
    
  } catch (error) {
    console.error('\n❌ Error deleting from default database:', error);
    throw error;
  }
}

if (require.main === module) {
  deleteSaintsFromDefault()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { deleteSaintsFromDefault };

