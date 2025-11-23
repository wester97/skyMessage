/**
 * Verification script to check saints in Firestore
 * 
 * Usage:
 *   cd functions
 *   node scripts/verify-saints-in-firestore.js
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

async function verifySaints() {
  console.log('🔍 Verifying saints in Firestore...\n');
  
  try {
    const app = admin.app();
    
    // Check default database
    console.log('📊 Checking DEFAULT database...');
    const defaultDb = app.firestore();
    const defaultCollection = defaultDb.collection('saints');
    const defaultSnapshot = await defaultCollection.get();
    console.log(`   Found ${defaultSnapshot.size} saints in default database`);
    
    if (defaultSnapshot.size > 0) {
      console.log('   Sample documents:');
      defaultSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`     - ${doc.id}: ${data.display_name || data.displayName || 'N/A'}`);
      });
    }
    
    // Check skymessage database
    console.log('\n📊 Checking SKYMESSAGE database...');
    try {
      const skymessageDb = app.firestore({ databaseId: 'skymessage' });
      const skymessageCollection = skymessageDb.collection('saints');
      const skymessageSnapshot = await skymessageCollection.get();
      console.log(`   Found ${skymessageSnapshot.size} saints in skymessage database`);
      
      if (skymessageSnapshot.size > 0) {
        console.log('   Sample documents:');
        skymessageSnapshot.docs.slice(0, 3).forEach(doc => {
          const data = doc.data();
          console.log(`     - ${doc.id}: ${data.display_name || data.displayName || 'N/A'}`);
        });
      } else {
        console.log('   ⚠️  No documents found in skymessage database!');
        console.log('   Checking if collection exists...');
        
        // Try to list collections
        const collections = await skymessageDb.listCollections();
        console.log(`   Collections in skymessage database: ${collections.map(c => c.id).join(', ') || 'none'}`);
      }
    } catch (error) {
      console.error('   ❌ Error accessing skymessage database:', error.message);
      console.error('   Full error:', error);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  }
}

if (require.main === module) {
  verifySaints()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { verifySaints };

