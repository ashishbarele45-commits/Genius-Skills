import { Router } from 'express';
import { adminDb } from '../firebaseAdmin';
import { optionalAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// GET all published courses with search, filters, sort (Firestore implementation)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      level,
      featured,
      sort,
    } = req.query;

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

    // Default to newest first (createdAt desc)
    let snap = await q.get();
    
    let courses = await Promise.all(snap.docs.map(async (doc: any) => {
      const data = doc.data();
      
      // Fetch category name if categoryId exists
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

      // Get modules count
      const modulesSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').get();
      
      // Calculate lessons count
      let lessonsCount = 0;
      for (const mDoc of modulesSnap.docs) {
        const lSnap = await adminDb.collection('courses').doc(doc.id).collection('modules').doc(mDoc.id).collection('lessons').get();
        lessonsCount += lSnap.size;
      }

      // Get average rating (In real apps, these should be denormalized on the course doc)
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

    // Post-query search filter (Firestore doesn't support full-text search directly)
    if (search) {
      const term = String(search).toLowerCase();
      courses = courses.filter(c => 
        c.title.toLowerCase().includes(term) || 
        (c.shortDescription && c.shortDescription.toLowerCase().includes(term)) ||
        (c.instructor && c.instructor.toLowerCase().includes(term))
      );
    }

    // Post-query sorting
    if (sort === 'price_asc') {
      courses.sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (sort === 'price_desc') {
      courses.sort((a, b) => b.finalPrice - a.finalPrice);
    } else if (sort === 'rating') {
      courses.sort((a, b) => b.averageRating - a.averageRating);
    }

    return res.json({ courses });
  } catch (error: any) {
    console.error('Fetch courses error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details
    });
    return res.status(500).json({ error: `Failed to retrieve courses from Firestore: ${error.message}` });
  }
});

// GET course by slug (Course details page implementation for Firestore)
router.get('/:slug', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { slug } = req.params;

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
  } catch (error) {
    console.error('Course details error:', error);
    return res.status(500).json({ error: 'Failed to load course details from Firestore.' });
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
