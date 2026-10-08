import { Router } from 'express';
import { db } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

// Enforce admin check for ALL admin routes
router.use(requireAdmin);

// Real Database Analytics
router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  try {
    const studentsRes = await db.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'`);
    const totalStudents = Number(studentsRes.rows[0]?.count || 0);

    const coursesRes = await db.execute(`SELECT COUNT(*) as count FROM courses`);
    const totalCourses = Number(coursesRes.rows[0]?.count || 0);

    const publishedRes = await db.execute(`SELECT COUNT(*) as count FROM courses WHERE status = 'PUBLISHED'`);
    const publishedCourses = Number(publishedRes.rows[0]?.count || 0);

    const ordersRes = await db.execute(`SELECT COUNT(*) as count FROM orders`);
    const totalOrders = Number(ordersRes.rows[0]?.count || 0);

    const paidOrdersRes = await db.execute(`SELECT COUNT(*) as count FROM orders WHERE status = 'PAID'`);
    const paidOrders = Number(paidOrdersRes.rows[0]?.count || 0);

    const revenueRes = await db.execute(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'PAID'`);
    const totalRevenue = Number(revenueRes.rows[0]?.total || 0);

    const certsRes = await db.execute(`SELECT COUNT(*) as count FROM certificates`);
    const totalCertificates = Number(certsRes.rows[0]?.count || 0);

    const pendingReviewsRes = await db.execute(`SELECT COUNT(*) as count FROM reviews WHERE status = 'PENDING'`);
    const pendingReviews = Number(pendingReviewsRes.rows[0]?.count || 0);

    const recentOrdersRes = await db.execute(`
      SELECT o.id, o.amount, o.status, o.created_at, u.name as user_name, c.title as course_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN courses c ON o.course_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `);

    const recentStudentsRes = await db.execute(`
      SELECT id, name, email, created_at
      FROM users
      WHERE role = 'STUDENT'
      ORDER BY created_at DESC
      LIMIT 6
    `);

    return res.json({
      analytics: {
        totalStudents,
        totalCourses,
        publishedCourses,
        totalOrders,
        paidOrders,
        totalRevenue,
        totalCertificates,
        pendingReviews,
        recentOrders: recentOrdersRes.rows.map((r) => ({
          id: r.id,
          userName: r.user_name,
          courseTitle: r.course_title,
          amount: Number(r.amount),
          status: r.status,
          createdAt: r.created_at,
        })),
        recentStudents: recentStudentsRes.rows.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          createdAt: r.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin analytics.' });
  }
});

// ==================== COURSES ====================

// List all courses (any status)
router.get('/courses', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT 
        c.*, 
        cat.name as category_name,
        (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
        (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lessons_count,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as students_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ORDER BY c.created_at DESC
    `);

    const courses = result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      shortDescription: r.short_description,
      fullDescription: r.full_description,
      categoryId: r.category_id,
      categoryName: r.category_name,
      instructor: r.instructor,
      thumbnail: r.thumbnail,
      price: Number(r.price),
      discount: Number(r.discount),
      finalPrice: Math.max(0, Number(r.price) - Number(r.discount)),
      level: r.level,
      language: r.language,
      duration: r.duration,
      status: r.status,
      featured: Boolean(r.featured),
      certificateEnabled: Boolean(r.certificate_enabled),
      modulesCount: Number(r.modules_count),
      lessonsCount: Number(r.lessons_count),
      studentsCount: Number(r.students_count),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return res.json({ courses });
  } catch (error) {
    console.error('Admin get courses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

// Create Course
router.post('/courses', async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      categoryId,
      instructor,
      thumbnail,
      price,
      discount,
      level,
      language,
      duration,
      status,
      featured,
      certificateEnabled,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Course title is required.' });
    }

    const cleanTitle = String(title).trim();
    const cleanSlug = (slug || cleanTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check unique slug
    const existing = await db.execute({
      sql: 'SELECT id FROM courses WHERE slug = ? LIMIT 1',
      args: [cleanSlug],
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A course with this slug or title already exists.' });
    }

    const id = 'crs_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO courses (
          id, title, slug, short_description, full_description, category_id,
          instructor, thumbnail, price, discount, level, language, duration,
          status, featured, certificate_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        cleanTitle,
        cleanSlug,
        shortDescription || '',
        fullDescription || '',
        categoryId || null,
        instructor || '',
        thumbnail || '',
        Number(price) || 0,
        Number(discount) || 0,
        level || 'All Levels',
        language || 'English',
        duration || '',
        status || 'DRAFT',
        featured ? 1 : 0,
        certificateEnabled === false ? 0 : 1,
        now,
        now,
      ],
    });

    return res.status(201).json({ success: true, courseId: id, slug: cleanSlug });
  } catch (error) {
    console.error('Admin create course error:', error);
    return res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Update Course
router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      categoryId,
      instructor,
      thumbnail,
      price,
      discount,
      level,
      language,
      duration,
      status,
      featured,
      certificateEnabled,
    } = req.body;

    const existing = await db.execute({
      sql: 'SELECT id FROM courses WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const cleanTitle = String(title).trim();
    const cleanSlug = (slug || cleanTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const now = new Date().toISOString();

    await db.execute({
      sql: `
        UPDATE courses SET
          title = ?, slug = ?, short_description = ?, full_description = ?, category_id = ?,
          instructor = ?, thumbnail = ?, price = ?, discount = ?, level = ?, language = ?,
          duration = ?, status = ?, featured = ?, certificate_enabled = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [
        cleanTitle,
        cleanSlug,
        shortDescription || '',
        fullDescription || '',
        categoryId || null,
        instructor || '',
        thumbnail || '',
        Number(price) || 0,
        Number(discount) || 0,
        level || 'All Levels',
        language || 'English',
        duration || '',
        status || 'DRAFT',
        featured ? 1 : 0,
        certificateEnabled === false ? 0 : 1,
        now,
        id,
      ],
    });

    return res.json({ success: true, message: 'Course updated successfully.' });
  } catch (error) {
    console.error('Admin update course error:', error);
    return res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Delete Course
router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM courses WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Admin delete course error:', error);
    return res.status(500).json({ error: 'Failed to delete course.' });
  }
});

// ==================== MODULES & LESSONS ====================

// Get course structure (modules with lessons)
router.get('/courses/:courseId/curriculum', async (req, res) => {
  try {
    const { courseId } = req.params;

    const modulesRes = await db.execute({
      sql: 'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC',
      args: [courseId],
    });

    const lessonsRes = await db.execute({
      sql: `
        SELECT l.* 
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        WHERE m.course_id = ?
        ORDER BY l.order_index ASC
      `,
      args: [courseId],
    });

    const modules = modulesRes.rows.map((m) => ({
      id: m.id,
      courseId: m.course_id,
      title: m.title,
      description: m.description,
      orderIndex: m.order_index,
      lessons: lessonsRes.rows
        .filter((l) => l.module_id === m.id)
        .map((l) => ({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          description: l.description,
          videoSource: l.video_source,
          duration: l.duration,
          orderIndex: l.order_index,
          freePreview: Boolean(l.free_preview),
          published: Boolean(l.published),
        })),
    }));

    return res.json({ modules });
  } catch (error) {
    console.error('Curriculum error:', error);
    return res.status(500).json({ error: 'Failed to fetch curriculum.' });
  }
});

// Create Module
router.post('/modules', async (req, res) => {
  try {
    const { courseId, title, description, orderIndex } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ error: 'Course ID and module title are required.' });
    }

    const id = 'mod_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO modules (id, course_id, title, description, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, courseId, String(title).trim(), description || '', Number(orderIndex) || 0, now, now],
    });

    return res.status(201).json({ success: true, moduleId: id });
  } catch (error) {
    console.error('Create module error:', error);
    return res.status(500).json({ error: 'Failed to create module.' });
  }
});

// Update Module
router.put('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, orderIndex } = req.body;
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE modules SET title = ?, description = ?, order_index = ?, updated_at = ? WHERE id = ?`,
      args: [String(title).trim(), description || '', Number(orderIndex) || 0, now, id],
    });

    return res.json({ success: true, message: 'Module updated successfully.' });
  } catch (error) {
    console.error('Update module error:', error);
    return res.status(500).json({ error: 'Failed to update module.' });
  }
});

