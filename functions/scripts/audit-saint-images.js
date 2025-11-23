/**
 * Audit script to check all saint images
 * 
 * Usage:
 *   cd functions
 *   node scripts/audit-saint-images.js
 * 
 * This script:
 * 1. Lists all saints with missing images
 * 2. Lists all saints with potentially invalid images
 * 3. Shows which saints have scrape URLs (source articles)
 * 4. Provides recommendations for fixing images
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "st-ann-ai",
  });
}

async function auditImages() {
  console.log('🔍 Auditing saint images...\n');
  
  try {
    const db = getFirestore(admin.app(), 'skymessage');
    const snapshot = await db.collection('saints').get();
    
    const stats = {
      total: snapshot.size,
      withImage: 0,
      withoutImage: 0,
      invalidImage: 0,
      withScrapeUrls: 0,
      withoutScrapeUrls: 0
    };
    
    const missingImages = [];
    const invalidImages = [];
    const withSourceUrls = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const slug = doc.id;
      const displayName = data.display_name || slug;
      const imageUrl = data.image_url;
      const scrapeUrls = data.scrape_urls || [];
      
      // Check for scrape URLs
      if (scrapeUrls.length > 0) {
        stats.withScrapeUrls++;
        withSourceUrls.push({
          slug,
          displayName,
          imageUrl,
          sourceUrls: scrapeUrls.map(u => u.url)
        });
      } else {
        stats.withoutScrapeUrls++;
      }
      
      // Check image status
      if (!imageUrl || imageUrl.trim() === '') {
        stats.withoutImage++;
        missingImages.push({
          slug,
          displayName,
          hasSourceUrl: scrapeUrls.length > 0,
          sourceUrl: scrapeUrls.length > 0 ? scrapeUrls[0].url : null
        });
      } else {
        // Check for obviously invalid images
        const invalidPatterns = [
          'Giorgos%20Vovoras',
          'Vovoras',
          'March%202021',
          'placeholder',
          'default',
          'missing'
        ];
        
        const isInvalid = invalidPatterns.some(pattern => 
          imageUrl.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isInvalid) {
          stats.invalidImage++;
          invalidImages.push({
            slug,
            displayName,
            imageUrl,
            hasSourceUrl: scrapeUrls.length > 0,
            sourceUrl: scrapeUrls.length > 0 ? scrapeUrls[0].url : null
          });
        } else {
          stats.withImage++;
        }
      }
    });
    
    // Print summary
    console.log('📊 Image Audit Summary:');
    console.log(`   Total saints: ${stats.total}`);
    console.log(`   ✅ With valid image: ${stats.withImage}`);
    console.log(`   ❌ Without image: ${stats.withoutImage}`);
    console.log(`   ⚠️  Invalid image: ${stats.invalidImage}`);
    console.log(`   📄 With source URLs: ${stats.withScrapeUrls}`);
    console.log(`   📄 Without source URLs: ${stats.withoutScrapeUrls}\n`);
    
    // Print missing images
    if (missingImages.length > 0) {
      console.log('❌ Saints WITHOUT images:');
      missingImages.forEach(saint => {
        console.log(`   - ${saint.displayName} (${saint.slug})`);
        if (saint.hasSourceUrl) {
          console.log(`     📄 Source: ${saint.sourceUrl}`);
          console.log(`     💡 Can extract image from source article`);
        } else {
          console.log(`     ⚠️  No source URL - need to find image manually`);
        }
      });
      console.log('');
    }
    
    // Print invalid images
    if (invalidImages.length > 0) {
      console.log('⚠️  Saints with INVALID images:');
      invalidImages.forEach(saint => {
        console.log(`   - ${saint.displayName} (${saint.slug})`);
        console.log(`     Current: ${saint.imageUrl}`);
        if (saint.hasSourceUrl) {
          console.log(`     📄 Source: ${saint.sourceUrl}`);
          console.log(`     💡 Can extract image from source article`);
        } else {
          console.log(`     ⚠️  No source URL - need to find image manually`);
        }
      });
      console.log('');
    }
    
    // Print saints with source URLs but missing/invalid images (can be fixed)
    const fixable = [...missingImages, ...invalidImages].filter(s => s.hasSourceUrl);
    if (fixable.length > 0) {
      console.log('🔧 Fixable saints (have source URLs):');
      console.log(`   ${fixable.length} saints can have images extracted from their source articles\n`);
      console.log('   To extract images, run:');
      console.log('   node scripts/extract-images-from-sources.js\n');
    }
    
    // Print recommendations
    console.log('💡 Recommendations:');
    if (missingImages.length > 0 || invalidImages.length > 0) {
      console.log('   1. Extract images from source articles (for saints with scrape URLs)');
      console.log('   2. Search Wikimedia Commons for missing images');
      console.log('   3. Update via admin UI: /admin/saints');
      console.log('   4. Or use: node scripts/update-saint-image.js <slug> <imageUrl>\n');
    } else {
      console.log('   ✅ All saints have valid images!\n');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  }
}

if (require.main === module) {
  auditImages()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { auditImages };

