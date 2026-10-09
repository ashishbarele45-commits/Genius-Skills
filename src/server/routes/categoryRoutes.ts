import { Router } from 'express';
import { adminDb } from '../firebaseAdmin';
import { db } from '../db';

const router = Router();

// GET all active categories with Firestore and database fallback
router.get('/', async (req, res) => {
  try {
    const snap = await adminDb.collection('categories')
      .where('active', '==', true)
      .orderBy('name', 'asc')
      .get();

    const categories = [];
    
    for (const doc of snap.docs) {
      const data = doc.data();
      
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
  } catch (_firestoreError) {
    // Database fallback
    try {
      const result = await db.execute(`
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM courses crs WHERE crs.category_id = c.id AND crs.status = 'PUBLISHED') as courses_count
        FROM categories c
        WHERE c.active = 1
        ORDER BY c.name ASC
      `);

      const categories = result.rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        slug: String(r.slug),
        description: r.description ? String(r.description) : undefined,
        image: r.image ? String(r.image) : undefined,
        coursesCount: Number(r.courses_count || 0),
      }));

      return res.json({ categories });
    } catch (dbErr) {
      console.error('Database categories fetch error:', dbErr);
      return res.json({ categories: [] });
    }
  }
});

export default router;
