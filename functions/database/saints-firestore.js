/**
 * Firestore database connection for saints
 * Uses Firestore collection: 'saints' in the default database
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Get Firestore instance for default database
function getFirestoreInstance() {
  // admin is already initialized in index.js
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  // Use default database
  const app = admin.app();
  return getFirestore(app);
}

// Get saints collection
function getSaintsCollection() {
  return getFirestoreInstance().collection('saints');
}

// Convert Firestore document to API format
function docToSaint(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    slug: data.slug || doc.id,
    display_name: data.display_name || data.displayName,
    aliases: data.aliases || [],
    era: data.era || null,
    feast_day: data.feast_day || data.feastDay || null,
    patronages: data.patronages || [],
    birth_date: data.birth_date || data.birthDate || null,
    death_date: data.death_date || data.deathDate || null,
    birth_place: data.birth_place || data.birthPlace || null,
    image_url: data.image_url || data.imageUrl || null,
    scrape_urls: data.scrape_urls || data.scrapeUrls || [],
    created_at: data.created_at?.toDate?.()?.toISOString() || data.createdAt || null,
    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updatedAt || null,
  };
}

// Convert API format to Firestore format
function saintToDoc(saint) {
  const doc = {
    slug: saint.slug,
    display_name: saint.displayName || saint.display_name,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Only include fields that are provided
  if (saint.aliases !== undefined) doc.aliases = saint.aliases || [];
  if (saint.era !== undefined) doc.era = saint.era || null;
  if (saint.feastDay !== undefined || saint.feast_day !== undefined) {
    doc.feast_day = saint.feastDay || saint.feast_day || null;
  }
  if (saint.patronages !== undefined) doc.patronages = saint.patronages || [];
  if (saint.birthDate !== undefined || saint.birth_date !== undefined) {
    doc.birth_date = saint.birthDate || saint.birth_date || null;
  }
  if (saint.deathDate !== undefined || saint.death_date !== undefined) {
    doc.death_date = saint.deathDate || saint.death_date || null;
  }
  if (saint.birthPlace !== undefined || saint.birth_place !== undefined) {
    doc.birth_place = saint.birthPlace || saint.birth_place || null;
  }
  if (saint.imageUrl !== undefined || saint.image_url !== undefined) {
    doc.image_url = saint.imageUrl || saint.image_url || null;
  }
  if (saint.scrapeUrls !== undefined || saint.scrape_urls !== undefined) {
    doc.scrape_urls = saint.scrapeUrls || saint.scrape_urls || [];
  }

  // Set created_at only for new documents
  if (!saint.id) {
    doc.created_at = admin.firestore.FieldValue.serverTimestamp();
  }

  return doc;
}

module.exports = {
  getFirestore,
  getSaintsCollection,
  docToSaint,
  saintToDoc,
};

