/**
 * Script to add a new saint to the database
 * 
 * Usage:
 *   node scripts/add-saint.js <slug> "<displayName>" [options]
 * 
 * Options:
 *   --url <url>           Source URL to scrape
 *   --publisher <name>    Publisher name (default: "New Advent")
 *   --era <era>           Era (e.g., "20th century")
 *   --feast-day <day>     Feast day (MM-DD format)
 *   --image-url <url>     Image URL
 * 
 * Example:
 *   node scripts/add-saint.js pier-giorgio-frassati "Blessed Pier Giorgio Frassati" --url "https://www.vatican.va/..." --publisher "Vatican" --era "20th century"
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

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

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    slug: null,
    displayName: null,
    url: null,
    publisher: 'New Advent',
    era: null,
    feastDay: null,
    imageUrl: null,
    aliases: [],
    patronages: [],
    birthDate: null,
    deathDate: null,
    birthPlace: null
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--url' && args[i + 1]) {
      result.url = args[++i];
    } else if (arg === '--publisher' && args[i + 1]) {
      result.publisher = args[++i];
    } else if (arg === '--era' && args[i + 1]) {
      result.era = args[++i];
    } else if (arg === '--feast-day' && args[i + 1]) {
      result.feastDay = args[++i];
    } else if (arg === '--image-url' && args[i + 1]) {
      result.imageUrl = args[++i];
    } else if (arg === '--aliases' && args[i + 1]) {
      result.aliases = args[++i].split(',').map(a => a.trim());
    } else if (arg === '--patronages' && args[i + 1]) {
      result.patronages = args[++i].split(',').map(p => p.trim());
    } else if (arg === '--birth-date' && args[i + 1]) {
      result.birthDate = args[++i];
    } else if (arg === '--death-date' && args[i + 1]) {
      result.deathDate = args[++i];
    } else if (arg === '--birth-place' && args[i + 1]) {
      result.birthPlace = args[++i];
    } else if (!result.slug) {
      result.slug = arg;
    } else if (!result.displayName) {
      result.displayName = arg;
    }
  }
  
  return result;
}

async function addSaint(data) {
  console.log(`➕ Adding saint: ${data.displayName} (${data.slug})\n`);
  
  try {
    const db = getFirestore(admin.app()); // Use default database
    const docRef = db.collection('saints').doc(data.slug);
    
    // Check if saint already exists
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      console.error(`❌ Saint with slug "${data.slug}" already exists`);
      console.error(`   Current: ${existingDoc.data().display_name}`);
      process.exit(1);
    }
    
    // Prepare scrape URLs
    const scrapeUrls = data.url ? [{
      url: data.url,
      publisher: data.publisher
    }] : [];
    
    // Create saint document
    const saintData = {
      slug: data.slug,
      display_name: data.displayName,
      aliases: data.aliases || [],
      era: data.era || null,
      feast_day: data.feastDay || null,
      patronages: data.patronages || [],
      birth_date: data.birthDate || null,
      death_date: data.deathDate || null,
      birth_place: data.birthPlace || null,
      image_url: data.imageUrl || null,
      scrape_urls: scrapeUrls,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.set(saintData);
    
    // Verify the creation
    const createdDoc = await docRef.get();
    const createdData = createdDoc.data();
    
    console.log(`✅ Successfully added ${data.displayName}`);
    console.log(`   Slug: ${data.slug}`);
    if (data.url) {
      console.log(`   Source URL: ${data.url}`);
    }
    if (data.imageUrl) {
      console.log(`   Image URL: ${data.imageUrl}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error adding saint:', error);
    process.exit(1);
  }
}

// Get command line arguments
const data = parseArgs();

if (!data.slug || !data.displayName) {
  console.error('Usage: node scripts/add-saint.js <slug> "<displayName>" [options]');
  console.error('');
  console.error('Options:');
  console.error('  --url <url>           Source URL to scrape');
  console.error('  --publisher <name>     Publisher name (default: "New Advent")');
  console.error('  --era <era>         Era (e.g., "20th century")');
  console.error('  --feast-day <day>     Feast day (MM-DD format)');
  console.error('  --image-url <url>     Image URL');
  console.error('  --aliases <list>      Comma-separated aliases');
  console.error('  --patronages <list>   Comma-separated patronages');
  console.error('  --birth-date <date>   Birth date');
  console.error('  --death-date <date>  Death date');
  console.error('  --birth-place <place> Birth place');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/add-saint.js pier-giorgio-frassati "Blessed Pier Giorgio Frassati" \\');
  console.error('    --url "https://www.vatican.va/..." --publisher "Vatican" --era "20th century"');
  process.exit(1);
}

addSaint(data)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

