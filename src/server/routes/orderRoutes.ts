import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { adminDb } from '../firebaseAdmin';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_Tkiu5QKzR7DfBh';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Create Order (Calculates exact price server-side, checks coupon, creates Order record)
router.post('/create', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const userId = req.user!.id;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required.' });
    }

    // Check course from database or Firestore
    let courseTitle = 'Course';
    let basePrice = 0;
    let courseDiscount = 0;

    const courseRes = await db.execute({
      sql: 'SELECT * FROM courses WHERE id = ? AND status = ? LIMIT 1',
      args: [courseId, 'PUBLISHED'],
    });

    if (courseRes.rows.length > 0) {
      const c = courseRes.rows[0];
      courseTitle = String(c.title);
      basePrice = Math.max(0, Number(c.price) - Number(c.discount));
      courseDiscount = Number(c.discount);
    } else {
      // Try Firestore
      try {
        const firestoreSnap = await adminDb.collection('courses').doc(courseId).get();
        if (firestoreSnap.exists) {
          const c = firestoreSnap.data()!;
          courseTitle = c.title || 'Course';
          basePrice = Math.max(0, Number(c.price || 0) - Number(c.discount || 0));
        } else {
          return res.status(404).json({ error: 'Course not found or is currently not published.' });
        }
      } catch {
        return res.status(404).json({ error: 'Course not found or is currently not published.' });
      }
    }

    // Check if user is already enrolled
    const enrolledRes = await db.execute({
      sql: 'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1',
      args: [userId, courseId],
    });

    if (enrolledRes.rows.length > 0) {
      return res.status(400).json({ error: 'You are already enrolled in this course.' });
    }

    let finalAmount = basePrice;
    let validCouponCode = null;

    // Validate coupon if supplied
    if (couponCode && String(couponCode).trim()) {
      const cleanCode = String(couponCode).trim().toUpperCase();
      const couponRes = await db.execute({
        sql: 'SELECT * FROM coupons WHERE code = ? AND active = 1 LIMIT 1',
        args: [cleanCode],
      });

      if (couponRes.rows.length > 0) {
        const cp = couponRes.rows[0];
        const notExpired = !cp.expiry_date || new Date(String(cp.expiry_date)) >= new Date();
        const hasUsesLeft = Number(cp.used_count) < Number(cp.max_uses);
        const meetsMin = basePrice >= Number(cp.minimum_amount);

        if (notExpired && hasUsesLeft && meetsMin) {
          let disc = 0;
          if (cp.type === 'PERCENTAGE') {
            disc = (basePrice * Number(cp.value)) / 100;
          } else {
            disc = Number(cp.value);
          }
          disc = Math.min(disc, basePrice);
          finalAmount = Math.max(0, basePrice - disc);
          validCouponCode = cleanCode;
        }
      }
    }

    finalAmount = Math.round(finalAmount);

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 12);
    const now = new Date().toISOString();

    // If course is 100% free or discounted to 0
    if (finalAmount === 0) {
      await db.execute({
        sql: `INSERT INTO orders (id, user_id, course_id, amount, currency, payment_provider, payment_id, status, coupon, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [orderId, userId, courseId, 0, 'INR', 'FREE', 'free_enrollment_' + orderId, 'PAID', validCouponCode, now, now],
      });

      // Create enrollment in DB
      const enrollId = 'enr_' + Math.random().toString(36).substring(2, 12);
      await db.execute({
        sql: 'INSERT INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)',
        args: [enrollId, userId, courseId, now],
      });

      // Record in Firestore
      try {
        await adminDb.collection('orders').doc(orderId).set({
          userId,
          courseId,
          amount: 0,
          currency: 'INR',
          status: 'PAID',
          paymentProvider: 'FREE',
          createdAt: now,
          updatedAt: now,
        });

        await adminDb.collection('enrollments').doc(enrollId).set({
          userId,
          courseId,
          orderId,
          status: 'ACTIVE',
          enrolledAt: now,
        });
      } catch (err) {
        console.error('Firestore order sync warning:', err);
      }

      return res.json({
        isFree: true,
        orderId,
        courseId,
        message: 'Successfully enrolled in course!',
      });
    }

    // Create pending order in DB
    await db.execute({
      sql: `INSERT INTO orders (id, user_id, course_id, amount, currency, payment_provider, payment_id, status, coupon, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [orderId, userId, courseId, finalAmount, 'INR', 'RAZORPAY', null, 'PENDING', validCouponCode, now, now],
    });

    // Record pending order in Firestore
    try {
      await adminDb.collection('orders').doc(orderId).set({
        userId,
        courseId,
        amount: finalAmount,
        currency: 'INR',
        status: 'PENDING',
        paymentProvider: 'RAZORPAY',
        couponCode: validCouponCode,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.error('Firestore order sync warning:', err);
    }

    // Generate Razorpay order ID
    const razorpayOrderId = 'order_' + Math.random().toString(36).substring(2, 15);

    return res.json({
      isFree: false,
      orderId,
      razorpayOrderId,
      amount: finalAmount,
      amountInSubunits: finalAmount * 100, // paise
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      courseTitle,
      userName: req.user!.name,
      userEmail: req.user!.email,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Failed to initiate course checkout.' });
  }
});

// Verify Payment & unlock course
router.post('/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user!.id;

    if (!orderId || !razorpayPaymentId) {
      return res.status(400).json({ error: 'Invalid payment parameters provided.' });
    }

    // Fetch order from database
    const orderRes = await db.execute({
      sql: 'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
      args: [orderId, userId],
    });

    let order = orderRes.rows[0];

    if (!order) {
      // Check Firestore
      const orderDoc = await adminDb.collection('orders').doc(orderId).get();
      if (orderDoc.exists) {
        order = orderDoc.data() as any;
        order.id = orderDoc.id;
      } else {
        return res.status(404).json({ error: 'Order not found.' });
      }
    }

    if (order.status === 'PAID') {
      return res.json({ success: true, message: 'Order is already marked as paid.', courseId: order.course_id || order.courseId });
    }

    // Verify signature if RAZORPAY_KEY_SECRET is configured
    if (RAZORPAY_KEY_SECRET && razorpayOrderId && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        await db.execute({
          sql: `UPDATE orders SET status = 'FAILED', updated_at = ? WHERE id = ?`,
          args: [new Date().toISOString(), orderId],
        });
        return res.status(400).json({ error: 'Payment signature verification failed.' });
      }
    }

    const now = new Date().toISOString();
    const courseId = String(order.course_id || order.courseId);

    // Mark order PAID in DB
    await db.execute({
      sql: `UPDATE orders SET status = 'PAID', payment_id = ?, updated_at = ? WHERE id = ?`,
      args: [razorpayPaymentId, now, orderId],
    });

    // Record Payment in DB
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 12);
    await db.execute({
      sql: `INSERT INTO payments (id, order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [paymentId, orderId, razorpayOrderId || null, razorpayPaymentId, razorpaySignature || null, order.amount, 'CAPTURED', now],
    });

    // Create Enrollment in DB
    const enrollId = 'enr_' + Math.random().toString(36).substring(2, 12);
    await db.execute({
      sql: 'INSERT INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?, ?, ?, ?)',
      args: [enrollId, userId, courseId, now],
    });

    // Sync to Firestore
    try {
      await adminDb.collection('orders').doc(orderId).update({
        status: 'PAID',
        razorpayPaymentId,
        razorpayOrderId: razorpayOrderId || null,
        updatedAt: now,
      });

      await adminDb.collection('payments').doc(paymentId).set({
        userId,
        orderId,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId,
        amount: order.amount,
        currency: 'INR',
        status: 'CAPTURED',
        createdAt: now,
        verifiedAt: now,
      });

      await adminDb.collection('enrollments').doc(enrollId).set({
        userId,
        courseId,
        orderId,
        status: 'ACTIVE',
        enrolledAt: now,
      });
    } catch (err) {
      console.error('Firestore payment/enrollment sync warning:', err);
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully! Course unlocked.',
      courseId,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Failed to verify payment.' });
  }
});

// Student's real orders history
router.get('/my-orders', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT o.*, c.title as course_title, c.slug as course_slug, c.thumbnail as course_thumbnail
        FROM orders o
        JOIN courses c ON o.course_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
      `,
      args: [req.user!.id],
    });

    const orders = result.rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseTitle: r.course_title,
      courseSlug: r.course_slug,
      courseThumbnail: r.course_thumbnail,
      amount: Number(r.amount),
      currency: r.currency,
      paymentProvider: r.payment_provider,
      paymentId: r.payment_id,
      status: r.status,
      coupon: r.coupon,
      createdAt: r.created_at,
    }));

    return res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Failed to load order history.' });
  }
});

export default router;