// Delete Module
router.delete('/modules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM modules WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('Delete module error:', error);
    return res.status(500).json({ error: 'Failed to delete module.' });
  }
});

// Create Lesson
router.post('/lessons', async (req, res) => {
  try {
    const { moduleId, title, description, videoSource, duration, orderIndex, freePreview, published } = req.body;
    if (!moduleId || !title) {
      return res.status(400).json({ error: 'Module ID and lesson title are required.' });
    }

    const id = 'les_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO lessons (id, module_id, title, description, video_source, duration, order_index, free_preview, published, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        moduleId,
        String(title).trim(),
        description || '',
        videoSource || '',
        duration || '',
        Number(orderIndex) || 0,
        freePreview ? 1 : 0,
        published === false ? 0 : 1,
        now,
        now,
      ],
    });

    return res.status(201).json({ success: true, lessonId: id });
  } catch (error) {
    console.error('Create lesson error:', error);
    return res.status(500).json({ error: 'Failed to create lesson.' });
  }
});

// Update Lesson
router.put('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, videoSource, duration, orderIndex, freePreview, published } = req.body;
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE lessons SET
              title = ?, description = ?, video_source = ?, duration = ?,
              order_index = ?, free_preview = ?, published = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        String(title).trim(),
        description || '',
        videoSource || '',
        duration || '',
        Number(orderIndex) || 0,
        freePreview ? 1 : 0,
        published === false ? 0 : 1,
        now,
        id,
      ],
    });

    return res.json({ success: true, message: 'Lesson updated successfully.' });
  } catch (error) {
    console.error('Update lesson error:', error);
    return res.status(500).json({ error: 'Failed to update lesson.' });
  }
});

