/**
 * Complete setup script for saints database (Firestore)
 * 
 * This script:
 * 1. Checks Firestore connection
 * 2. Migrates seed data from seed.ts to Firestore
 * 
 * Usage:
 *   cd functions
 *   node scripts/setup-saints-database.js
 */

const { migrateSaints, verifyData } = require('./migrate-saints-to-firestore');


async function setupDatabase() {
  console.log('🚀 Starting saints Firestore setup...\n');
  
  try {
    // Migrate saints
    const stats = await migrateSaints();
    
    console.log('📊 Migration Summary:');
    console.log(`   ✨ Inserted: ${stats.inserted}`);
    console.log(`   ✅ Updated: ${stats.updated}`);
    console.log(`   ⚠️  Skipped: ${stats.skipped}`);
    console.log(`   📦 Total: ${stats.total}\n`);
    
    // Verify data
    await verifyData();
    
    console.log('✅ Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the API: GET /saints');
    console.log('   2. Access admin UI: /admin/saints');
    console.log('   3. Start developing the Saint tool\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   - Firebase Admin is properly initialized');
    console.error('   - You have access to Firestore');
    console.error('   - Environment variables are set (FIREBASE_CONFIG or projectId)');
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase };

