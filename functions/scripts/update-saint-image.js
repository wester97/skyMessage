/**
 * Script to update a saint's image URL
 * 
 * Usage:
 *   node scripts/update-saint-image.js <slug> <imageUrl>
 * 
 * Example:
 *   node scripts/update-saint-image.js george "https://commons.wikimedia.org/wiki/File:St_George.jpg"
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "st-ann-ai",
  });
}

async function updateSaintImage(slug, imageUrl) {
  console.log(`🖼️  Updating image for ${slug}...\n`);
  
  try {
    const db = getFirestore(admin.app(), 'skymessage');
    const docRef = db.collection('saints').doc(slug);
    
    // Check if saint exists
    const doc = await docRef.get();
    if (!doc.exists) {
      console.error(`❌ Saint with slug "${slug}" not found`);
      process.exit(1);
    }
    
    const currentData = doc.data();
    console.log(`   Current image: ${currentData.image_url || '(none)'}`);
    console.log(`   New image: ${imageUrl}\n`);
    
    // Update the image URL
    await docRef.update({
      image_url: imageUrl,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Verify the update
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    console.log(`✅ Successfully updated ${currentData.display_name || slug}`);
    console.log(`   New image URL: ${updatedData.image_url}\n`);
    
  } catch (error) {
    console.error('❌ Error updating image:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/update-saint-image.js <slug> <imageUrl>');
  console.error('Example: node scripts/update-saint-image.js george "https://commons.wikimedia.org/wiki/File:St_George.jpg"');
  process.exit(1);
}

const [slug, imageUrl] = args;
updateSaintImage(slug, imageUrl)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

