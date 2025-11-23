/**
 * Saints Management API Routes
 * Handles CRUD operations for saints in Firestore
 */

const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const { getSaintsCollection, docToSaint, saintToDoc } = require('../database/saints-firestore');

// GET /saints - List all saints with optional pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    
    const collection = getSaintsCollection();
    let query = collection.orderBy('display_name', 'asc');
    
    // Apply search filter if provided
    if (search) {
      // Firestore doesn't support full-text search, so we'll filter client-side
      // For better performance, you might want to use Algolia or similar
      query = collection.orderBy('display_name', 'asc');
    }
    
    // Get total count (for pagination)
    const allDocs = await collection.get();
    let allSaints = allDocs.docs.map(doc => docToSaint(doc));
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allSaints = allSaints.filter(saint => 
        (saint.display_name && saint.display_name.toLowerCase().includes(searchLower)) ||
        (saint.slug && saint.slug.toLowerCase().includes(searchLower))
      );
    }
    
    const total = allSaints.length;
    
    // Apply pagination
    const offset = (pageNum - 1) * limitNum;
    const paginatedSaints = allSaints.slice(offset, offset + limitNum);
    
    res.json({
      success: true,
      data: paginatedSaints,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching saints:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saints',
      message: error.message
    });
  }
});

// GET /saints/:slug - Get a single saint by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const collection = getSaintsCollection();
    
    // Try to find by slug field first, then by document ID
    const slugQuery = await collection.where('slug', '==', slug).limit(1).get();
    
    let doc;
    if (!slugQuery.empty) {
      doc = slugQuery.docs[0];
    } else {
      // Try document ID
      const docRef = collection.doc(slug);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        doc = docSnap;
      }
    }
    
    if (!doc || !doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Saint not found'
      });
    }
    
    res.json({
      success: true,
      data: docToSaint(doc)
    });
  } catch (error) {
    console.error('Error fetching saint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saint',
      message: error.message
    });
  }
});

// POST /saints - Create a new saint
router.post('/', async (req, res) => {
  try {
    const {
      slug,
      displayName,
      aliases,
      era,
      feastDay,
      patronages,
      birthDate,
      deathDate,
      birthPlace,
      imageUrl,
      scrapeUrls
    } = req.body;
    
    // Validate required fields
    if (!slug || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'slug and displayName are required'
      });
    }
    
    const collection = getSaintsCollection();
    
    // Check if saint already exists
    const existingQuery = await collection.where('slug', '==', slug).limit(1).get();
    if (!existingQuery.empty) {
      return res.status(409).json({
        success: false,
        error: 'Saint with this slug already exists'
      });
    }
    
    // Create document
    const docRef = collection.doc(slug);
    const saintData = saintToDoc({
      slug,
      displayName,
      aliases,
      era,
      feastDay,
      patronages,
      birthDate,
      deathDate,
      birthPlace,
      imageUrl,
      scrapeUrls
    });
    
    await docRef.set(saintData);
    
    // Get the created document
    const createdDoc = await docRef.get();
    
    res.status(201).json({
      success: true,
      data: docToSaint(createdDoc)
    });
  } catch (error) {
    console.error('Error creating saint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create saint',
      message: error.message
    });
  }
});

// PUT /saints/:slug - Update an existing saint
router.put('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      displayName,
      aliases,
      era,
      feastDay,
      patronages,
      birthDate,
      deathDate,
      birthPlace,
      imageUrl,
      scrapeUrls
    } = req.body;
    
    const collection = getSaintsCollection();
    
    // Find the document
    const slugQuery = await collection.where('slug', '==', slug).limit(1).get();
    let docRef;
    
    if (!slugQuery.empty) {
      docRef = slugQuery.docs[0].ref;
    } else {
      // Try document ID
      docRef = collection.doc(slug);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({
          success: false,
          error: 'Saint not found'
        });
      }
    }
    
    // Get existing data
    const existingDoc = await docRef.get();
    const existingData = existingDoc.data();
    
    // Merge with new data (only update provided fields)
    const updateData = {
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (displayName !== undefined) updateData.display_name = displayName;
    if (aliases !== undefined) updateData.aliases = aliases || [];
    if (era !== undefined) updateData.era = era || null;
    if (feastDay !== undefined) updateData.feast_day = feastDay || null;
    if (patronages !== undefined) updateData.patronages = patronages || [];
    if (birthDate !== undefined) updateData.birth_date = birthDate || null;
    if (deathDate !== undefined) updateData.death_date = deathDate || null;
    if (birthPlace !== undefined) updateData.birth_place = birthPlace || null;
    if (imageUrl !== undefined) updateData.image_url = imageUrl || null;
    if (scrapeUrls !== undefined) updateData.scrape_urls = scrapeUrls || [];
    
    await docRef.update(updateData);
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    res.json({
      success: true,
      data: docToSaint(updatedDoc)
    });
  } catch (error) {
    console.error('Error updating saint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update saint',
      message: error.message
    });
  }
});

