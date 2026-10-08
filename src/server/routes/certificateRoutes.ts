import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Student claims certificate upon completing course
router.post('/claim', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user!.id;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    // Check course certificate setting
    const courseRes = await db.execute({
      sql: 'SELECT id, title, certificate_enabled FROM courses WHERE id = ? LIMIT 1',
      args: [courseId],
    });

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const course = courseRes.rows[0];
    if (!course.certificate_enabled) {
      return res.status(400).json({ error: 'Certificates are not enabled for this course.' });
    }

    // Check enrollment
    const enrollRes = await db.execute({
      sql: 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (enrollRes.rows.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    // Check if already claimed
    const existing = await db.execute({
      sql: 'SELECT * FROM certificates WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (existing.rows.length > 0) {
      return res.json({
        certificate: existing.rows[0],
        message: 'Certificate already claimed.',
      });
    }

    // Validate 100% completion
    const totalLessonsRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ? AND l.published = 1`,
      args: [courseId],
    });
    const totalLessons = Number(totalLessonsRes.rows[0]?.total || 0);

    const completedLessonsRes = await db.execute({
      sql: `
        SELECT COUNT(*) as count 
        FROM lesson_progress lp 
        JOIN lessons l ON lp.lesson_id = l.id 
        JOIN modules m ON l.module_id = m.id 
        WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1
      `,
      args: [userId, courseId],
    });
    const completedLessons = Number(completedLessonsRes.rows[0]?.count || 0);

    if (totalLessons === 0 || completedLessons < totalLessons) {
      return res.status(400).json({
        error: `Incomplete course progress (${completedLessons}/${totalLessons} lessons completed). You must complete 100% of lessons to receive a certificate.`,
      });
    }

    // Generate real verifiable certificate code and token
    const certCode = 'GS-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    const token = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    const id = 'cert_' + Math.random().toString(36).substring(2, 10);

    await db.execute({
      sql: `INSERT INTO certificates (id, certificate_code, user_id, course_id, issue_date, verification_token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, certCode, userId, courseId, now, token, now],
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate issued successfully!',
      certificate: {
        id,
        certificateCode: certCode,
        issueDate: now,
        verificationToken: token,
      },
    });
  } catch (error) {
    console.error('Claim certificate error:', error);
    return res.status(500).json({ error: 'Failed to issue certificate.' });
  }
});

// Student's issued certificates
router.get('/my-certificates', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT cert.*, c.title as course_title, c.slug as course_slug, c.instructor as instructor_name
        FROM certificates cert
        JOIN courses c ON cert.course_id = c.id
        WHERE cert.user_id = ?
        ORDER BY cert.created_at DESC
      `,
      args: [req.user!.id],
    });

    const certificates = result.rows.map((r) => ({
      id: r.id,
      certificateCode: r.certificate_code,
      courseId: r.course_id,
      courseTitle: r.course_title,
      courseSlug: r.course_slug,
      instructorName: r.instructor_name,
      studentName: req.user!.name,
      issueDate: r.issue_date,
      verificationToken: r.verification_token,
    }));

    return res.json({ certificates });
  } catch (error) {
    console.error('Get my-certificates error:', error);
    return res.status(500).json({ error: 'Failed to load certificates.' });
  }
});

// Public certificate verification route
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.execute({
      sql: `
        SELECT cert.*, u.name as student_name, c.title as course_title, c.instructor as instructor_name
        FROM certificates cert
        JOIN users u ON cert.user_id = u.id
        JOIN courses c ON cert.course_id = c.id
        WHERE cert.certificate_code = ? OR cert.verification_token = ?
        LIMIT 1
      `,
      args: [code, code],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'No matching certificate found in registry.' });
    }

    const row = result.rows[0];

    return res.json({
      valid: true,
      certificate: {
        certificateCode: row.certificate_code,
        studentName: row.student_name,
        courseTitle: row.course_title,
        instructorName: row.instructor_name,
        issueDate: row.issue_date,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return res.status(500).json({ error: 'Failed to verify certificate.' });
  }
});

export default router;
