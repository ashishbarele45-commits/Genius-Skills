import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Get student's wishlist
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          c.id, c.title, c.slug, c.short_description, c.instructor, c.thumbnail, 
          c.price, c.discount, c.level, c.duration, w.created_at as added_at
        FROM wishlist w
        JOIN courses c ON w.course_id = c.id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
      `,
      args: [req.user!.id],
    });

    const courses = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      instructor: row.instructor,
      thumbnail: row.thumbnail,
      price: Number(row.price),
      discount: Number(row.discount),
      finalPrice: Math.max(0, Number(row.price) - Number(row.discount)),
      level: row.level,
      duration: row.duration,
      addedAt: row.added_at,
    }));

    return res.json({ courses });
  } catch (error) {
    console.error('Wishlist error:', error);
    return res.status(500).json({ error: 'Failed to retrieve wishlist.' });
  }
});

// Toggle course in wishlist
router.post('/toggle', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user!.id;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM wishlist WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'DELETE FROM wishlist WHERE user_id = ? AND course_id = ?',
        args: [userId, courseId],
      });
      return res.json({ inWishlist: false, message: 'Removed from wishlist.' });
    } else {
      const id = 'wsh_' + Math.random().toString(36).substring(2, 10);
      const now = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO wishlist (id, user_id, course_id, created_at) VALUES (?, ?, ?, ?)',
        args: [id, userId, courseId, now],
      });
      return res.json({ inWishlist: true, message: 'Added to wishlist.' });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return res.status(500).json({ error: 'Failed to update wishlist.' });
  }
});

export default router;
