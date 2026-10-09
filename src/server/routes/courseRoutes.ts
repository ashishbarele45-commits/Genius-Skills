import { Router } from 'express';
import { adminDb } from '../firebaseAdmin';
import { db } from '../db';
import { optionalAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// GET all published courses with search, filters, sort (Firestore with Database fallback)
router.get('/', async (req, res) => {
  const {
    search,
    category,
    level,
    featured,
    sort,
  } = req.query;

  try {
    let q: any = adminDb.collection('courses');
    
    if (level && level !== 'all') {
      q = q.where('level', '==', String(level));
    }

    if (featured === 'true' || featured === '1') {
      q = q.where('featured', '==', true);
    }

    if (category) {
      q = q.where('categoryId', '==', String(category));
    }

    let snap = await q.get();
    
    let courses = await Promise.all(snap.docs.map(async (doc: any) => {
      const data = doc.data();
      
      let categoryName = null;
      if (data.categoryId) {
        try {
          const catDoc = await adminDb.collection('categories').doc(data.categoryId).get();
          if (catDoc.exists) {
            categoryName = catDoc.data()?.name;
          }
        } catch (catErr) {
          console.error(`Error fetching category ${data.categoryId}:`, catErr);
        }
      }

      const modulesSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').get();
      
      let lessonsCount = 0;
      for (const mDoc of modulesSnap.docs) {
        const lSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').doc(mDoc.id).collection('lessons').get();
        lessonsCount += lSnap.size;
      }

      const reviewsSnap = await adminDb.collection('reviews')
        .where('courseId', '==', doc.id)
        .where('status', '==', 'APPROVED')
        .get();
      
      let totalRating = 0;
      reviewsSnap.docs.forEach(rd => totalRating += (rd.data().rating || 0));
      const avgRating = reviewsSnap.size > 0 ? Number((totalRating / reviewsSnap.size).toFixed(1)) : 0;

      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        categoryId: data.categoryId,
        categoryName: categoryName || data.categoryName,
        instructor: data.instructor,
        thumbnail: data.thumbnail,
        price: Number(data.price || 0),
        discount: Number(data.discount || 0),
        finalPrice: Math.max(0, Number(data.price || 0) - Number(data.discount || 0)),
        level: data.level,
        language: data.language,
        duration: data.duration,
        status: data.status,
        featured: Boolean(data.featured),
        certificateEnabled: Boolean(data.certificateEnabled),
        modulesCount: modulesSnap.size,
        lessonsCount: lessonsCount,
        averageRating: avgRating,
        reviewCount: reviewsSnap.size,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    }));

    if (search) {
      const term = String(search).toLowerCase();
      courses = courses.filter(c => 
        c.title.toLowerCase().includes(term) || 
        (c.shortDescription && c.shortDescription.toLowerCase().includes(term)) ||
        (c.instructor && c.instructor.toLowerCase().includes(term))
      );
    }

    if (sort === 'price_asc') {
      courses.sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (sort === 'price_desc') {
      courses.sort((a, b) => b.finalPrice - a.finalPrice);
    } else if (sort === 'rating') {
      courses.sort((a, b) => b.averageRating - a.averageRating);
    }

    return res.json({ courses });
  } catch (_firestoreError) {
    // Graceful fallback to persistent SQLite database
    try {
      let sql = `
        SELECT 
          c.*, 
          cat.name as category_name,
          (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as modules_count,
          (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = c.id) as lessons_count,
          (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as students_count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.status = 'PUBLISHED'
      `;
      const args: any[] = [];

      if (category) {
        sql += ` AND c.category_id = ?`;
        args.push(String(category));
      }
      if (level && level !== 'all') {
        sql += ` AND c.level = ?`;
        args.push(String(level));
      }
      if (featured === 'true' || featured === '1') {
        sql += ` AND c.featured = 1`;
      }
      if (search) {
        sql += ` AND (c.title LIKE ? OR c.short_description LIKE ?)`;
        args.push(`%${search}%`, `%${search}%`);
      }

      sql += ` ORDER BY c.created_at DESC`;

      const result = await db.execute({ sql, args });

      const courses = result.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        slug: String(r.slug),
        shortDescription: String(r.short_description || ''),
        fullDescription: String(r.full_description || ''),
        categoryId: r.category_id ? String(r.category_id) : undefined,
        categoryName: r.category_name ? String(r.category_name) : undefined,
        instructor: String(r.instructor || 'Instructor'),
        thumbnail: r.thumbnail ? String(r.thumbnail) : undefined,
        price: Number(r.price || 0),
        discount: Number(r.discount || 0),
        finalPrice: Math.max(0, Number(r.price || 0) - Number(r.discount || 0)),
        level: String(r.level || 'All Levels'),
        language: String(r.language || 'English'),
        duration: r.duration ? String(r.duration) : undefined,
        status: String(r.status),
        featured: Boolean(r.featured),
        certificateEnabled: Boolean(r.certificate_enabled),
        modulesCount: Number(r.modules_count || 0),
        lessonsCount: Number(r.lessons_count || 0),
        studentsCount: Number(r.students_count || 0),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));

      return res.json({ courses });
    } catch (dbErr: any) {
      console.error('Database course fetch fallback error:', dbErr);
      return res.json({ courses: [] });
    }
  }
});

