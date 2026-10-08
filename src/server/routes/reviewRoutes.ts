import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Submit review (Only enrolled students can review a course)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user!.id;

    if (!courseId || !rating || !comment) {
      return res.status(400).json({ error: 'Course ID, rating (1-5), and comment are required.' });
    }

    const numRating = Math.min(5, Math.max(1, Number(rating)));

    // Verify enrollment
    const enrollRes = await db.execute({
      sql: 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (enrollRes.rows.length === 0 && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You must be enrolled in this course to leave a review.' });
    }

    const now = new Date().toISOString();

    const existing = await db.execute({
      sql: 'SELECT id FROM reviews WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: `UPDATE reviews SET rating = ?, comment = ?, status = 'PENDING', created_at = ? WHERE user_id = ? AND course_id = ?`,
        args: [numRating, String(comment).trim(), now, userId, courseId],
      });
      return res.json({ message: 'Review updated! It will appear publicly upon administrator approval.' });
    } else {
      const id = 'rev_' + Math.random().toString(36).substring(2, 10);
      await db.execute({
        sql: `INSERT INTO reviews (id, user_id, course_id, rating, comment, status, created_at) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        args: [id, userId, courseId, numRating, String(comment).trim(), now],
      });
      return res.json({ message: 'Review submitted! It will appear publicly upon administrator approval.' });
    }
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Get approved reviews for a course
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const result = await db.execute({
      sql: `
        SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.course_id = ? AND r.status = 'APPROVED'
        ORDER BY r.created_at DESC
      `,
      args: [courseId],
    });

    const reviews = result.rows.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment,
      userName: r.user_name,
      createdAt: r.created_at,
    }));

    return res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

export default router;
