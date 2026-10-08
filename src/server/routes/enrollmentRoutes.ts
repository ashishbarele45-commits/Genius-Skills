import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Get courses enrolled by the authenticated student
router.get('/my-courses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const result = await db.execute({
      sql: `
        SELECT 
          c.id, c.title, c.slug, c.short_description, c.instructor, c.thumbnail, 
          c.level, c.duration, c.certificate_enabled, e.enrolled_at,
          (SELECT COUNT(*) FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = c.id AND l.published = 1) as total_lessons,
          (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE lp.user_id = ? AND m.course_id = c.id AND lp.completed = 1) as completed_lessons
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
      `,
      args: [userId, userId],
    });

    const courses = result.rows.map((row) => {
      const totalLessons = Number(row.total_lessons);
      const completedLessons = Number(row.completed_lessons);
      const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        shortDescription: row.short_description,
        instructor: row.instructor,
        thumbnail: row.thumbnail,
        level: row.level,
        duration: row.duration,
        certificateEnabled: Boolean(row.certificate_enabled),
        enrolledAt: row.enrolled_at,
        totalLessons,
        completedLessons,
        progressPercent,
      };
    });

    return res.json({ courses });
  } catch (error) {
    console.error('Fetch my-courses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve enrolled courses.' });
  }
});

export default router;