// GET course by slug (Course details page implementation for Firestore)
router.get('/:slug', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { slug } = req.params;
  try {
    const snap = await adminDb.collection('courses').where('slug', '==', slug).limit(1).get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (data.status !== 'PUBLISHED' && req.user?.role !== 'ADMIN') {
      return res.status(404).json({ error: 'Course not found or is currently unpublished.' });
    }

    // Fetch modules and lessons
    const modulesSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').orderBy('orderIndex', 'asc').get();
    const modules = [];
    
    for (const mDoc of modulesSnap.docs) {
      const mData = mDoc.data();
      const lessonsSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').doc(mDoc.id).collection('lessons')
        .where('published', '==', true)
        .orderBy('orderIndex', 'asc')
        .get();
        
      modules.push({
        id: mDoc.id,
        title: mData.title,
        description: mData.description,
        orderIndex: mData.orderIndex,
        lessons: lessonsSnap.docs.map(lDoc => ({
          id: lDoc.id,
          moduleId: mDoc.id,
          title: lDoc.data().title,
          description: lDoc.data().description,
          duration: lDoc.data().duration,
          orderIndex: lDoc.data().orderIndex,
          freePreview: Boolean(lDoc.data().freePreview),
        }))
      });
    }

    // Check user enrollment
    let isEnrolled = false;
    if (req.user) {
      const enrollSnap = await adminDb.collection('enrollments')
        .where('userId', '==', req.user.id)
        .where('courseId', '==', doc.id)
        .limit(1)
        .get();
      isEnrolled = !enrollSnap.empty;
    }

    // Fetch reviews
    const reviewsSnap = await adminDb.collection('reviews')
      .where('courseId', '==', doc.id)
      .where('status', '==', 'APPROVED')
      .orderBy('createdAt', 'desc')
      .get();
    
    const reviews = reviewsSnap.docs.map(rDoc => ({
      id: rDoc.id,
      rating: Number(rDoc.data().rating),
      comment: rDoc.data().comment,
      createdAt: rDoc.data().createdAt?.toDate ? rDoc.data().createdAt.toDate().toISOString() : rDoc.data().createdAt,
      userName: rDoc.data().userName,
    }));

    let totalRating = 0;
    reviews.forEach(r => totalRating += r.rating);
    const avgRating = reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : 0;

    return res.json({
      course: {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        instructor: data.instructor,
        thumbnail: data.thumbnail,
        price: Number(data.price || 0),
        discount: Number(data.discount || 0),
        finalPrice: Math.max(0, Number(data.price || 0) - Number(data.discount || 0)),
        level: data.level,
        language: data.language,
        duration: data.duration,
        status: data.status,
        featured: Boolean(data.featured),
        certificateEnabled: Boolean(data.certificateEnabled),
        averageRating: avgRating,
        reviewCount: reviews.length,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        modules,
        reviews,
        isEnrolled,
      },
    });
  } catch (_firestoreError) {
    // Database fallback
    try {
      const courseRes = await db.execute({
        sql: `SELECT c.*, cat.name as category_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.slug = ? OR c.id = ? LIMIT 1`,
        args: [slug, slug],
      });

      if (courseRes.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found.' });
      }

      const r = courseRes.rows[0];
      const courseId = String(r.id);

      const modulesRes = await db.execute({
        sql: `SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC`,
        args: [courseId],
      });

      const modules = await Promise.all(
        modulesRes.rows.map(async (m) => {
          const lessonsRes = await db.execute({
            sql: `SELECT * FROM lessons WHERE module_id = ? AND published = 1 ORDER BY order_index ASC`,
            args: [m.id],
          });
          return {
            id: String(m.id),
            title: String(m.title),
            description: m.description ? String(m.description) : undefined,
            orderIndex: Number(m.order_index) || 0,
            lessons: lessonsRes.rows.map((l) => ({
              id: String(l.id),
              moduleId: String(m.id),
              title: String(l.title),
              description: l.description ? String(l.description) : undefined,
              duration: l.duration ? String(l.duration) : undefined,
              orderIndex: Number(l.order_index) || 0,
              freePreview: Boolean(l.free_preview),
            })),
          };
        })
      );

      let isEnrolled = false;
      if (req.user) {
        const enrollRes = await db.execute({
          sql: `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
          args: [req.user.id, courseId],
        });
        isEnrolled = enrollRes.rows.length > 0;
      }

      return res.json({
        course: {
          id: courseId,
          title: String(r.title),
          slug: String(r.slug),
          shortDescription: String(r.short_description || ''),
          fullDescription: String(r.full_description || ''),
          categoryId: r.category_id ? String(r.category_id) : undefined,
          categoryName: r.category_name ? String(r.category_name) : undefined,
          instructor: String(r.instructor || 'Instructor'),
          thumbnail: r.thumbnail ? String(r.thumbnail) : undefined,
          price: Number(r.price || 0),
          discount: Number(r.discount || 0),
          finalPrice: Math.max(0, Number(r.price || 0) - Number(r.discount || 0)),
          level: String(r.level || 'All Levels'),
          language: String(r.language || 'English'),
          duration: r.duration ? String(r.duration) : undefined,
          status: String(r.status),
          featured: Boolean(r.featured),
          certificateEnabled: Boolean(r.certificate_enabled),
          averageRating: 5.0,
          reviewCount: 0,
          createdAt: String(r.created_at),
          modules,
          reviews: [],
          isEnrolled,
        },
      });
    } catch (dbErr: any) {
      console.error('Course details db fallback error:', dbErr);
      return res.status(500).json({ error: 'Failed to load course details.' });
    }
  }
});

// GET LMS course player (Real server-side access control for Firestore)
router.get('/:slug/player', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { slug } = req.params;

    const snap = await adminDb.collection('courses').where('slug', '==', slug).limit(1).get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const courseId = doc.id;

    // Verify user enrollment
    let isEnrolled = false;
    let userId = req.user?.id;

    if (userId) {
      if (req.user?.role === 'ADMIN') {
        isEnrolled = true;
      } else {
        const enrollSnap = await adminDb.collection('enrollments')
          .where('userId', '==', userId)
          .where('courseId', '==', courseId)
          .limit(1)
          .get();
        isEnrolled = !enrollSnap.empty;
      }
    }

    // Get user progress
    let completedLessonIds: string[] = [];
    if (userId) {
      const progressSnap = await adminDb.collection('users').doc(userId).collection('progress')
        .where('courseId', '==', courseId)
        .where('completed', '==', true)
        .get();
      completedLessonIds = progressSnap.docs.map(pDoc => pDoc.id);
    }

    // Get curriculum structure
    const modulesSnap = await adminDb.collection('courses').doc(courseId).collection('modules').orderBy('orderIndex', 'asc').get();
    const modules = [];
    let totalLessons = 0;
    
    for (const mDoc of modulesSnap.docs) {
      const mData = mDoc.data();
      const lessonsSnap = await adminDb.collection('courses').doc(courseId).collection('modules').doc(mDoc.id).collection('lessons')
        .where('published', '==', true)
        .orderBy('orderIndex', 'asc')
        .get();
        
      totalLessons += lessonsSnap.size;
      
      modules.push({
        id: mDoc.id,
        title: mData.title,
        description: mData.description,
        orderIndex: mData.orderIndex,
        lessons: lessonsSnap.docs.map(lDoc => {
          const lData = lDoc.data();
          const isFree = Boolean(lData.freePreview);
          const canAccessVideo = isEnrolled || isFree;
          
          return {
            id: lDoc.id,
            moduleId: mDoc.id,
            title: lData.title,
            description: lData.description,
            duration: lData.duration,
            orderIndex: lData.orderIndex,
            freePreview: isFree,
            videoSource: canAccessVideo ? lData.videoSource : null,
            isLocked: !canAccessVideo,
            completed: completedLessonIds.includes(lDoc.id),
          };
        })
      });
    }

    const progressPercent = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

    return res.json({
      course: {
        id: courseId,
        title: data.title,
        slug: data.slug,
        certificateEnabled: Boolean(data.certificateEnabled),
      },
      isEnrolled,
      progress: {
        totalLessons,
        completedCount: completedLessonIds.length,
        progressPercent,
        completedLessonIds,
      },
      modules,
    });
  } catch (error) {
    console.error('Course player error:', error);
    return res.status(500).json({ error: 'Failed to load course player from Firestore.' });
  }
});

export default router;
