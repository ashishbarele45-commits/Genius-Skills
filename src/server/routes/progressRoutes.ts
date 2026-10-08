import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Mark lesson completed / uncompleted
router.post('/mark', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { lessonId, completed } = req.body;
    const userId = req.user!.id;

    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required.' });
    }

    // Verify lesson exists and user is enrolled in the lesson's course
    const lessonRes = await db.execute({
      sql: `
        SELECT l.id, m.course_id 
        FROM lessons l 
        JOIN modules m ON l.module_id = m.id 
        WHERE l.id = ? 
        LIMIT 1
      `,
      args: [lessonId],
    });

    if (lessonRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found.' });
    }

    const courseId = String(lessonRes.rows[0].course_id);

    // Verify enrollment
    const enrollRes = await db.execute({
      sql: 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (enrollRes.rows.length === 0 && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You must be enrolled in this course to track progress.' });
    }

    const isCompleted = completed !== false;
    const now = new Date().toISOString();

    if (isCompleted) {
      const existing = await db.execute({
        sql: 'SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ? LIMIT 1',
        args: [userId, lessonId],
      });

      if (existing.rows.length > 0) {
        await db.execute({
          sql: 'UPDATE lesson_progress SET completed = 1, completed_at = ? WHERE user_id = ? AND lesson_id = ?',
          args: [now, userId, lessonId],
        });
      } else {
        const id = 'lp_' + Math.random().toString(36).substring(2, 10);
        await db.execute({
          sql: 'INSERT INTO lesson_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, 1, ?)',
          args: [id, userId, lessonId, now],
        });
      }
    } else {
      await db.execute({
        sql: 'DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
        args: [userId, lessonId],
      });
    }

    // Calculate current progress
    const totalRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ? AND l.published = 1`,
      args: [courseId],
    });
    const total = Number(totalRes.rows[0].total);

    const completedRes = await db.execute({
      sql: `
        SELECT COUNT(*) as count 
        FROM lesson_progress lp 
        JOIN lessons l ON lp.lesson_id = l.id 
        JOIN modules m ON l.module_id = m.id 
        WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1
      `,
      args: [userId, courseId],
    });
    const completedCount = Number(completedRes.rows[0].count);
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.json({
      success: true,
      lessonId,
      completed: isCompleted,
      progress: {
        total,
        completedCount,
        progressPercent,
      },
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// Get user progress for a course
router.get('/:courseId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    const totalRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ? AND l.published = 1`,
      args: [courseId],
    });
    const total = Number(totalRes.rows[0]?.total || 0);

    const completedRes = await db.execute({
      sql: `
        SELECT lp.lesson_id 
        FROM lesson_progress lp 
        JOIN lessons l ON lp.lesson_id = l.id 
        JOIN modules m ON l.module_id = m.id 
        WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1
      `,
      args: [userId, courseId],
    });

    const completedLessonIds = completedRes.rows.map((r) => String(r.lesson_id));
    const completedCount = completedLessonIds.length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return res.json({
      total,
      completedCount,
      progressPercent,
      completedLessonIds,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return res.status(500).json({ error: 'Failed to load progress.' });
  }
});

export default router;
