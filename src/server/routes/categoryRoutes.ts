import { Router } from 'express';
import { adminDb } from '../firebaseAdmin';

const router = Router();

// GET all active categories from Firestore
router.get('/', async (req, res) => {
  try {
    const snap = await adminDb.collection('categories')
      .where('active', '==', true)
      .orderBy('name', 'asc')
      .get();

    const categories = [];
    
    for (const doc of snap.docs) {
      const data = doc.data();
      
      // Get course count for this category
      const coursesSnap = await adminDb.collection('courses')
        .where('categoryId', '==', doc.id)
        .where('status', '==', 'PUBLISHED')
        .get();
        
      categories.push({
        id: doc.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        coursesCount: coursesSnap.size,
      });
    }

    return res.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve categories from Firestore.' });
  }
});

export default router;