// DELETE /saints/:slug - Delete a saint
router.delete('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const collection = getSaintsCollection();
    
    // Find the document
    const slugQuery = await collection.where('slug', '==', slug).limit(1).get();
    let docRef;
    
    if (!slugQuery.empty) {
      docRef = slugQuery.docs[0].ref;
    } else {
      // Try document ID
      docRef = collection.doc(slug);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({
          success: false,
          error: 'Saint not found'
        });
      }
    }
    
    await docRef.delete();
    
    res.json({
      success: true,
      message: 'Saint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete saint',
      message: error.message
    });
  }
});

// POST /saints/:slug/urls - Add a URL to scrape for a saint
router.post('/:slug/urls', async (req, res) => {
  try {
    const { slug } = req.params;
    const { url, publisher } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'url is required'
      });
    }
    
    const collection = getSaintsCollection();
    
    // Find the document
    const slugQuery = await collection.where('slug', '==', slug).limit(1).get();
    let docRef;
    
    if (!slugQuery.empty) {
      docRef = slugQuery.docs[0].ref;
    } else {
      // Try document ID
      docRef = collection.doc(slug);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({
          success: false,
          error: 'Saint not found'
        });
      }
    }
    
    // Get current URLs
    const docSnap = await docRef.get();
    const currentData = docSnap.data();
    const currentUrls = currentData.scrape_urls || [];
    
    // Check if URL already exists
    const urlExists = currentUrls.some(u => u.url === url);
    if (urlExists) {
      return res.status(409).json({
        success: false,
        error: 'URL already exists for this saint'
      });
    }
    
    // Add new URL
    const newUrl = { url, publisher: publisher || 'Unknown' };
    const updatedUrls = [...currentUrls, newUrl];
    
    await docRef.update({
      scrape_urls: updatedUrls,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    res.json({
      success: true,
      data: docToSaint(updatedDoc)
    });
  } catch (error) {
    console.error('Error adding URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add URL',
      message: error.message
    });
  }
});

// DELETE /saints/:slug/urls/:urlIndex - Remove a URL from a saint
router.delete('/:slug/urls/:urlIndex', async (req, res) => {
  try {
    const { slug, urlIndex } = req.params;
    const index = parseInt(urlIndex);
    
    const collection = getSaintsCollection();
    
    // Find the document
    const slugQuery = await collection.where('slug', '==', slug).limit(1).get();
    let docRef;
    
    if (!slugQuery.empty) {
      docRef = slugQuery.docs[0].ref;
    } else {
      // Try document ID
      docRef = collection.doc(slug);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({
          success: false,
          error: 'Saint not found'
        });
      }
    }
    
    // Get current URLs
    const docSnap = await docRef.get();
    const currentData = docSnap.data();
    const currentUrls = currentData.scrape_urls || [];
    
    if (index < 0 || index >= currentUrls.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL index'
      });
    }
    
    // Remove URL at index
    const updatedUrls = currentUrls.filter((_, i) => i !== index);
    
    await docRef.update({
      scrape_urls: updatedUrls,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    res.json({
      success: true,
      data: docToSaint(updatedDoc)
    });
  } catch (error) {
    console.error('Error removing URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove URL',
      message: error.message
    });
  }
});

module.exports = router;