// Delete Lesson
router.delete('/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM lessons WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Lesson deleted successfully.' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    return res.status(500).json({ error: 'Failed to delete lesson.' });
  }
});

// ==================== CATEGORIES ====================

// List categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT c.*, (SELECT COUNT(*) FROM courses cr WHERE cr.category_id = c.id) as courses_count
      FROM categories c
      ORDER BY c.created_at DESC
    `);
    return res.json({ categories: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Create Category
router.post('/categories', async (req, res) => {
  try {
    const { name, slug, description, image, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });

    const cleanName = String(name).trim();
    const cleanSlug = (slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const id = 'cat_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO categories (id, name, slug, description, image, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, cleanName, cleanSlug, description || '', image || '', active === false ? 0 : 1, now, now],
    });

    return res.status(201).json({ success: true, categoryId: id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// Delete Category
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// ==================== COUPONS ====================

// List coupons
router.get('/coupons', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.json({ coupons: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve coupons.' });
  }
});

// Create Coupon
router.post('/coupons', async (req, res) => {
  try {
    const { code, type, value, maxUses, expiryDate, minimumAmount, active } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'Code and value are required.' });

    const cleanCode = String(code).trim().toUpperCase();
    const id = 'cpn_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO coupons (id, code, type, value, max_uses, used_count, expiry_date, minimum_amount, active, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      args: [
        id,
        cleanCode,
        type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        Number(value),
        Number(maxUses) || 100,
        expiryDate || null,
        Number(minimumAmount) || 0,
        active === false ? 0 : 1,
        now,
      ],
    });

    return res.status(201).json({ success: true, couponId: id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create coupon.' });
  }
});

// Delete Coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM coupons WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete coupon.' });
  }
});

// ==================== REVIEWS ====================

// List all reviews for moderation
router.get('/reviews', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT r.*, u.name as user_name, u.email as user_email, c.title as course_title
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN courses c ON r.course_id = c.id
      ORDER BY r.created_at DESC
    `);
    return res.json({ reviews: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve reviews.' });
  }
});

// Moderate Review (APPROVED / REJECTED)
router.put('/reviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status.' });
    }

    await db.execute({
      sql: 'UPDATE reviews SET status = ? WHERE id = ?',
      args: [status, id],
    });

    return res.json({ success: true, message: `Review ${status.toLowerCase()}.` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
});

// Delete Review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({ sql: 'DELETE FROM reviews WHERE id = ?', args: [id] });
    return res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// ==================== STUDENTS ====================

// List real registered students
router.get('/students', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrollments_count,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id AND o.status = 'PAID') as paid_orders_count,
        (SELECT COUNT(*) FROM certificates c WHERE c.user_id = u.id) as certificates_count
      FROM users u
      WHERE u.role = 'STUDENT'
      ORDER BY u.created_at DESC
    `);

    return res.json({ students: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve students.' });
  }
});

// ==================== ORDERS ====================

// List real orders
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email, c.title as course_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN courses c ON o.course_id = c.id
    `;
    const args: any[] = [];

    if (status && status !== 'ALL') {
      query += ` WHERE o.status = ?`;
      args.push(status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const result = await db.execute({ sql: query, args });
    return res.json({ orders: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

// ==================== CERTIFICATES ====================

// List all issued certificates
router.get('/certificates', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT cert.*, u.name as student_name, u.email as student_email, c.title as course_title
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN courses c ON cert.course_id = c.id
      ORDER BY cert.created_at DESC
    `);
    return res.json({ certificates: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve certificates.' });
  }
});

// ==================== SITE SETTINGS ====================

// Update Site Settings
router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
      await db.execute({
        sql: `INSERT INTO site_settings (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        args: [key, stringVal],
      });
    }
    return res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// View Contact Submissions
router.get('/contact-submissions', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    return res.json({ submissions: result.rows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve contact submissions.' });
  }
});

export default router;
