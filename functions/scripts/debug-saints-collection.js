/**
 * Debug script to check saints collection in detail
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "st-ann-ai",
  });
}

async function debugSaints() {
  console.log('🔍 Debugging saints collection...\n');
  
  try {
    const app = admin.app();
    const skymessageDb = getFirestore(app, 'skymessage');
    console.log('   Database ID:', skymessageDb.databaseId);
    const collection = skymessageDb.collection('saints');
    
    console.log('📊 Checking collection directly...');
    
    // Try different query methods
    const allDocs = await collection.get();
    console.log(`   get() returned: ${allDocs.size} documents`);
    
    if (allDocs.size > 0) {
      console.log('   First 3 documents:');
      allDocs.docs.slice(0, 3).forEach(doc => {
        console.log(`     - ID: ${doc.id}`);
        console.log(`       Data:`, JSON.stringify(doc.data(), null, 2));
      });
    } else {
      console.log('   ⚠️  Collection is empty');
      
      // Try to get a specific document
      console.log('\n   Trying to get specific document (francis-of-assisi)...');
      const specificDoc = await collection.doc('francis-of-assisi').get();
      if (specificDoc.exists) {
        console.log('   ✅ Document exists!');
        console.log('   Data:', JSON.stringify(specificDoc.data(), null, 2));
      } else {
        console.log('   ❌ Document does not exist');
      }
    }
    
    // List all collections
    console.log('\n📋 All collections in skymessage database:');
    const collections = await skymessageDb.listCollections();
    collections.forEach(col => {
      console.log(`   - ${col.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

debugSaints()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

