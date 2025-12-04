/**
 * Quick script to check Pinecone connection and list what's in the index
 */

const { getIndex } = require('../services/sky/pinecone');

// Load .env if available
try {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
} catch (e) {
  // dotenv not installed - that's okay
}

async function checkPinecone() {
  console.log('🔍 Checking Pinecone connection...\n');
  
  // Check environment variables
  console.log('Environment check:');
  console.log('  PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('  PINECONE_INDEX:', process.env.PINECONE_INDEX || 'saints-v1 (default)');
  console.log('');
  
  if (!process.env.PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY is required');
    process.exit(1);
  }
  
  try {
    const index = getIndex();
    console.log('✅ Pinecone client initialized');
    console.log('  Index name:', process.env.PINECONE_INDEX || 'saints-v1');
    console.log('');
    
    // Try to get index stats
    try {
      const stats = await index.describeIndexStats();
      console.log('📊 Index Stats:');
      console.log('  Total vectors:', stats.totalRecordCount || 'unknown');
      console.log('  Namespaces:', Object.keys(stats.namespaces || {}).join(', ') || 'none');
      console.log('');
      
      // Check each namespace
      const namespaces = stats.namespaces || {};
      if (Object.keys(namespaces).length === 0) {
        console.log('⚠️  No namespaces found in index');
      } else {
        for (const [ns, nsStats] of Object.entries(namespaces)) {
          console.log(`  Namespace "${ns}": ${nsStats.recordCount || 0} vectors`);
        }
      }
    } catch (error) {
      console.error('❌ Error getting index stats:', error.message);
    }
    
    // Try a test query to see if we can get any vectors
    console.log('\n🔍 Testing query...');
    const NAMESPACE = 'saints-v1';
    const namespace = index.namespace(NAMESPACE);
    
    // Create a dummy vector
    const dummyVector = new Array(1536).fill(0.01);
    
    try {
      const result = await namespace.query({
        vector: dummyVector,
        topK: 5,
        includeMetadata: true,
      });
      
      console.log(`  Query returned ${result.matches?.length || 0} matches`);
      
      if (result.matches && result.matches.length > 0) {
        console.log('\n  Sample matches:');
        result.matches.slice(0, 3).forEach((match, i) => {
          console.log(`    ${i + 1}. Score: ${match.score?.toFixed(3)}`);
          console.log(`       Metadata:`, {
            saintSlug: match.metadata?.saintSlug,
            displayName: match.metadata?.displayName,
            publisher: match.metadata?.publisher,
          });
        });
      } else {
        console.log('  ⚠️  No matches found - index might be empty or namespace wrong');
        console.log(`  💡 Check if namespace "${NAMESPACE}" exists and has data`);
      }
    } catch (error) {
      console.error('  ❌ Query error:', error.message);
      if (error.message.includes('namespace')) {
        console.log(`  💡 Try checking if namespace "${NAMESPACE}" exists`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check PINECONE_API_KEY is correct');
    console.error('  2. Check PINECONE_INDEX matches your index name');
    console.error('  3. Verify index exists in Pinecone console');
    process.exit(1);
  }
}

checkPinecone().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

