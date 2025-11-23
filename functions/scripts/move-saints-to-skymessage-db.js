/**
 * Script to move saints from default database to skymessage database
 * 
 * Usage:
 *   cd functions
 *   node scripts/move-saints-to-skymessage-db.js
 * 
 * This script:
 * 1. Reads all saints from default database
 * 2. Writes them to skymessage database
 * 3. Optionally deletes from default database
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

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

// Get both databases
const app = admin.app();
const defaultDb = app.firestore(); // Default database
const skymessageDb = getFirestore(app, 'skymessage'); // skymessage database

async function moveSaints(deleteFromDefault = false) {
  console.log('🚀 Moving saints from default database to skymessage database...\n');
  
  try {
    // Read all saints from default database
    console.log('📖 Reading saints from default database...');
    const defaultCollection = defaultDb.collection('saints');
    const defaultSnapshot = await defaultCollection.get();
    
    if (defaultSnapshot.empty) {
      console.log('   ℹ️  No saints found in default database');
      console.log('   ✅ Nothing to move\n');
      return;
    }
    
    console.log(`   Found ${defaultSnapshot.size} saints in default database\n`);
    
    // Write to skymessage database
    const skymessageCollection = skymessageDb.collection('saints');
    
    let moved = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('📝 Moving saints to skymessage database...\n');
    
    for (const doc of defaultSnapshot.docs) {
      try {
        const data = doc.data();
        const slug = data.slug || doc.id;
        
        // Check if already exists in skymessage database
        const existingDoc = await skymessageCollection.doc(slug).get();
        
        if (existingDoc.exists) {
          // Update existing document
          await skymessageCollection.doc(slug).set(data, { merge: true });
          console.log(`   ✅ Updated: ${slug}`);
        } else {
          // Create new document
          await skymessageCollection.doc(slug).set(data);
          console.log(`   ✨ Moved: ${slug}`);
        }
        
        moved++;
        
        // Delete from default database if requested
        if (deleteFromDefault) {
          await defaultCollection.doc(doc.id).delete();
        }
        
      } catch (error) {
        console.error(`   ❌ Error moving ${doc.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✨ Moved: ${moved}`);
    console.log(`   ⚠️  Errors: ${errors}`);
    console.log(`   📦 Total: ${defaultSnapshot.size}\n`);
    
    if (deleteFromDefault) {
      console.log('🗑️  Deleted saints from default database');
    } else {
      console.log('ℹ️  Saints still exist in default database (use --delete flag to remove)');
    }
    
    // Verify data in skymessage database
    console.log('\n🔍 Verifying data in skymessage database...');
    const skymessageSnapshot = await skymessageCollection.get();
    console.log(`   Total saints in skymessage: ${skymessageSnapshot.size}\n`);
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function deleteFromDefault() {
  console.log('🗑️  Deleting saints from default database...\n');
  
  try {
    const defaultCollection = defaultDb.collection('saints');
    const defaultSnapshot = await defaultCollection.get();
    
    if (defaultSnapshot.empty) {
      console.log('   ℹ️  No saints found in default database');
      return;
    }
    
    let deleted = 0;
    
    for (const doc of defaultSnapshot.docs) {
      await doc.ref.delete();
      deleted++;
    }
    
    console.log(`   ✅ Deleted ${deleted} saints from default database\n`);
    
  } catch (error) {
    console.error('❌ Error deleting from default database:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const deleteFromDefaultFlag = args.includes('--delete') || args.includes('-d');
  
  try {
    await moveSaints(deleteFromDefaultFlag);
    
    if (!deleteFromDefaultFlag) {
      console.log('\n💡 To delete saints from default database, run:');
      console.log('   node scripts/move-saints-to-skymessage-db.js --delete\n');
    }
    
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

module.exports = { moveSaints, deleteFromDefault };

